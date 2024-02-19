// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../../InterfaceHub/IERC20.sol";
import "../../InterfaceHub/IAave.sol";
import "../../InterfaceHub/IPendle.sol";
import "../../InterfaceHub/IAaveHub.sol";
import "../../InterfaceHub/IWiseLending.sol";
import "../../InterfaceHub/IStETH.sol";
import "../../InterfaceHub/IWiseSecurity.sol";
import "../../InterfaceHub/IPositionNFTs.sol";
import "../../InterfaceHub/IWiseOracleHub.sol";
import "../../InterfaceHub/IBalancerFlashloan.sol";
import "../../InterfaceHub/ICurve.sol";
import "../../InterfaceHub/IUniswapV3.sol";

import "../../TransferHub/WrapperHelper.sol";
import "../../TransferHub/TransferHelper.sol";
import "../../TransferHub/ApprovalHelper.sol";
import "../../TransferHub/SendValueHelper.sol";

error Deactivated();
error InvalidParam();
error AccessDenied();
error LeverageTooHigh();
error DebtRatioTooLow();
error NotBalancerVault();
error DebtRatioTooHigh();
error ResultsInBadDebt();
error TooMuchValueLost();
error CollateralFactorTooHigh();
error WrongChainId();

contract PendlePowerFarmDeclarations is
    WrapperHelper,
    TransferHelper,
    ApprovalHelper,
    SendValueHelper
{
    // Allows to pause some functions
    bool public isShutdown;

    // Protects from callbacks (flashloan balancer)
    bool public allowEnter;

    // Ratio between borrow and lend
    uint256 public collateralFactor;

    // Adjustable by admin of the contract
    uint256 public minDepositEthAmount;

    address public immutable aaveTokenAddresses;
    address public immutable borrowTokenAddresses;

    address public immutable ENTRY_ASSET;
    address public immutable PENDLE_CHILD;

    // RESTRICTION VALUES

    uint256 internal constant MAX_COLLATERAL_FACTOR = 95 * PRECISION_FACTOR_E16;

    // Interfaces

    IAave public immutable AAVE;
    IAaveHub public immutable AAVE_HUB;
    IWiseLending public immutable WISE_LENDING;
    IWiseOracleHub public immutable ORACLE_HUB;
    IWiseSecurity public immutable WISE_SECURITY;
    IBalancerVault public immutable BALANCER_VAULT;
    IPositionNFTs public immutable POSITION_NFT;
    IStETH public immutable ST_ETH;
    ICurve public immutable CURVE;
    IUniswapV3 public immutable UNISWAP_V3_ROUTER;

    IPendleSy public immutable PENDLE_SY;
    IPendleRouter public immutable PENDLE_ROUTER;
    IPendleMarket public immutable PENDLE_MARKET;
    IPendleRouterStatic public immutable PENDLE_ROUTER_STATIC;

    address internal immutable WETH_ADDRESS;

    address immutable AAVE_ADDRESS;

    address internal constant BALANCER_ADDRESS = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;

    address immutable AAVE_HUB_ADDRESS;

    address immutable AAVE_WETH_ADDRESS;

    address internal constant ST_ETH_ADDRESS = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;

    // Uniswap fee for arbitrum
    uint24 internal constant UNISWAP_V3_FEE = 100;

    // Math constant for computations
    uint256 internal constant MAX_AMOUNT = type(uint256).max;
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;
    uint256 internal constant PRECISION_FACTOR_E16 = 1E16;
    uint256 internal constant MAX_LEVERAGE = 15 * PRECISION_FACTOR_E18;

    uint256 internal constant ETH_CHAIN_ID = 1;
    uint256 internal constant ARB_CHAIN_ID = 42161;

    // Mapping of {keyNFT} to type of pool
    mapping(uint256 => bool) public isAave;

    event FarmEntry(
        uint256 indexed keyId,
        uint256 indexed wiseLendingNFT,
        uint256 indexed leverage,
        uint256 amount,
        uint256 timestamp
    );

    event FarmExit(
        uint256 indexed keyId,
        uint256 indexed wiseLendingNFT,
        uint256 amount,
        uint256 timestamp
    );

    event FarmStatus(
        bool indexed state,
        uint256 timestamp
    );

    event ManualPaybackShares(
        uint256 indexed keyId,
        uint256 indexed wiseLendingNFT,
        uint256 amount,
        uint256 timestamp
    );

    event ManualWithdrawShares(
        uint256 indexed keyId,
        uint256 indexed wiseLendingNFT,
        uint256 amount,
        uint256 timestamp
    );

    event MinDepositChange(
        uint256 minDepositEthAmount,
        uint256 timestamp
    );

    event ETHReceived(
        uint256 amount,
        address from
    );

    event RegistrationFarm(
        uint256 nftId,
        uint256 timestamp
    );

    constructor(
        address _wiseLendingAddress,
        address _pendleChilTokenAddress,
        address _pendleRouter,
        address _entryAsset,
        address _pendleSy,
        address _underlyingMarket,
        address _routerStatic,
        address _dexAddress,
        uint256 _collateralFactor
    )
        WrapperHelper(
            IWiseLending(
                _wiseLendingAddress
            ).WETH_ADDRESS()
        )
    {
        PENDLE_ROUTER_STATIC = IPendleRouterStatic(
            _routerStatic
        );

        PENDLE_MARKET = IPendleMarket(
            _underlyingMarket
        );

        PENDLE_SY = IPendleSy(
            _pendleSy
        );

        PENDLE_ROUTER = IPendleRouter(
            _pendleRouter
        );

        ST_ETH = IStETH(
            ST_ETH_ADDRESS
        );

        CURVE = ICurve(
            _dexAddress
        );

        UNISWAP_V3_ROUTER = IUniswapV3(
            _dexAddress
        );

        ENTRY_ASSET = _entryAsset;
        PENDLE_CHILD = _pendleChilTokenAddress;

        WISE_LENDING = IWiseLending(
            _wiseLendingAddress
        );

        ORACLE_HUB = IWiseOracleHub(
            WISE_LENDING.WISE_ORACLE()
        );

        BALANCER_VAULT = IBalancerVault(
            BALANCER_ADDRESS
        );

        WISE_SECURITY = IWiseSecurity(
            WISE_LENDING.WISE_SECURITY()
        );

        WETH_ADDRESS = WISE_LENDING.WETH_ADDRESS();

        AAVE_HUB = IAaveHub(
            WISE_SECURITY.AAVE_HUB()
        );

        AAVE_ADDRESS = AAVE_HUB.AAVE_ADDRESS();

        AAVE = IAave(
            AAVE_ADDRESS
        );

        AAVE_HUB_ADDRESS = address(
            AAVE_HUB
        );

        POSITION_NFT = IPositionNFTs(
            WISE_LENDING.POSITION_NFT()
        );

        if (_collateralFactor > PRECISION_FACTOR_E18) {
            revert CollateralFactorTooHigh();
        }

        collateralFactor = _collateralFactor;
        borrowTokenAddresses = AAVE_HUB.WETH_ADDRESS();
        aaveTokenAddresses = AAVE_HUB.aaveTokenAddress(
            borrowTokenAddresses
        );

        AAVE_WETH_ADDRESS = aaveTokenAddresses;

        _doApprovals(
            _wiseLendingAddress
        );

        if (block.chainid == ETH_CHAIN_ID) {
            minDepositEthAmount = 3 ether;
        } else {
            minDepositEthAmount = 0.03 ether;
        }
    }

    function doApprovals()
        external
    {
        _doApprovals(
            address(WISE_LENDING)
        );
    }

    function _doApprovals(
        address _wiseLendingAddress
    )
        internal
    {
        if (block.chainid == ETH_CHAIN_ID) {
            _safeApprove(
                ST_ETH_ADDRESS,
                address(CURVE),
                MAX_AMOUNT
            );
        }

        if (block.chainid == ARB_CHAIN_ID) {
            _safeApprove(
                address(ENTRY_ASSET),
                address(UNISWAP_V3_ROUTER),
                MAX_AMOUNT
            );

            _safeApprove(
                WETH_ADDRESS,
                address(UNISWAP_V3_ROUTER),
                MAX_AMOUNT
            );

            _safeApprove(
                WETH_ADDRESS,
                _wiseLendingAddress,
                MAX_AMOUNT
            );
        }

        _safeApprove(
            PENDLE_CHILD,
            _wiseLendingAddress,
            MAX_AMOUNT
        );

        _safeApprove(
            ENTRY_ASSET,
            address(PENDLE_ROUTER),
            MAX_AMOUNT
        );

        _safeApprove(
            address(PENDLE_MARKET),
            PENDLE_CHILD,
            MAX_AMOUNT
        );

        _safeApprove(
            address(PENDLE_MARKET),
            address(PENDLE_ROUTER),
            MAX_AMOUNT
        );

        _safeApprove(
            address(ENTRY_ASSET),
            address(PENDLE_SY),
            MAX_AMOUNT
        );

        _safeApprove(
            address(ENTRY_ASSET),
            _wiseLendingAddress,
            MAX_AMOUNT
        );

        _safeApprove(
            address(PENDLE_SY),
            address(PENDLE_ROUTER),
            MAX_AMOUNT
        );

        _safeApprove(
            WETH_ADDRESS,
            address(AAVE_HUB),
            MAX_AMOUNT
        );
    }

    modifier isActive() {
        _isActive();
        _;
    }

    function _isActive()
        internal
        view
    {
        if (isShutdown == true) {
            revert Deactivated();
        }
    }
}
