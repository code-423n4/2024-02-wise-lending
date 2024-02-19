// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./OwnableMaster.sol";

import "./InterfaceHub/IAaveHubLite.sol";
import "./InterfaceHub/IPositionNFTs.sol";
import "./InterfaceHub/IWiseSecurity.sol";
import "./InterfaceHub/IWiseOracleHub.sol";
import "./InterfaceHub/IFeeManagerLight.sol";

import "./TransferHub/WrapperHelper.sol";
import "./TransferHub/SendValueHelper.sol";

error DeadOracle();
error NotPowerFarm();
error InvalidAction();
error InvalidCaller();
error PositionLocked();
error LiquidatorIsInPowerFarm();
error PositionHasCollateral();
error PositionHasBorrow();
error InvalidAddress();
error InvalidLiquidator();
error ValueIsZero();
error ValueNotZero();
error TooManyTokens();

contract WiseLendingDeclaration is
    OwnableMaster,
    WrapperHelper,
    SendValueHelper
{
    event FundsDeposited(
        address indexed sender,
        uint256 indexed nftId,
        address indexed token,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event FundsSolelyDeposited(
        address indexed sender,
        uint256 indexed nftId,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event FundsWithdrawn(
        address indexed sender,
        uint256 indexed nftId,
        address indexed token,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event FundsWithdrawnOnBehalf(
        address indexed sender,
        uint256 indexed nftId,
        address indexed token,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event FundsSolelyWithdrawn(
        address indexed sender,
        uint256 indexed nftId,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event FundsBorrowed(
        address indexed borrower,
        uint256 indexed nftId,
        address indexed token,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event FundsBorrowedOnBehalf(
        address indexed sender,
        uint256 indexed nftId,
        address indexed token,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event FundsReturned(
        address indexed sender,
        address indexed token,
        uint256 indexed nftId,
        uint256 totalPayment,
        uint256 totalPaymentShares,
        uint256 timestamp
    );

    constructor(
        address _master,
        address _wiseOracleHub,
        address _nftContract
    )
        OwnableMaster(
            _master
        )
        WrapperHelper(
            IWiseOracleHub(
                _wiseOracleHub
            ).WETH_ADDRESS()
        )
    {
        if (_wiseOracleHub == ZERO_ADDRESS) {
            revert NoValue();
        }

        if (_nftContract == ZERO_ADDRESS) {
            revert NoValue();
        }

        WISE_ORACLE = IWiseOracleHub(
            _wiseOracleHub
        );

        WETH_ADDRESS = WISE_ORACLE.WETH_ADDRESS();

        POSITION_NFT = IPositionNFTs(
            _nftContract
        );

        FEE_MANAGER_NFT = POSITION_NFT.FEE_MANAGER_NFT();
    }

    function setSecurity(
        address _wiseSecurity
    )
        external
        onlyMaster
    {
        if (address(WISE_SECURITY) > ZERO_ADDRESS) {
            revert InvalidAction();
        }

        WISE_SECURITY = IWiseSecurity(
            _wiseSecurity
        );

        FEE_MANAGER = IFeeManagerLight(
            WISE_SECURITY.FEE_MANAGER()
        );

        AAVE_HUB_ADDRESS = WISE_SECURITY.AAVE_HUB();
    }

    // AaveHub address
    address internal AAVE_HUB_ADDRESS;

    // Wrapped ETH address
    address public immutable WETH_ADDRESS;

    // Nft id for feeManager
    uint256 immutable FEE_MANAGER_NFT;

    uint256 internal constant MIN_BORROW_SHARE_PRICE = 5 * PRECISION_FACTOR_E18
        / 10;

    // WiseSecurity interface
    IWiseSecurity public WISE_SECURITY;

    // FeeManager interface
    IFeeManagerLight internal FEE_MANAGER;

    // NFT contract interface for positions
    IPositionNFTs public immutable POSITION_NFT;

    // OraceHub interface
    IWiseOracleHub public immutable WISE_ORACLE;

    // check if it is a powerfarm
    bool internal powerFarmCheck;

    uint256 internal constant GHOST_AMOUNT = 1E3;

    // Structs ------------------------------------------

    struct LendingEntry {
        bool unCollateralized;
        uint256 shares;
    }

    struct BorrowRatesEntry {
        uint256 pole;
        uint256 deltaPole;
        uint256 minPole;
        uint256 maxPole;
        uint256 multiplicativeFactor;
    }

    struct AlgorithmEntry {
        bool increasePole;
        uint256 bestPole;
        uint256 maxValue;
        uint256 previousValue;
    }

    struct GlobalPoolEntry {
        uint256 totalPool;
        uint256 utilization;
        uint256 totalBareToken;
        uint256 poolFee;
    }

    struct LendingPoolEntry {
        uint256 pseudoTotalPool;
        uint256 totalDepositShares;
        uint256 collateralFactor;
    }

    struct BorrowPoolEntry {
        bool allowBorrow;
        uint256 pseudoTotalBorrowAmount;
        uint256 totalBorrowShares;
        uint256 borrowRate;
    }

    struct TimestampsPoolEntry {
        uint256 timeStamp;
        uint256 timeStampScaling;
        uint256 initialTimeStamp;
    }

    struct CoreLiquidationStruct {
        uint256 nftId;
        uint256 nftIdLiquidator;
        address caller;
        address tokenToPayback;
        address tokenToRecieve;
        uint256 paybackAmount;
        uint256 shareAmountToPay;
        uint256 maxFeeETH;
        uint256 baseRewardLiquidation;
        address[] lendTokens;
        address[] borrowTokens;
    }

    modifier onlyAaveHub() {
        _onlyAaveHub();
        _;
    }

    function _onlyAaveHub()
        private
        view
    {
        if (msg.sender != AAVE_HUB_ADDRESS) {
            revert InvalidCaller();
        }
    }

    // Position mappings ------------------------------------------
    mapping(address => uint256) internal bufferIncrease;
    mapping(address => uint256) public maxDepositValueToken;

    mapping(uint256 => address[]) public positionLendTokenData;
    mapping(uint256 => address[]) public positionBorrowTokenData;

    mapping(uint256 => mapping(address => uint256)) public userBorrowShares;
    mapping(uint256 => mapping(address => uint256)) public pureCollateralAmount;
    mapping(uint256 => mapping(address => LendingEntry)) public userLendingData;

    // Struct mappings -------------------------------------
    mapping(address => BorrowRatesEntry) public borrowRatesData;
    mapping(address => AlgorithmEntry) public algorithmData;
    mapping(address => GlobalPoolEntry) public globalPoolData;
    mapping(address => LendingPoolEntry) public lendingPoolData;
    mapping(address => BorrowPoolEntry) public borrowPoolData;
    mapping(address => TimestampsPoolEntry) public timestampsPoolData;

    // Bool mappings -------------------------------------
    mapping(uint256 => bool) public positionLocked;
    mapping(address => bool) internal parametersLocked;
    mapping(address => bool) public verifiedIsolationPool;

    // Hash mappings -------------------------------------
    mapping(bytes32 => bool) internal hashMapPositionBorrow;
    mapping(bytes32 => bool) internal hashMapPositionLending;

    // PRECISION FACTORS ------------------------------------
    uint256 internal constant PRECISION_FACTOR_E16 = 1E16;
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;
    uint256 internal constant PRECISION_FACTOR_E36 = PRECISION_FACTOR_E18 * PRECISION_FACTOR_E18;

    // TIME CONSTANTS --------------------------------------
    uint256 internal constant ONE_YEAR = 365 days;
    uint256 internal constant THREE_HOURS = 3 hours;
    uint256 internal constant PRECISION_FACTOR_YEAR = PRECISION_FACTOR_E18 * ONE_YEAR;

    // Two months in seconds:
    // Norming change in pole value that it steps from min to max value
    // within two month (if nothing changes)
    uint256 internal constant NORMALISATION_FACTOR = 4838400;

    // Default boundary values for pool creation.
    uint256 internal constant LOWER_BOUND_MAX_RATE = 100 * PRECISION_FACTOR_E16;
    uint256 internal constant UPPER_BOUND_MAX_RATE = 300 * PRECISION_FACTOR_E16;

    // LASA CONSTANTS -------------------------
    uint256 internal constant THRESHOLD_SWITCH_DIRECTION = 90 * PRECISION_FACTOR_E16;
    uint256 internal constant THRESHOLD_RESET_RESONANCE_FACTOR = 75 * PRECISION_FACTOR_E16;

    // MORE THRESHHOLD VALUES

    uint256 internal constant MAX_COLLATERAL_FACTOR = 85 * PRECISION_FACTOR_E16;
    uint256 internal constant MAX_TOTAL_TOKEN_NUMBER = 8;

    // APR RESTRICTIONS
    uint256 internal constant RESTRICTION_FACTOR = 10
        * PRECISION_FACTOR_E36
        / PRECISION_FACTOR_YEAR;
}
