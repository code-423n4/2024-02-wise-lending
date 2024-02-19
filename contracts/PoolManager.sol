// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./WiseCore.sol";
import "./Babylonian.sol";

abstract contract PoolManager is WiseCore {

    using Babylonian for uint256;

    struct CreatePool {
        bool allowBorrow;
        address poolToken;
        uint256 poolMulFactor;
        uint256 poolCollFactor;
        uint256 maxDepositAmount;
    }

    struct CurvePoolSettings {
        CurveSwapStructData curveSecuritySwapsData;
        CurveSwapStructToken curveSecuritySwapsToken;
    }

    function setParamsLASA(
        address _poolToken,
        uint256 _poolMulFactor,
        uint256 _upperBoundMaxRate,
        uint256 _lowerBoundMaxRate,
        bool _steppingDirection,
        bool _isFinal
    )
        external
        onlyMaster
    {
        if (parametersLocked[_poolToken] == true) {
            revert InvalidAction();
        }

        parametersLocked[_poolToken] = _isFinal;

        AlgorithmEntry storage algoData = algorithmData[
            _poolToken
        ];

        algoData.increasePole = _steppingDirection;

        _validateParameter(
            _upperBoundMaxRate,
            UPPER_BOUND_MAX_RATE
        );

        _validateParameter(
            _lowerBoundMaxRate,
            LOWER_BOUND_MAX_RATE
        );

        _validateParameter(
            _lowerBoundMaxRate,
            _upperBoundMaxRate
        );

        uint256 staticMinPole = _getPoleValue(
            _poolMulFactor,
            _upperBoundMaxRate
        );

        uint256 staticMaxPole = _getPoleValue(
            _poolMulFactor,
            _lowerBoundMaxRate
        );

        uint256 staticDeltaPole = _getDeltaPole(
            staticMaxPole,
            staticMinPole
        );

        uint256 startValuePole = _getStartValue(
            staticMaxPole,
            staticMinPole
        );

        _validateParameter(
            _poolMulFactor,
            PRECISION_FACTOR_E18
        );

        borrowRatesData[_poolToken] = BorrowRatesEntry(
            startValuePole,
            staticDeltaPole,
            staticMinPole,
            staticMaxPole,
            _poolMulFactor
        );

        algoData.bestPole = startValuePole;
        algoData.maxValue = lendingPoolData[_poolToken].totalDepositShares;
    }

    function setPoolParameters(
        address _poolToken,
        uint256 _collateralFactor,
        uint256 _maximumDeposit
    )
        external
        onlyMaster
    {
        if (_maximumDeposit > 0) {
            maxDepositValueToken[_poolToken] = _maximumDeposit;
        }

        if (_collateralFactor > 0) {
            lendingPoolData[_poolToken].collateralFactor = _collateralFactor;
        }

        _validateParameter(
            _collateralFactor,
            PRECISION_FACTOR_E18
        );
    }

    /**
     * @dev Allow to verify isolation pool.
     */
    function setVerifiedIsolationPool(
        address _isolationPool,
        bool _state
    )
        external
        onlyMaster
    {
        verifiedIsolationPool[_isolationPool] = _state;
    }

    function createPool(
        CreatePool calldata _params
    )
        external
        onlyMaster
    {
        _createPool(
            _params
        );
    }

    function createCurvePool(
        CreatePool calldata _params,
        CurvePoolSettings calldata _settings
    )
        external
        onlyMaster
    {
        _createPool(
            _params
        );

        WISE_SECURITY.prepareCurvePools(
            _params.poolToken,
            _settings.curveSecuritySwapsData,
            _settings.curveSecuritySwapsToken
        );
    }

    function _createPool(
        CreatePool calldata _params
    )
        private
    {
        _validateParameter(
            timestampsPoolData[_params.poolToken].timeStamp,
            0
        );

        if (_params.poolToken == ZERO_ADDRESS) {
            revert InvalidAddress();
        }

        _validateParameter(
            _params.poolMulFactor,
            PRECISION_FACTOR_E18
        );

        _validateParameter(
            _params.poolCollFactor,
            MAX_COLLATERAL_FACTOR
        );

        // Calculating lower bound for the pole
        uint256 staticMinPole = _getPoleValue(
            _params.poolMulFactor,
            UPPER_BOUND_MAX_RATE
        );

        // Calculating upper bound for the pole
        uint256 staticMaxPole = _getPoleValue(
            _params.poolMulFactor,
            LOWER_BOUND_MAX_RATE
        );

        // Calculating fraction for algorithm step
        uint256 staticDeltaPole = _getDeltaPole(
            staticMaxPole,
            staticMinPole
        );

        maxDepositValueToken[_params.poolToken] = _params.maxDepositAmount;

        globalPoolData[_params.poolToken] = GlobalPoolEntry({
            totalPool: 0,
            utilization: 0,
            totalBareToken: 0,
            poolFee: 20 * PRECISION_FACTOR_E16
        });

        // Setting start value as mean of min and max value
        uint256 startValuePole = _getStartValue(
            staticMaxPole,
            staticMinPole
        );

        // Rates Pool Data
        borrowRatesData[_params.poolToken] = BorrowRatesEntry(
            startValuePole,
            staticDeltaPole,
            staticMinPole,
            staticMaxPole,
            _params.poolMulFactor
        );

        // Borrow Pool Data
        borrowPoolData[_params.poolToken] = BorrowPoolEntry({
            allowBorrow: _params.allowBorrow,
            pseudoTotalBorrowAmount: GHOST_AMOUNT,
            totalBorrowShares: GHOST_AMOUNT,
            borrowRate: 0
        });

        // Algorithm Pool Data
        algorithmData[_params.poolToken] = AlgorithmEntry({
            bestPole: startValuePole,
            maxValue: 0,
            previousValue: 0,
            increasePole: false
        });

        // Lending Pool Data
        lendingPoolData[_params.poolToken] = LendingPoolEntry({
            pseudoTotalPool: GHOST_AMOUNT,
            totalDepositShares: GHOST_AMOUNT,
            collateralFactor: _params.poolCollFactor
        });

        // Timestamp Pool Data
        timestampsPoolData[_params.poolToken] = TimestampsPoolEntry({
            timeStamp: block.timestamp,
            timeStampScaling: block.timestamp,
            initialTimeStamp: block.timestamp
        });

        FEE_MANAGER.addPoolTokenAddress(
            _params.poolToken
        );

        uint256 fetchBalance = _getBalance(
            _params.poolToken
        );

        if (fetchBalance > 0) {
            _safeTransfer(
                _params.poolToken,
                master,
                fetchBalance
            );
        }
    }

    function _getPoleValue(
        uint256 _poolMulFactor,
        uint256 _poleBoundRate
    )
        private
        pure
        returns (uint256)
    {
        return PRECISION_FACTOR_E18 / 2
            + (PRECISION_FACTOR_E36 / 4
                + _poolMulFactor
                    * PRECISION_FACTOR_E36
                    / _poleBoundRate
            ).sqrt();
    }

    function _getDeltaPole(
        uint256 _maxPole,
        uint256 _minPole
    )
        private
        pure
        returns (uint256)
    {
        return (_maxPole - _minPole) / NORMALISATION_FACTOR;
    }

    function _getStartValue(
        uint256 _maxPole,
        uint256 _minPole
    )
        private
        pure
        returns (uint256)
    {
        return (_maxPole + _minPole) / 2;
    }
}
