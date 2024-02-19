// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../InterfaceHub/IERC20.sol";
import "../InterfaceHub/ICurve.sol";
import "../InterfaceHub/IPositionNFTs.sol";
import "../InterfaceHub/IWiseOracleHub.sol";
import "../InterfaceHub/IFeeManager.sol";
import "../InterfaceHub/IWiseLending.sol";
import "../InterfaceHub/IWiseLiquidation.sol";
import {
    IAaveHub as IAaveHubWiseSecurity
} from "../InterfaceHub/IAaveHub.sol";

import "../FeeManager/FeeManager.sol";
import "../OwnableMaster.sol";

error NotAllowedEntity();
error ChainlinkDead();
error TokenBlackListed();
error NotAllowedWiseSecurity();
error PositionLockedWiseSecurity();
error ResultsInBadDebt();
error NotEnoughCollateral();
error NotAllowedToBorrow();
error OpenBorrowPosition();
error NonVerifiedPool();
error NotOwner();
error LiquidationDenied();
error TooManyShares();
error NotRegistered();
error Blacklisted();
error SecuritySwapFailed();
error BaseRewardTooHigh();
error BaseRewardTooLow();
error BaseRewardFarmTooHigh();
error BaseRewardFarmTooLow();
error MaxFeeEthTooHigh();
error MaxFeeEthTooLow();
error MaxFeeFarmEthTooHigh();
error MaxFeeFarmEthTooLow();
error DepositAmountTooSmall();

contract WiseSecurityDeclarations is OwnableMaster {

    event SecurityShutdown(
        address indexed caller,
        uint256 indexed timestamp
    );

    constructor(
        address _master,
        address _wiseLendingAddress,
        address _aaveHubAddress
    )
        OwnableMaster(
            _master
        )
    {
        if (_wiseLendingAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        if (_aaveHubAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        securityWorker[_master] = true;

        WISE_LENDING = IWiseLending(
            _wiseLendingAddress
        );

        AAVE_HUB = _aaveHubAddress;

        address lendingMaster = WISE_LENDING.master();
        address oracleHubAddress = WISE_LENDING.WISE_ORACLE();
        address positionNFTAddress = WISE_LENDING.POSITION_NFT();

        FeeManager feeManagerContract = new FeeManager(
            lendingMaster,
            IAaveHubWiseSecurity(AAVE_HUB).AAVE_ADDRESS(),
            _wiseLendingAddress,
            oracleHubAddress,
            address(this),
            positionNFTAddress
        );

        WISE_ORACLE = IWiseOracleHub(
            oracleHubAddress
        );

        FEE_MANAGER = IFeeManager(
            address(feeManagerContract)
        );

        WISE_LIQUIDATION = IWiseLiquidation(
            _wiseLendingAddress
        );

        POSITION_NFTS = IPositionNFTs(
            positionNFTAddress
        );

        IS_ETH_MAINNET = block.chainid == 1;

        _setLiquidationSettings(
            {
                _baseReward: 10 * PRECISION_FACTOR_E16,
                _baseRewardFarm: 3 * PRECISION_FACTOR_E16,
                _newMaxFeeETH: 3 * PRECISION_FACTOR_E18,
                _newMaxFeeFarmETH: 3 * PRECISION_FACTOR_E18
            }
        );
    }

    function _setLiquidationSettings(
        uint256 _baseReward,
        uint256 _baseRewardFarm,
        uint256 _newMaxFeeETH,
        uint256 _newMaxFeeFarmETH
    )
        internal
    {
        if (_baseReward > LIQUIDATION_INCENTIVE_MAX) {
            revert BaseRewardTooHigh();
        }

        if (_baseReward < LIQUIDATION_INCENTIVE_MIN) {
            revert BaseRewardTooLow();
        }

        baseRewardLiquidation = _baseReward;

        if (_baseRewardFarm > LIQUIDATION_INCENTIVE_POWERFARM_MAX) {
            revert BaseRewardFarmTooHigh();
        }

        if (_baseRewardFarm < LIQUIDATION_INCENTIVE_MIN) {
            revert BaseRewardFarmTooLow();
        }

        baseRewardLiquidationFarm = _baseRewardFarm;

        uint256 maxFee = IS_ETH_MAINNET == true
            ? LIQUIDATION_FEE_MAX_ETH
            : LIQUIDATION_FEE_MAX_NON_ETH;

        uint256 minFee = IS_ETH_MAINNET == true
            ? LIQUIDATION_FEE_MIN_ETH
            : LIQUIDATION_FEE_MIN_NON_ETH;

        if (_newMaxFeeETH > maxFee) {
            revert MaxFeeEthTooHigh();
        }

        if (_newMaxFeeETH < minFee) {
            revert MaxFeeEthTooLow();
        }

        maxFeeETH = _newMaxFeeETH;

        uint256 maxFeeFarm = IS_ETH_MAINNET == true
            ? LIQUIDATION_FEE_MAX_ETH
            : LIQUIDATION_FEE_MAX_NON_ETH;

        uint256 minFeeFarm = IS_ETH_MAINNET == true
            ? LIQUIDATION_FEE_MIN_ETH
            : LIQUIDATION_FEE_MIN_NON_ETH;

        if (_newMaxFeeFarmETH > maxFeeFarm) {
            revert MaxFeeFarmEthTooHigh();
        }

        if (_newMaxFeeFarmETH < minFeeFarm) {
            revert MaxFeeFarmEthTooLow();
        }

        maxFeeFarmETH = _newMaxFeeFarmETH;
    }

    // ---- Variables ----

    uint256 public constant BORROW_PERCENTAGE_CAP = 95 * PRECISION_FACTOR_E16;
    address public immutable AAVE_HUB;

    // ---- Interfaces ----

    // Interface feeManager contract
    IFeeManager public immutable FEE_MANAGER;

    // Interface wiseLending contract
    IWiseLending public immutable WISE_LENDING;

    // Interface position NFT contract
    IPositionNFTs public immutable POSITION_NFTS;

    // Interface oracleHub contract
    IWiseOracleHub public immutable WISE_ORACLE;

    // Interface wiseLiquidation contract
    IWiseLiquidation public immutable WISE_LIQUIDATION;

    // Threshold values
    uint256 internal constant MAX_LIQUIDATION_50 = 50E16;
    uint256 internal constant BAD_DEBT_THRESHOLD = 89E16;

    uint256 internal constant UINT256_MAX = type(uint256).max;
    uint256 internal constant ONE_YEAR = 365 days;

    // adjustable

    uint256 public minDepositEthValue = 1; // in wei?

    // Precision factors for computations
    uint256 internal constant PRECISION_FACTOR_E16 = 1E16;
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;
    uint256 internal constant ONE_WEI = 1;

    // Chain - ID bool for Ethereum mainnet check
    bool immutable IS_ETH_MAINNET;

    // Liquidation Incentive threshholds
    uint256 internal constant LIQUIDATION_INCENTIVE_MAX = 11 * PRECISION_FACTOR_E16;
    uint256 internal constant LIQUIDATION_INCENTIVE_MIN = 2 * PRECISION_FACTOR_E16;
    uint256 internal constant LIQUIDATION_INCENTIVE_POWERFARM_MAX = 4 * PRECISION_FACTOR_E16;

    // Liquidation Fee threshholds
    uint256 internal constant LIQUIDATION_FEE_MIN_ETH = 3 * PRECISION_FACTOR_E18;
    uint256 internal constant LIQUIDATION_FEE_MAX_ETH = 100 * PRECISION_FACTOR_E18;
    uint256 internal constant LIQUIDATION_FEE_MAX_NON_ETH = 10 * PRECISION_FACTOR_E18;
    uint256 internal constant LIQUIDATION_FEE_MIN_NON_ETH = 30 * PRECISION_FACTOR_E16;

    // ---- Mapping Variables ----

    // Mapping pool token to blacklist bool
    mapping(address => bool) public wasBlacklisted;

    // Mapping basic swap data for curve swaps to pool token
    mapping(address => CurveSwapStructData) public curveSwapInfoData;

    // Mapping swap info of swap token for reentrency guard to pool token
    mapping(address => CurveSwapStructToken) public curveSwapInfoToken;

    // Mapping addresses which are allowed to perform a security lock.
    mapping(address => bool) public securityWorker;

    // ---- Liquidation Variables ----

    // Max reward ETH for liquidator power farm liquidation
    uint256 public maxFeeETH;

    // Max reward ETH for liquidator normal liquidation
    uint256 public maxFeeFarmETH;

    // Base reward for liquidator normal liquidation
    uint256 public baseRewardLiquidation;

    // Base reward for liquidator power farm liquidation
    uint256 public baseRewardLiquidationFarm;
}
