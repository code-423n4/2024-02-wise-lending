// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./Declarations.sol";

abstract contract AaveHelper is Declarations {

    modifier nonReentrant() {
        _nonReentrantCheck();
        _;
    }

    modifier validToken(
        address _poolToken
    ) {
        _validToken(
            aaveTokenAddress[_poolToken]
        );
        _;
    }

    function _validToken(
        address _poolToken
    )
        internal
        view
    {
        if (WISE_LENDING.getTotalDepositShares(_poolToken) == 0) {
            revert InvalidToken();
        }
    }

    function _nonReentrantCheck()
        internal
        view
    {
        if (sendingProgressAaveHub == true) {
            revert InvalidAction();
        }

        if (WISE_LENDING.sendingProgress() == true) {
            revert InvalidAction();
        }
    }

    function _reservePosition()
        internal
        returns (uint256)
    {
        return POSITION_NFT.reservePositionForUser(
            msg.sender
        );
    }

    function _wrapDepositExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _depositAmount
    )
        internal
        returns (uint256)
    {
        uint256 actualDepositAmount = _wrapAaveReturnValueDeposit(
            _underlyingAsset,
            _depositAmount,
            address(this)
        );

        if (POSITION_NFT.isOwner(_nftId, msg.sender) == false) {
            revert InvalidAction();
        }

        uint256 lendingShares = WISE_LENDING.depositExactAmount(
            _nftId,
            aaveTokenAddress[_underlyingAsset],
            actualDepositAmount
        );

        return lendingShares;
    }

    function _wrapWithdrawExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        address _underlyingAssetRecipient,
        uint256 _withdrawAmount
    )
        internal
        returns (
            uint256,
            uint256
        )
    {
        uint256 withdrawnShares = WISE_LENDING.withdrawOnBehalfExactAmount(
            _nftId,
            aaveTokenAddress[_underlyingAsset],
            _withdrawAmount
        );

        uint256 actualAmount = AAVE.withdraw(
            _underlyingAsset,
            _withdrawAmount,
            _underlyingAssetRecipient
        );

        return (
            withdrawnShares,
            actualAmount
        );
    }

    function _wrapWithdrawExactShares(
        uint256 _nftId,
        address _underlyingAsset,
        address _underlyingAssetRecipient,
        uint256 _shareAmount
    )
        internal
        returns (uint256)
    {
        address aaveToken = aaveTokenAddress[
            _underlyingAsset
        ];

        uint256 withdrawAmount = WISE_LENDING.withdrawOnBehalfExactShares(
            _nftId,
            aaveToken,
            _shareAmount
        );

        withdrawAmount = AAVE.withdraw(
            _underlyingAsset,
            withdrawAmount,
            _underlyingAssetRecipient
        );

        return withdrawAmount;
    }

    function _wrapBorrowExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        address _underlyingAssetRecipient,
        uint256 _borrowAmount
    )
        internal
        returns (uint256)
    {
        uint256 borrowShares = WISE_LENDING.borrowOnBehalfExactAmount(
            _nftId,
            aaveTokenAddress[_underlyingAsset],
            _borrowAmount
        );

        AAVE.withdraw(
            _underlyingAsset,
            _borrowAmount,
            _underlyingAssetRecipient
        );

        return borrowShares;
    }

    function _wrapAaveReturnValueDeposit(
        address _underlyingAsset,
        uint256 _depositAmount,
        address _targetAddress
    )
        internal
        returns (uint256 res)
    {
        IERC20 token = IERC20(
            aaveTokenAddress[_underlyingAsset]
        );

        uint256 balanceBefore = token.balanceOf(
            address(this)
        );

        AAVE.supply(
            _underlyingAsset,
            _depositAmount,
            _targetAddress,
            REF_CODE
        );

        uint256 balanceAfter = token.balanceOf(
            address(this)
        );

        res = balanceAfter
            - balanceBefore;
    }

    function _sendValue(
        address _recipient,
        uint256 _amount
    )
        internal
    {
        if (address(this).balance < _amount) {
            revert InvalidValue();
        }

        sendingProgressAaveHub = true;

        (bool success, ) = payable(_recipient).call{
            value: _amount
        }("");

        sendingProgressAaveHub = false;

        if (success == false) {
            revert FailedInnerCall();
        }
    }

    function _getInfoPayback(
        uint256 _ethSent,
        uint256 _maxPaybackAmount
    )
        internal
        pure
        returns (
            uint256,
            uint256
        )
    {
        if (_ethSent > _maxPaybackAmount) {
            return (
                _maxPaybackAmount,
                _ethSent - _maxPaybackAmount
            );
        }

        return (
            _ethSent,
            0
        );
    }

    function _prepareCollaterals(
        uint256 _nftId,
        address _poolToken
    )
        private
    {
        uint256 i;
        uint256 l = WISE_LENDING.getPositionLendingTokenLength(
            _nftId
        );

        for (i; i < l;) {

            address currentAddress = WISE_LENDING.getPositionLendingTokenByIndex(
                _nftId,
                i
            );

            unchecked {
                ++i;
            }

            if (currentAddress == _poolToken) {
                continue;
            }

            WISE_LENDING.preparePool(
                currentAddress
            );

            WISE_LENDING.newBorrowRate(
                _poolToken
            );
        }
    }

    function _prepareBorrows(
        uint256 _nftId,
        address _poolToken
    )
        private
    {
        uint256 i;
        uint256 l = WISE_LENDING.getPositionBorrowTokenLength(
            _nftId
        );

        for (i; i < l;) {

            address currentAddress = WISE_LENDING.getPositionBorrowTokenByIndex(
                _nftId,
                i
            );

            unchecked {
                ++i;
            }

            if (currentAddress == _poolToken) {
                continue;
            }

            WISE_LENDING.preparePool(
                currentAddress
            );

            WISE_LENDING.newBorrowRate(
                _poolToken
            );
        }
    }

    function getAavePoolAPY(
        address _underlyingAsset
    )
        public
        view
        returns (uint256)
    {
        return AAVE.getReserveData(_underlyingAsset).currentLiquidityRate
            / PRECISION_FACTOR_E9;
    }
}
