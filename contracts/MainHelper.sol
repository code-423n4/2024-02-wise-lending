// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./WiseLowLevelHelper.sol";

abstract contract MainHelper is WiseLowLevelHelper {

    /**
     * @dev Helper function to convert {_amount}
     * of a certain pool with {_poolToken}
     * into lending shares. Includes devison
     * by zero and share security checks.
     * Needs latest pseudo amount for accurate
     * result.
     */
    function calculateLendingShares(
        address _poolToken,
        uint256 _amount,
        bool _maxSharePrice
    )
        public
        view
        returns (uint256)
    {
        return _calculateShares(
            lendingPoolData[_poolToken].totalDepositShares * _amount,
            lendingPoolData[_poolToken].pseudoTotalPool,
            _maxSharePrice
        );
    }

    function _calculateShares(
        uint256 _product,
        uint256 _pseudo,
        bool _maxSharePrice
    )
        private
        pure
        returns (uint256)
    {
        return _maxSharePrice == true
            ? _product / _pseudo + 1
            : _product / _pseudo - 1;
    }

    /**
     * @dev Helper function to convert {_amount}
     * of a certain pool with {_poolToken}
     * into borrow shares. Includes devison
     * by zero and share security checks.
     * Needs latest pseudo amount for accurate
     * result.
     */
    function calculateBorrowShares(
        address _poolToken,
        uint256 _amount,
        bool _maxSharePrice
    )
        public
        view
        returns (uint256)
    {
        return _calculateShares(
            borrowPoolData[_poolToken].totalBorrowShares * _amount,
            borrowPoolData[_poolToken].pseudoTotalBorrowAmount,
            _maxSharePrice
        );
    }

    /**
     * @dev Helper function to convert {_shares}
     * of a certain pool with {_poolToken}
     * into lending token. Includes devison
     * by zero and share security checks.
     * Needs latest pseudo amount for accurate
     * result.
     */
    function cashoutAmount(
        address _poolToken,
        uint256 _shares
    )
        external
        view
        returns (uint256)
    {
        return _cashoutAmount(
            _poolToken,
            _shares
        );
    }

    function _cashoutAmount(
        address _poolToken,
        uint256 _shares
    )
        internal
        view
        returns (uint256)
    {
        return _shares
            * lendingPoolData[_poolToken].pseudoTotalPool
            / lendingPoolData[_poolToken].totalDepositShares - 1;
    }

    /**
     * @dev Helper function to convert {_shares}
     * of a certain pool with {_poolToken}
     * into borrow token. Includes devison
     * by zero and share security checks.
     * Needs latest pseudo amount for accurate
     * result.
     */
    function paybackAmount(
        address _poolToken,
        uint256 _shares
    )
        public
        view
        returns (uint256)
    {
        uint256 product = _shares
            * borrowPoolData[_poolToken].pseudoTotalBorrowAmount;

        uint256 totalBorrowShares = borrowPoolData[_poolToken].totalBorrowShares;

        return product / totalBorrowShares + 1;
    }

    /**
     * @dev Internal helper combining one
     * security check with lending share
     * calculation for withdraw.
     */
    function _preparationsWithdraw(
        uint256 _nftId,
        address _caller,
        address _poolToken,
        uint256 _amount
    )
        internal
        view
        returns (uint256)
    {
        _checkOwnerPosition(
            _nftId,
            _caller
        );

        return calculateLendingShares(
            {
                _poolToken: _poolToken,
                _amount: _amount,
                _maxSharePrice: true
            }
        );
    }

    /**
     * @dev Internal helper calculating {_poolToken}
     * utilization. Includes math underflow check.
     */
    function _getValueUtilization(
        address _poolToken
    )
        private
        view
        returns (uint256)
    {
        uint256 totalPool = globalPoolData[_poolToken].totalPool;
        uint256 pseudoPool = lendingPoolData[_poolToken].pseudoTotalPool;

        if (totalPool >= pseudoPool) {
            return 0;
        }

        return PRECISION_FACTOR_E18 - (PRECISION_FACTOR_E18
            * totalPool
            / pseudoPool
        );
    }

    /**
     * @dev Internal helper function setting new pool
     * utilization by calling {_getValueUtilization}.
     */
    function _updateUtilization(
        address _poolToken
    )
        private
    {
        globalPoolData[_poolToken].utilization = _getValueUtilization(
            _poolToken
        );
    }

    /**
     * @dev Internal helper function checking if
     * cleanup gathered new token to save into
     * pool variables.
     */
    function _checkCleanUp(
        uint256 _amountContract,
        uint256 _totalPool,
        uint256 _bareAmount
    )
        private
        pure
        returns (bool)
    {
        return _bareAmount + _totalPool >= _amountContract;
    }

    /**
     * @dev Wrapper for isolation pool check.
     */
    function _onlyIsolationPool(
        address _poolAddress
    )
        internal
        view
    {
        if (verifiedIsolationPool[_poolAddress] == false) {
            revert InvalidAction();
        }
    }

    /**
     * @dev Internal helper function checking if
     * user inputs are safe.
     */
    function _validateIsolationPoolLiquidation(
        address _caller,
        uint256 _nftId,
        uint256 _nftIdLiquidator
    )
        internal
        view
    {
        _onlyIsolationPool(
            _caller
        );

        if (positionLocked[_nftId] == false) {
            revert NotPowerFarm();
        }

        _checkLiquidatorNft(
            _nftId,
            _nftIdLiquidator
        );

        if (POSITION_NFT.ownerOf(_nftId) != _caller) {
            revert InvalidCaller();
        }
    }

    function _checkLiquidatorNft(
        uint256 _nftId,
        uint256 _nftIdLiquidator
    )
        internal
        view
    {
        if (positionLocked[_nftIdLiquidator] == true) {
            revert LiquidatorIsInPowerFarm();
        }

        if (_nftIdLiquidator == _nftId) {
            revert InvalidLiquidator();
        }

        if (_nftIdLiquidator >= POSITION_NFT.getNextExpectedId()) {
            revert InvalidLiquidator();
        }
    }

    function _getBalance(
        address _tokenAddress
    )
        internal
        view
        returns (uint256)
    {
        return IERC20(_tokenAddress).balanceOf(
            address(this)
        );
    }

    /**
     * @dev Internal helper function checking if falsely
     * sent token are inside the contract for the pool with
     * {_poolToken}. If this is the case it adds those token
     * to the pool by increasing pseudo and total amount.
     * In context of aToken from aave pools it gathers the
     * rebase amount from supply APY of aave pools.
     */
    function _cleanUp(
        address _poolToken
    )
        internal
    {
        _validateNonZero(
            lendingPoolData[_poolToken].totalDepositShares
        );

        uint256 amountContract = _getBalance(
            _poolToken
        );

        uint256 totalPool = globalPoolData[_poolToken].totalPool;
        uint256 bareToken = globalPoolData[_poolToken].totalBareToken;

        if (_checkCleanUp(amountContract, totalPool, bareToken)) {
            return;
        }

        unchecked {

            uint256 difference = amountContract - (
                totalPool + bareToken
            );

            uint256 allowedDifference = _getAllowedDifference(
                _poolToken
            );

            if (difference > allowedDifference) {

                _increaseTotalAndPseudoTotalPool(
                    _poolToken,
                    allowedDifference
                );

                return;
            }

            _increaseTotalAndPseudoTotalPool(
                _poolToken,
                difference
            );
        }
    }

    /**
     * @dev Internal helper function calculating
     * allowed increase of pseudoTotalPool to
     * contain shareprice increase reasoanbly.
    */
    function _getAllowedDifference(
        address _poolToken
    )
        private
        view
        returns (uint256)
    {
        uint256 timeDifference = block.timestamp
            - timestampsPoolData[_poolToken].timeStamp;

        return timeDifference
            * lendingPoolData[_poolToken].pseudoTotalPool
            * PRECISION_FACTOR_E18
            / PRECISION_FACTOR_YEAR;
    }

    /**
     * @dev Internal helper function for
     * updating pools and calling {_cleanUp}.
     * Also includes re-entrancy guard for
     * curve pools security checks.
     */
    function _preparePool(
        address _poolToken
    )
        internal
    {
        _cleanUp(
            _poolToken
        );

        _updatePseudoTotalAmounts(
            _poolToken
        );
    }

    /**
     * @dev Internal helper function for
     * updating all lending tokens of a
     * position.
     */
    function _preparationTokens(
        mapping(uint256 => address[]) storage _userTokenData,
        uint256 _nftId,
        address _poolToken
    )
        internal
        returns (address[] memory)
    {
        address[] memory tokens = _userTokenData[
            _nftId
        ];

        _prepareTokens(
            _poolToken,
            tokens
        );

        return tokens;
    }

    /**
     * @dev Internal helper function for
     * updating pseudo amounts of a pool
     * inside {tokens} array and sets new
     * borrow rates.
     */
    function _prepareTokens(
        address _poolToken,
        address[] memory _tokens
    )
        private
    {
        address currentAddress;

        uint256 i;
        uint256 l = _tokens.length;

        while (i < l) {

            currentAddress = _tokens[i];

            unchecked {
                ++i;
            }

            if (currentAddress == _poolToken) {
                continue;
            }

            _preparePool(
                currentAddress
            );

            _newBorrowRate(
                currentAddress
            );
        }
    }

    /**
     * @dev Internal helper function for iterating
     * over all tokens which may contain curvePools.
     */
    function _curveSecurityChecks(
        address[] memory _lendTokens,
        address[] memory _borrowTokens
    )
        internal
    {
        _whileLoopCurveSecurity(
            _lendTokens
        );

        _whileLoopCurveSecurity(
            _borrowTokens
        );
    }

    /**
     * @dev Internal helper function for executing while loops
     * iterating over all tokens which may contain curvePools.
     */
    function _whileLoopCurveSecurity(
        address[] memory _tokens
    )
        private
    {
        uint256 i;
        uint256 l = _tokens.length;

        while (i < l) {

            WISE_SECURITY.curveSecurityCheck(
                _tokens[i]
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Internal helper function
     * updating pseudo amounts and
     * printing fee shares for the
     * feeManager proportional to the
     * fee percentage of the pool.
     */
    function _updatePseudoTotalAmounts(
        address _poolToken
    )
        private
    {
        uint256 currentTime = block.timestamp;

        uint256 bareIncrease = borrowPoolData[_poolToken].borrowRate
            * (currentTime - timestampsPoolData[_poolToken].timeStamp)
            * borrowPoolData[_poolToken].pseudoTotalBorrowAmount
            + bufferIncrease[_poolToken];

        if (bareIncrease < PRECISION_FACTOR_YEAR) {
            bufferIncrease[_poolToken] = bareIncrease;

            _setTimeStamp(
                _poolToken,
                currentTime
            );

            return;
        }

        delete bufferIncrease[_poolToken];

        uint256 amountInterest = bareIncrease
            / PRECISION_FACTOR_YEAR;

        uint256 feeAmount = amountInterest
            * globalPoolData[_poolToken].poolFee
            / PRECISION_FACTOR_E18;

        _increasePseudoTotalBorrowAmount(
            _poolToken,
            amountInterest
        );

        _increasePseudoTotalPool(
            _poolToken,
            amountInterest
        );

        if (feeAmount == 0) {
            _setTimeStamp(
                _poolToken,
                currentTime
            );
            return;
        }

        uint256 feeShares = feeAmount
            * lendingPoolData[_poolToken].totalDepositShares
            / (lendingPoolData[_poolToken].pseudoTotalPool - feeAmount);

        if (feeShares == 0) {
            _setTimeStamp(
                _poolToken,
                currentTime
            );
            return;
        }

        _increasePositionLendingDeposit(
            FEE_MANAGER_NFT,
            _poolToken,
            feeShares
        );

        _increaseTotalDepositShares(
            _poolToken,
            feeShares
        );

        _setTimeStamp(
            _poolToken,
            currentTime
        );
    }

    /**
     * @dev Internal increas function for
     * lending shares of a postion {_nftId}
     * and {_poolToken}.
     */
    function _increasePositionLendingDeposit(
        uint256 _nftId,
        address _poolToken,
        uint256 _shares
    )
        internal
    {
        userLendingData[_nftId][_poolToken].shares += _shares;
    }

    /**
     * @dev Internal decrease function for
     * lending shares of a postion {_nftId}
     * and {_poolToken}.
     */
    function _decreaseLendingShares(
        uint256 _nftId,
        address _poolToken,
        uint256 _shares
    )
        internal
    {
        userLendingData[_nftId][_poolToken].shares -= _shares;
    }

    /**
     * @dev Internal helper function adding a new
     * {_poolToken} token to {userTokenData} if needed.
     * Check is done by using hash maps.
     */
    function _addPositionTokenData(
        uint256 _nftId,
        address _poolToken,
        mapping(bytes32 => bool) storage hashMap,
        mapping(uint256 => address[]) storage userTokenData
    )
        internal
    {
        bytes32 hashData = _getHash(
            _nftId,
            _poolToken
        );

        if (hashMap[hashData] == true) {
            return;
        }

        hashMap[hashData] = true;

        userTokenData[_nftId].push(
            _poolToken
        );

        if (userTokenData[_nftId].length > MAX_TOTAL_TOKEN_NUMBER) {
            revert TooManyTokens();
        }
    }

    /**
     * @dev Internal helper calculating
     * a hash out of {_nftId} and {_poolToken}
     * using keccak256.
     */
    function _getHash(
        uint256 _nftId,
        address _poolToken
    )
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                _nftId,
                _poolToken
            )
        );
    }

    /**
     * @dev Internal helper function deleting an
     * entry in {_deleteLastPositionData}.
     */
    function _removePositionData(
        uint256 _nftId,
        address _poolToken,
        function(uint256) view returns (uint256) _getPositionTokenLength,
        function(uint256, uint256) view returns (address) _getPositionTokenByIndex,
        function(uint256, address) internal _deleteLastPositionData,
        bool isLending
    )
        private
    {
        uint256 length = _getPositionTokenLength(
            _nftId
        );

        if (length == 1) {
            _deleteLastPositionData(
                _nftId,
                _poolToken
            );

            return;
        }

        uint8 i;
        uint256 endPosition = length - 1;

        while (i < length) {

            if (i == endPosition) {
                _deleteLastPositionData(
                    _nftId,
                    _poolToken
                );

                break;
            }

            if (_getPositionTokenByIndex(_nftId, i) != _poolToken) {
                unchecked {
                    ++i;
                }
                continue;
            }

            address poolToken = _getPositionTokenByIndex(
                _nftId,
                endPosition
            );

            isLending == true
                ? positionLendTokenData[_nftId][i] = poolToken
                : positionBorrowTokenData[_nftId][i] = poolToken;

            _deleteLastPositionData(
                _nftId,
                _poolToken
            );

            break;
        }
    }

    /**
     * @dev Internal helper deleting last entry
     * of postion lending data.
     */
    function _deleteLastPositionLendingData(
        uint256 _nftId,
        address _poolToken
    )
        private
    {
        positionLendTokenData[_nftId].pop();
        hashMapPositionLending[
            _getHash(
                _nftId,
                _poolToken
            )
        ] = false;
    }

    /**
     * @dev Core function combining payback
     * logic with security checks.
     */
    function _corePayback(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount,
        uint256 _shares
    )
        internal
    {
        _updatePoolStorage(
            _poolToken,
            _amount,
            _shares,
            _increaseTotalPool,
            _decreasePseudoTotalBorrowAmount,
            _decreaseTotalBorrowShares
        );

        _decreasePositionMappingValue(
            userBorrowShares,
            _nftId,
            _poolToken,
            _shares
        );

        if (userBorrowShares[_nftId][_poolToken] > 0) {
            return;
        }

        _removePositionData({
            _nftId: _nftId,
            _poolToken: _poolToken,
            _getPositionTokenLength: getPositionBorrowTokenLength,
            _getPositionTokenByIndex: getPositionBorrowTokenByIndex,
            _deleteLastPositionData: _deleteLastPositionBorrowData,
            isLending: false
        });
    }

    /**
     * @dev Internal helper deleting last entry
     * of postion borrow data.
     */
    function _deleteLastPositionBorrowData(
        uint256 _nftId,
        address _poolToken
    )
        private
    {
        positionBorrowTokenData[_nftId].pop();
        hashMapPositionBorrow[
            _getHash(
                _nftId,
                _poolToken
            )
        ] = false;
    }

    /**
     * @dev Internal helper function calculating
     * returning if a {_poolToken} of a {_nftId}
     * is uncollateralized.
     */
    function isUncollateralized(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (bool)
    {
        return userLendingData[_nftId][_poolToken].unCollateralized;
    }

    /**
     * @dev Internal helper function
     * checking if {_nftId} as no
     * {_poolToken} left.
     */
    function _checkLendingDataEmpty(
        uint256 _nftId,
        address _poolToken
    )
        private
        view
        returns (bool)
    {
        return userLendingData[_nftId][_poolToken].shares == 0
            && pureCollateralAmount[_nftId][_poolToken] == 0;
    }

    /**
     * @dev Internal helper function
     * calculating new borrow rates
     * for {_poolToken}. Uses smooth
     * functions of the form
     * f(x) = a * x /(p(p-x)) with
     * p > 1E18 the {pole} and
     * a the {mulFactor}.
     */
    function _calculateNewBorrowRate(
        address _poolToken
    )
        internal
    {
        uint256 pole = borrowRatesData[_poolToken].pole;
        uint256 utilization = globalPoolData[_poolToken].utilization;

        uint256 baseDivider = pole
            * (pole - utilization);

        borrowPoolData[_poolToken].borrowRate =
            borrowRatesData[_poolToken].multiplicativeFactor
                * PRECISION_FACTOR_E18
                * utilization
                / baseDivider;
    }

    /**
     * @dev Internal helper function
     * updating utilization of the pool
     * with {_poolToken}, calculating the
     * new borrow rate and running LASA if
     * the time intervall of three hours has
     * passed.
     */
    function _newBorrowRate(
        address _poolToken
    )
        internal
    {
        _updateUtilization(
            _poolToken
        );

        _calculateNewBorrowRate(
            _poolToken
        );
    }

    /**
     * @dev Internal helper function
     * checking if time interval for
     * next LASA call has passed.
     */
    function _aboveThreshold(
        address _poolToken
    )
        internal
        view
        returns (bool)
    {
        return block.timestamp - timestampsPoolData[_poolToken].timeStampScaling >= THREE_HOURS;
    }

    /**
     * @dev function that tries to maximise totalDepositShares of the pool.
     * Reacting to negative and positive feedback by changing the resonance
     * factor of the pool. Method similar to one parameter monte-carlo methods
     */
    function _scalingAlgorithm(
        address _poolToken
    )
        internal
    {
        uint256 totalShares = lendingPoolData[_poolToken].totalDepositShares;

        if (algorithmData[_poolToken].maxValue <= totalShares) {

            _newMaxPoolShares(
                _poolToken,
                totalShares
            );

            _saveUp(
                _poolToken,
                totalShares
            );

            return;
        }

        _resonanceOutcome(_poolToken, totalShares) == true
            ? _resetResonanceFactor(_poolToken, totalShares)
            : _updateResonanceFactor(_poolToken, totalShares);

        _saveUp(
            _poolToken,
            totalShares
        );
    }

    /**
     * @dev Sets the new max value in shares
     * and saves the corresponding resonance factor.
     */
    function _newMaxPoolShares(
        address _poolToken,
        uint256 _shareValue
    )
        private
    {
        _setMaxValue(
            _poolToken,
            _shareValue
        );

        _setBestPole(
            _poolToken,
            borrowRatesData[_poolToken].pole
        );
    }

    /**
     * @dev Internal function setting {previousValue}
     * and {timestampScaling} for LASA of pool with
     * {_poolToken}.
     */
    function _saveUp(
        address _poolToken,
        uint256 _shareValue
    )
        private
    {
        algorithmData[_poolToken].previousValue = _shareValue;

        _setTimeStampScaling(
            _poolToken,
            block.timestamp
        );
    }

    /**
     * @dev Returns bool to determine if resonance
     * factor needs to be reset to last best value.
     */
    function _resonanceOutcome(
        address _poolToken,
        uint256 _shareValue
    )
        private
        view
        returns (bool)
    {
        return _shareValue < THRESHOLD_RESET_RESONANCE_FACTOR
            * algorithmData[_poolToken].maxValue
            / PRECISION_FACTOR_E18;
    }

    /**
     * @dev Resets resonance factor to old best value when system
     * evolves into too bad state and sets current totalDepositShares
     * amount to new maxPoolShares to exclude eternal loops and that
     * unorganic peaks do not set maxPoolShares forever.
     */
    function _resetResonanceFactor(
        address _poolToken,
        uint256 _shareValue
    )
        private
    {
        _setPole(
            _poolToken,
            algorithmData[_poolToken].bestPole
        );

        _setMaxValue(
            _poolToken,
            _shareValue
        );

        _revertDirectionState(
            _poolToken
        );
    }

    /**
     * @dev Reverts the flag for stepping direction from LASA.
     */
    function _revertDirectionState(
        address _poolToken
    )
        private
    {
        _setIncreasePole(
            _poolToken,
            !algorithmData[_poolToken].increasePole
        );
    }

    /**
     * @dev Function combining all possible stepping scenarios.
     * Depending how share values has changed compared to last time.
     */
    function _updateResonanceFactor(
        address _poolToken,
        uint256 _shareValues
    )
        private
    {
        _shareValues < THRESHOLD_SWITCH_DIRECTION
            * algorithmData[_poolToken].previousValue
            / PRECISION_FACTOR_E18
            ? _reversedResonanceFactor(_poolToken)
            : _changingResonanceFactor(_poolToken);
    }

    /**
     * @dev Does a revert stepping and swaps stepping state in opposite flag.
     */
    function _reversedResonanceFactor(
        address _poolToken
    )
        private
    {
        algorithmData[_poolToken].increasePole
            ? _decreaseResonanceFactor(_poolToken)
            : _increaseResonanceFactor(_poolToken);

        _revertDirectionState(
            _poolToken
        );
    }

    /**
     * @dev Increasing or decresing resonance factor depending on flag value.
     */
    function _changingResonanceFactor(
        address _poolToken
    )
        private
    {
        algorithmData[_poolToken].increasePole
            ? _increaseResonanceFactor(_poolToken)
            : _decreaseResonanceFactor(_poolToken);
    }

    /**
     * @dev stepping function increasing the resonance factor
     * depending on the time past in the last time interval.
     * Checks if current resonance factor is bigger than max value.
     * If this is the case sets current value to maximal value
     */
    function _increaseResonanceFactor(
        address _poolToken
    )
        private
    {
        BorrowRatesEntry memory borrowData = borrowRatesData[
            _poolToken
        ];

        uint256 delta = borrowData.deltaPole
            * (block.timestamp - timestampsPoolData[_poolToken].timeStampScaling);

        uint256 sum = delta
            + borrowData.pole;

        uint256 setValue = sum > borrowData.maxPole
            ? borrowData.maxPole
            : sum;

        _setPole(
            _poolToken,
            setValue
        );
    }

    /**
     * @dev Stepping function decresing the resonance factor
     * depending on the time past in the last time interval.
     * Checks if current resonance factor undergoes the min value,
     * if this is the case sets current value to minimal value.
     */
    function _decreaseResonanceFactor(
        address _poolToken
    )
        private
    {
        uint256 minValue = borrowRatesData[_poolToken].minPole;

        uint256 delta = borrowRatesData[_poolToken].deltaPole
            * (block.timestamp - timestampsPoolData[_poolToken].timeStampScaling);

        uint256 sub = borrowRatesData[_poolToken].pole > delta
            ? borrowRatesData[_poolToken].pole - delta
            : 0;

        uint256 setValue = sub < minValue
            ? minValue
            : sub;

        _setPole(
            _poolToken,
            setValue
        );
    }

    /**
     * @dev Internal helper function for removing token address
     * from lending data array if all shares are removed. When
     * feeManager (nftId = 0) is calling this function is skipped
     * to save gas for continues fee accounting.
     */
    function _removeEmptyLendingData(
        uint256 _nftId,
        address _poolToken
    )
        internal
    {
        if (_nftId == 0) {
            return;
        }

        if (_checkLendingDataEmpty(_nftId, _poolToken) == false) {
            return;
        }

        _removePositionData({
            _nftId: _nftId,
            _poolToken: _poolToken,
            _getPositionTokenLength: getPositionLendingTokenLength,
            _getPositionTokenByIndex: getPositionLendingTokenByIndex,
            _deleteLastPositionData: _deleteLastPositionLendingData,
            isLending: true
        });
    }

    /**
     * @dev Internal helper function grouping several function
     * calls into one function for refactoring and code size
     * reduction.
     */
    function _updatePoolStorage(
        address _poolToken,
        uint256 _amount,
        uint256 _shares,
        function(address, uint256) functionAmountA,
        function(address, uint256) functionAmountB,
        function(address, uint256) functionSharesA
    )
        internal
    {
        functionAmountA(
            _poolToken,
            _amount
        );

        functionAmountB(
            _poolToken,
            _amount
        );

        functionSharesA(
            _poolToken,
            _shares
        );
    }
}
