// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./SimpleERC20Clone.sol";

import "../../InterfaceHub/IPendle.sol";
import "../../InterfaceHub/IPendleController.sol";

import "../../TransferHub/TransferHelper.sol";

error MarketExpired();
error NotController();
error ZeroFee();
error TooMuchFee();
error NotEnoughLpAssetsTransferred();
error InsufficientShares();
error ZeroAmount();
error FeeTooHigh();
error NotEnoughShares();
error InvalidSharePriceGrowth();
error InvalidSharePrice();
error AlreadyInitialized();

contract PendlePowerFarmToken is SimpleERC20, TransferHelper {

    // Pendle - LP token address
    address public UNDERLYING_PENDLE_MARKET;
    address public PENDLE_POWER_FARM_CONTROLLER;

    // Total balance of LPs backing at current compound distribution
    uint256 public underlyingLpAssetsCurrent;

    // Lp assets from compound left to distribute
    uint256 public totalLpAssetsToDistribute;

    // Interface Object for underlying Market
    IPendleMarket public PENDLE_MARKET;

    // InterfaceObject for pendle Sy
    IPendleSy public PENDLE_SY;

    // Interface for Pendle Controller
    IPendleController public PENDLE_CONTROLLER;

    // Max cardinality of Pendle Market
    uint16 public MAX_CARDINALITY;

    uint256 public mintFee;
    uint256 public lastInteraction;

    uint256 private constant ONE_WEEK = 7 days;
    uint256 internal constant ONE_YEAR = 365 days;
    uint256 private constant MAX_MINT_FEE = 10000;

    uint256 private constant PRECISION_FACTOR_E6 = 1E6;
    uint256 private constant PRECISION_FACTOR_E18 = 1E18;
    uint256 internal constant PRECISION_FACTOR_E36 = PRECISION_FACTOR_E18 * PRECISION_FACTOR_E18;
    uint256 internal constant PRECISION_FACTOR_YEAR = PRECISION_FACTOR_E18 * ONE_YEAR;

    uint256 private INITIAL_TIME_STAMP;

    uint256 internal constant RESTRICTION_FACTOR = 10
        * PRECISION_FACTOR_E36
        / PRECISION_FACTOR_YEAR;

    modifier onlyController() {
        _onlyController();
        _;
    }

    function _onlyController()
        private
        view
    {
        if (msg.sender != PENDLE_POWER_FARM_CONTROLLER) {
            revert NotController();
        }
    }

    modifier syncSupply()
    {
        _triggerIndexUpdate();
        _overWriteCheck();
        _syncSupply();
        _updateRewards();
        _setLastInteraction();
        _increaseCardinalityNext();
        uint256 sharePriceBefore = _getSharePrice();
        _;
        _validateSharePriceGrowth(
            _validateSharePrice(
                sharePriceBefore
            )
        );
    }

    function _validateSharePrice(
        uint256 _sharePriceBefore
    )
        private
        view
        returns (uint256)
    {
        uint256 sharePricenNow = _getSharePrice();

        if (sharePricenNow < _sharePriceBefore) {
            revert InvalidSharePrice();
        }

        return sharePricenNow;
    }

    function _validateSharePriceGrowth(
        uint256 _sharePriceNow
    )
        private
        view
    {
        uint256 timeDifference = block.timestamp
            - INITIAL_TIME_STAMP;

        uint256 maximum = timeDifference
            * RESTRICTION_FACTOR
            + PRECISION_FACTOR_E18;

        if (_sharePriceNow > maximum) {
            revert InvalidSharePriceGrowth();
        }
    }

    function _overWriteCheck()
        internal
    {
        _wrapOverWrites(
            _updateRewardTokens()
        );
    }

    function _triggerIndexUpdate()
        internal
    {
        _withdrawLp(
            UNDERLYING_PENDLE_MARKET,
            0
        );
    }

    function _wrapOverWrites(
        bool _overWritten
    )
        internal
    {
        if (_overWritten == true) {
            _overWriteIndexAll();
            _overWriteAmounts();
        }
    }

    function _updateRewardTokens()
        private
        returns (bool)
    {
        return PENDLE_CONTROLLER.updateRewardTokens(
            UNDERLYING_PENDLE_MARKET
        );
    }

    function _overWriteIndexAll()
        private
    {
        PENDLE_CONTROLLER.overWriteIndexAll(
            UNDERLYING_PENDLE_MARKET
        );
    }

    function _overWriteIndex(
        uint256 _index
    )
        private
    {
        PENDLE_CONTROLLER.overWriteIndex(
            UNDERLYING_PENDLE_MARKET,
            _index
        );
    }

    function _overWriteAmounts()
        private
    {
        PENDLE_CONTROLLER.overWriteAmounts(
            UNDERLYING_PENDLE_MARKET
        );
    }

    function _updateRewards()
        private
    {
        uint256[] memory rewardsOutsideArray = _calculateRewardsClaimedOutside();

        uint256 i;
        uint256 l = rewardsOutsideArray.length;

        while (i < l) {
            if (rewardsOutsideArray[i] > 0) {
                PENDLE_CONTROLLER.increaseReservedForCompound(
                    UNDERLYING_PENDLE_MARKET,
                    rewardsOutsideArray
                );
                break;
            }
            unchecked {
                ++i;
            }
        }
    }

    function _calculateRewardsClaimedOutside()
        internal
        returns (uint256[] memory)
    {
        address[] memory rewardTokens = PENDLE_CONTROLLER.pendleChildCompoundInfoRewardTokens(
            UNDERLYING_PENDLE_MARKET
        );

        uint128[] memory lastIndex = PENDLE_CONTROLLER.pendleChildCompoundInfoLastIndex(
            UNDERLYING_PENDLE_MARKET
        );

        uint256 l = rewardTokens.length;
        uint256[] memory rewardsOutsideArray = new uint256[](l);

        uint256 i;
        uint128 index;

        while (i < l) {
            UserReward memory userReward = _getUserReward(
                rewardTokens[i],
                PENDLE_POWER_FARM_CONTROLLER
            );

            if (userReward.accrued > 0) {
                PENDLE_MARKET.redeemRewards(
                    PENDLE_POWER_FARM_CONTROLLER
                );

                userReward = _getUserReward(
                    rewardTokens[i],
                    PENDLE_POWER_FARM_CONTROLLER
                );
            }

            index = userReward.index;

            if (lastIndex[i] == 0 && index > 0) {
                rewardsOutsideArray[i] = 0;
                _overWriteIndex(
                    i
                );
                unchecked {
                    ++i;
                }
                continue;
            }

            if (index == lastIndex[i]) {
                rewardsOutsideArray[i] = 0;
                unchecked {
                    ++i;
                }
                continue;
            }

            uint256 indexDiff = index
                - lastIndex[i];

            uint256 activeBalance = _getActiveBalance();
            uint256 totalLpAssetsCurrent = totalLpAssets();
            uint256 lpBalanceController = _getBalanceLpBalanceController();

            bool scaleNecessary = totalLpAssetsCurrent < lpBalanceController;

            rewardsOutsideArray[i] = scaleNecessary
                ? indexDiff
                    * activeBalance
                    * totalLpAssetsCurrent
                    / lpBalanceController
                    / PRECISION_FACTOR_E18
                : indexDiff
                    * activeBalance
                    / PRECISION_FACTOR_E18;

            _overWriteIndex(
                i
            );

            unchecked {
                ++i;
            }
        }

        return rewardsOutsideArray;
    }

    function _getBalanceLpBalanceController()
        private
        view
        returns (uint256)
    {
        return PENDLE_MARKET.balanceOf(
            PENDLE_POWER_FARM_CONTROLLER
        );
    }

    function _getActiveBalance()
        private
        view
        returns (uint256)
    {
        return PENDLE_MARKET.activeBalance(
            PENDLE_POWER_FARM_CONTROLLER
        );
    }

    function _getSharePrice()
        private
        view
        returns (uint256)
    {
        return previewUnderlyingLpAssets() * PRECISION_FACTOR_E18
            / totalSupply();
    }

    function _syncSupply()
        private
    {
        uint256 additonalAssets = previewDistribution();

        if (additonalAssets == 0) {
            return;
        }

        underlyingLpAssetsCurrent += additonalAssets;
        totalLpAssetsToDistribute -= additonalAssets;
    }

    function _increaseCardinalityNext()
        internal
    {
        MarketStorage memory storageMarket = PENDLE_MARKET._storage();

        if (storageMarket.observationCardinalityNext < MAX_CARDINALITY) {
            PENDLE_MARKET.increaseObservationsCardinalityNext(
                storageMarket.observationCardinalityNext + 1
            );
        }
    }

    function _withdrawLp(
        address _to,
        uint256 _amount
    )
        internal
    {
        PENDLE_CONTROLLER.withdrawLp(
            UNDERLYING_PENDLE_MARKET,
            _to,
            _amount
        );
    }

    function _getUserReward(
        address _rewardToken,
        address _user
    )
        internal
        view
        returns (UserReward memory)
    {
        return PENDLE_MARKET.userReward(
            _rewardToken,
            _user
        );
    }

    function previewDistribution()
        public
        view
        returns (uint256)
    {
        if (totalLpAssetsToDistribute == 0) {
            return 0;
        }

        if (block.timestamp == lastInteraction) {
            return 0;
        }

        if (totalLpAssetsToDistribute < ONE_WEEK) {
            return totalLpAssetsToDistribute;
        }

        uint256 currentRate = totalLpAssetsToDistribute
            / ONE_WEEK;

        uint256 additonalAssets = currentRate
            * (block.timestamp - lastInteraction);

        if (additonalAssets > totalLpAssetsToDistribute) {
            return totalLpAssetsToDistribute;
        }

        return additonalAssets;
    }

    function _setLastInteraction()
        private
    {
        lastInteraction = block.timestamp;
    }

    function _applyMintFee(
        uint256 _amount
    )
        internal
        view
        returns (uint256)
    {
        return _amount
            * (PRECISION_FACTOR_E6 - mintFee)
            / PRECISION_FACTOR_E6;
    }

    function totalLpAssets()
        public
        view
        returns (uint256)
    {
        return underlyingLpAssetsCurrent
            + totalLpAssetsToDistribute;
    }

    function previewUnderlyingLpAssets()
        public
        view
        returns (uint256)
    {
        return previewDistribution()
            + underlyingLpAssetsCurrent;
    }

    function previewMintShares(
        uint256 _underlyingAssetAmount,
        uint256 _underlyingLpAssetsCurrent
    )
        public
        view
        returns (uint256)
    {
        return _underlyingAssetAmount
            * totalSupply()
            / _underlyingLpAssetsCurrent;
    }

    function previewAmountWithdrawShares(
        uint256 _shares,
        uint256 _underlyingLpAssetsCurrent
    )
        public
        view
        returns (uint256)
    {
        return _shares
            * _underlyingLpAssetsCurrent
            / totalSupply();
    }

    function previewBurnShares(
        uint256 _underlyingAssetAmount,
        uint256 _underlyingLpAssetsCurrent
    )
        public
        view
        returns (uint256)
    {
        uint256 product = _underlyingAssetAmount
            * totalSupply();

        return product % _underlyingLpAssetsCurrent == 0
            ? product / _underlyingLpAssetsCurrent
            : product / _underlyingLpAssetsCurrent + 1;
    }

    function manualSync()
        external
        syncSupply
        returns (bool)
    {
        return true;
    }

    function addCompoundRewards(
        uint256 _amount
    )
        external
        syncSupply
    {
        if (_amount == 0) {
            revert ZeroAmount();
        }

        totalLpAssetsToDistribute += _amount;

        if (msg.sender == PENDLE_POWER_FARM_CONTROLLER) {
            return;
        }

        _safeTransferFrom(
            UNDERLYING_PENDLE_MARKET,
            msg.sender,
            PENDLE_POWER_FARM_CONTROLLER,
            _amount
        );
    }

    /**
     * @dev External wrapper for mint function.
     */
    function depositExactAmount(
        uint256 _underlyingLpAssetAmount
    )
        external
        syncSupply
        returns (
            uint256,
            uint256
        )
    {
        if (_underlyingLpAssetAmount == 0) {
            revert ZeroAmount();
        }

        uint256 shares = previewMintShares(
            _underlyingLpAssetAmount,
            underlyingLpAssetsCurrent
        );

        if (shares == 0) {
            revert NotEnoughLpAssetsTransferred();
        }

        uint256 reducedShares = _applyMintFee(
            shares
        );

        uint256 feeShares = shares
            - reducedShares;

        if (feeShares == 0) {
            revert ZeroFee();
        }

        if (reducedShares == feeShares) {
            revert TooMuchFee();
        }

        _mint(
            msg.sender,
            reducedShares
        );

        _mint(
            PENDLE_POWER_FARM_CONTROLLER,
            feeShares
        );

        underlyingLpAssetsCurrent += _underlyingLpAssetAmount;

        _safeTransferFrom(
            UNDERLYING_PENDLE_MARKET,
            msg.sender,
            PENDLE_POWER_FARM_CONTROLLER,
            _underlyingLpAssetAmount
        );

        return (
            reducedShares,
            feeShares
        );
    }

    function changeMintFee(
        uint256 _newFee
    )
        external
        onlyController
    {
        if (_newFee > MAX_MINT_FEE) {
            revert FeeTooHigh();
        }

        mintFee = _newFee;
    }

    /**
     * @dev External wrapper for burn function.
     */
    function withdrawExactShares(
        uint256 _shares
    )
        external
        syncSupply
        returns (uint256)
    {
        if (_shares == 0) {
            revert ZeroAmount();
        }

        if (_shares > balanceOf(msg.sender)) {
            revert InsufficientShares();
        }

        uint256 tokenAmount = previewAmountWithdrawShares(
            _shares,
            underlyingLpAssetsCurrent
        );

        underlyingLpAssetsCurrent -= tokenAmount;

        _burn(
            msg.sender,
            _shares
        );

        if (msg.sender == PENDLE_POWER_FARM_CONTROLLER) {
            return tokenAmount;
        }

        _withdrawLp(
            msg.sender,
            tokenAmount
        );

        return tokenAmount;
    }

    function withdrawExactAmount(
        uint256 _underlyingLpAssetAmount
    )
        external
        syncSupply
        returns (uint256)
    {
        if (_underlyingLpAssetAmount == 0) {
            revert ZeroAmount();
        }

        uint256 shares = previewBurnShares(
            _underlyingLpAssetAmount,
            underlyingLpAssetsCurrent
        );

        if (shares > balanceOf(msg.sender)) {
            revert NotEnoughShares();
        }

        _burn(
            msg.sender,
            shares
        );

        underlyingLpAssetsCurrent -= _underlyingLpAssetAmount;

        _withdrawLp(
            msg.sender,
            _underlyingLpAssetAmount
        );

        return shares;
    }

    function initialize(
        address _underlyingPendleMarket,
        address _pendleController,
        string memory _tokenName,
        string memory _symbolName,
        uint16 _maxCardinality
    )
        external
    {
        if (address(PENDLE_MARKET) != address(0)) {
            revert AlreadyInitialized();
        }

        PENDLE_MARKET = IPendleMarket(
            _underlyingPendleMarket
        );

        if (PENDLE_MARKET.isExpired() == true) {
            revert MarketExpired();
        }

        PENDLE_CONTROLLER = IPendleController(
            _pendleController
        );

        MAX_CARDINALITY = _maxCardinality;

        _name = _tokenName;
        _symbol = _symbolName;

        PENDLE_POWER_FARM_CONTROLLER = _pendleController;
        UNDERLYING_PENDLE_MARKET = _underlyingPendleMarket;

        (
            address pendleSyAddress,
            ,
        ) = PENDLE_MARKET.readTokens();

        PENDLE_SY = IPendleSy(
            pendleSyAddress
        );

        _decimals = PENDLE_SY.decimals();

        lastInteraction = block.timestamp;

        _totalSupply = 1;
        underlyingLpAssetsCurrent = 1;
        mintFee = 3000;
        INITIAL_TIME_STAMP = block.timestamp;
    }
}
