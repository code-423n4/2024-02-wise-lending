// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./WiseLendingDeclaration.sol";

abstract contract WiseLowLevelHelper is WiseLendingDeclaration {

    modifier onlyFeeManager() {
        _onlyFeeManager();
        _;
    }

    function _onlyFeeManager()
        private
        view
    {
        if (msg.sender == address(FEE_MANAGER)) {
            return;
        }

        revert InvalidCaller();
    }

    function _validateParameter(
        uint256 _parameterValue,
        uint256 _parameterLimit
    )
        internal
        pure
    {
        if (_parameterValue > _parameterLimit) {
            revert InvalidAction();
        }
    }

    // --- Basic Public Views Functions ----

    function getTotalPool(
        address _poolToken
    )
        public
        view
        returns (uint256)
    {
        return globalPoolData[_poolToken].totalPool;
    }

    function getPseudoTotalPool(
        address _poolToken
    )
        public
        view
        returns (uint256)
    {
        return lendingPoolData[_poolToken].pseudoTotalPool;
    }

    function getTotalBareToken(
        address _poolToken
    )
        external
        view
        returns (uint256)
    {
        return globalPoolData[_poolToken].totalBareToken;
    }

    function getPseudoTotalBorrowAmount(
        address _poolToken
    )
        external
        view
        returns (uint256)
    {
        return borrowPoolData[_poolToken].pseudoTotalBorrowAmount;
    }

    function getTotalDepositShares(
        address _poolToken
    )
        external
        view
        returns (uint256)
    {
        return lendingPoolData[_poolToken].totalDepositShares;
    }

    function getTotalBorrowShares(
        address _poolToken
    )
        external
        view
        returns (uint256)
    {
        return borrowPoolData[_poolToken].totalBorrowShares;
    }

    function getPositionLendingShares(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256)
    {
        return userLendingData[_nftId][_poolToken].shares;
    }

    function getPositionBorrowShares(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256)
    {
        return userBorrowShares[_nftId][_poolToken];
    }

    function getPureCollateralAmount(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256)
    {
        return pureCollateralAmount[_nftId][_poolToken];
    }

    // --- Basic Internal Get Functions ----

    function getTimeStamp(
        address _poolToken
    )
        external
        view
        returns (uint256)
    {
        return timestampsPoolData[_poolToken].timeStamp;
    }

    function getPositionLendingTokenByIndex(
        uint256 _nftId,
        uint256 _index
    )
        public
        view
        returns (address)
    {
        return positionLendTokenData[_nftId][_index];
    }

    function getPositionLendingTokenLength(
        uint256 _nftId
    )
        public
        view
        returns (uint256)
    {
        return positionLendTokenData[_nftId].length;
    }

    function getPositionBorrowTokenByIndex(
        uint256 _nftId,
        uint256 _index
    )
        public
        view
        returns (address)
    {
        return positionBorrowTokenData[_nftId][_index];
    }

    function getPositionBorrowTokenLength(
        uint256 _nftId
    )
        public
        view
        returns (uint256)
    {
        return positionBorrowTokenData[_nftId].length;
    }

    // --- Basic Internal Set Functions ----

    function _setMaxValue(
        address _poolToken,
        uint256 _value
    )
        internal
    {
        algorithmData[_poolToken].maxValue = _value;
    }

    function _setBestPole(
        address _poolToken,
        uint256 _value
    )
        internal
    {
        algorithmData[_poolToken].bestPole = _value;
    }

    function _setIncreasePole(
        address _poolToken,
        bool _state
    )
        internal
    {
        algorithmData[_poolToken].increasePole = _state;
    }

    function _setPole(
        address _poolToken,
        uint256 _value
    )
        internal
    {
        borrowRatesData[_poolToken].pole = _value;
    }

    function _increaseTotalPool(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        globalPoolData[_poolToken].totalPool += _amount;
    }

    function _decreaseTotalPool(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        globalPoolData[_poolToken].totalPool -= _amount;
    }

    function _increaseTotalDepositShares(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        lendingPoolData[_poolToken].totalDepositShares += _amount;
    }

    function _decreaseTotalDepositShares(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        lendingPoolData[_poolToken].totalDepositShares -= _amount;
    }

    function _increasePseudoTotalBorrowAmount(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        borrowPoolData[_poolToken].pseudoTotalBorrowAmount += _amount;
    }

    function _decreasePseudoTotalBorrowAmount(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        borrowPoolData[_poolToken].pseudoTotalBorrowAmount -= _amount;
    }

    function _increaseTotalBorrowShares(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        borrowPoolData[_poolToken].totalBorrowShares += _amount;
    }

    function _decreaseTotalBorrowShares(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        borrowPoolData[_poolToken].totalBorrowShares -= _amount;
    }

    function _increasePseudoTotalPool(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        lendingPoolData[_poolToken].pseudoTotalPool += _amount;
    }

    function _decreasePseudoTotalPool(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        lendingPoolData[_poolToken].pseudoTotalPool -= _amount;
    }

    function _setTimeStamp(
        address _poolToken,
        uint256 _time
    )
        internal
    {
        timestampsPoolData[_poolToken].timeStamp = _time;
    }

    function _setTimeStampScaling(
        address _poolToken,
        uint256 _time
    )
        internal
    {
        timestampsPoolData[_poolToken].timeStampScaling = _time;
    }

    function _increaseTotalBareToken(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        globalPoolData[_poolToken].totalBareToken += _amount;
    }

    function _decreaseTotalBareToken(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        globalPoolData[_poolToken].totalBareToken -= _amount;
    }

    function _checkReentrancy()
        internal
        view
    {
        if (sendingProgress == true) {
            revert InvalidAction();
        }

        if (_sendingProgressAaveHub() == true) {
            revert InvalidAction();
        }
    }

    function _sendingProgressAaveHub()
        private
        view
        returns (bool)
    {
        return IAaveHubLite(AAVE_HUB_ADDRESS).sendingProgressAaveHub();
    }

    function _decreasePositionMappingValue(
        mapping(uint256 => mapping(address => uint256)) storage userMapping,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        userMapping[_nftId][_poolToken] -= _amount;
    }

    function _increaseMappingValue(
        mapping(uint256 => mapping(address => uint256)) storage userMapping,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        userMapping[_nftId][_poolToken] += _amount;
    }

    function _byPassCase(
        address _sender
    )
        internal
        view
        returns (bool)
    {
        if (verifiedIsolationPool[_sender] == true) {
            return true;
        }

        return false;
    }

    function _increaseTotalAndPseudoTotalPool(
        address _poolToken,
        uint256 _amount
    )
        internal
    {
        _increasePseudoTotalPool(
            _poolToken,
            _amount
        );

        _increaseTotalPool(
            _poolToken,
            _amount
        );
    }

    function setPoolFee(
        address _poolToken,
        uint256 _newFee
    )
        external
        onlyFeeManager
    {
        globalPoolData[_poolToken].poolFee = _newFee;
    }

    function _checkOwnerPosition(
        uint256 _nftId,
        address _msgSender
    )
        internal
        view
    {
        WISE_SECURITY.checkOwnerPosition(
            _nftId,
            _msgSender
        );
    }

    function _validateNonZero(
        uint256 _value
    )
        internal
        pure
    {
        if (_value == 0) {
            revert ValueIsZero();
        }
    }

    function _validateZero(
        uint256 _value
    )
        internal
        pure
    {
        if (_value > 0) {
            revert ValueNotZero();
        }
    }
}
