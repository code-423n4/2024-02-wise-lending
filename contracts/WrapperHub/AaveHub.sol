// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author Christoph Krpoun
 * @author René Hochmuth
 * @author Vitally Marinchenko
 */

import "./AaveHelper.sol";
import "../TransferHub/TransferHelper.sol";
import "../TransferHub/ApprovalHelper.sol";

/**
 * @dev Purpose of this contract is to optimize capital efficency by using
 * aave pools. Not borrowed funds are deposited into correspoding aave pools
 * to earn supply APY.
 *
 * The aToken are holded by the wiseLending contract but the accounting
 * is managed by the position NFTs. This is possible due to the included
 * onBehlaf functionallity inside wiseLending.
 */

contract AaveHub is AaveHelper, TransferHelper, ApprovalHelper {

    constructor(
        address _master,
        address _aaveAddress,
        address _lendingAddress
    )
        Declarations(
            _master,
            _aaveAddress,
            _lendingAddress
        )
    {}

    /**
     * @dev Adds new mapping to aaveHub. Needed
     * to link underlying assets with corresponding
     * aTokens. Can only be called by master.
     */
    function setAaveTokenAddress(
        address _underlyingAsset,
        address _aaveToken
    )
        external
        onlyMaster
    {
        _setAaveTokenAddress(
            _underlyingAsset,
            _aaveToken
        );

    }

    /**
     * @dev Adds new mapping to aaveHub in bulk.
     * Needed to link underlying assets with
     * corresponding aTokens. Can only be called by master.
     */

    function setAaveTokenAddressBulk(
        address[] calldata _underlyingAssets,
        address[] calldata _aaveTokens
    )
        external
        onlyMaster
    {
        for (uint256 i = 0; i < _underlyingAssets.length; i++) {
            _setAaveTokenAddress(
                _underlyingAssets[i],
                _aaveTokens[i]
            );
        }
    }

    /**
     * @dev Receive functions forwarding
     * sent ETH to the master address
     */
    receive()
        external
        payable
    {
        if (msg.sender == WETH_ADDRESS) {
            return;
        }

        _sendValue(
            master,
            msg.value
        );
    }

    /**
     * @dev Allows deposit ERC20 token to
     * wiseLending and takes token amount
     * as arguement. Also mints position
     * NFT to reduce needed transactions.
     */
    function depositExactAmountMint(
        address _underlyingAsset,
        uint256 _amount
    )
        external
        returns (uint256)
    {
        return depositExactAmount(
            _reservePosition(),
            _underlyingAsset,
            _amount
        );
    }

    /**
     * @dev Allows deposit ERC20 token to
     * wiseLending and takes token amount as
     * argument.
     */
    function depositExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _amount
    )
        public
        nonReentrant
        validToken(_underlyingAsset)
        returns (uint256)
    {
        _safeTransferFrom(
            _underlyingAsset,
            msg.sender,
            address(this),
            _amount
        );

        uint256 lendingShares = _wrapDepositExactAmount(
            _nftId,
            _underlyingAsset,
            _amount
        );

        emit IsDepositAave(
            _nftId,
            block.timestamp
        );

        return lendingShares;
    }

    /**
     * @dev Allows to deposit ETH token directly to
     * wiseLending and takes token amount as argument.
     * Also mints position NFT to avoid extra transaction.
     */
    function depositExactAmountETHMint()
        external
        payable
        returns (uint256)
    {
        return depositExactAmountETH(
            _reservePosition()
        );
    }

    /**
     * @dev Allows to deposit ETH token directly to
     * wiseLending and takes token amount as argument.
     */
    function depositExactAmountETH(
        uint256 _nftId
    )
        public
        payable
        nonReentrant
        returns (uint256)
    {
        _wrapETH(
            msg.value
        );

        uint256 lendingShares = _wrapDepositExactAmount(
            _nftId,
            WETH_ADDRESS,
            msg.value
        );

        emit IsDepositAave(
            _nftId,
            block.timestamp
        );

        return lendingShares;
    }

    /**
     * @dev Allows to withdraw deposited ERC20 token.
     * Takes _withdrawAmount as argument.
     */
    function withdrawExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _withdrawAmount
    )
        external
        nonReentrant
        validToken(_underlyingAsset)
        returns (uint256)
    {
        _checkOwner(
            _nftId
        );

        (
            uint256 withdrawnShares
            ,
        ) = _wrapWithdrawExactAmount(
            _nftId,
            _underlyingAsset,
            msg.sender,
            _withdrawAmount
        );

        emit IsWithdrawAave(
            _nftId,
            block.timestamp
        );

        return withdrawnShares;
    }

    /**
     * @dev Allows to withdraw deposited ETH token.
     * Takes token amount as argument.
     */
    function withdrawExactAmountETH(
        uint256 _nftId,
        uint256 _withdrawAmount
    )
        external
        nonReentrant
        returns (uint256)
    {
        _checkOwner(
            _nftId
        );

        (
            uint256 withdrawnShares,
            uint256 actualAmount
        ) = _wrapWithdrawExactAmount(
            _nftId,
            WETH_ADDRESS,
            address(this),
            _withdrawAmount
        );

        _unwrapETH(
            actualAmount
        );

        _sendValue(
            msg.sender,
            actualAmount
        );

        emit IsWithdrawAave(
            _nftId,
            block.timestamp
        );

        return withdrawnShares;
    }

    /**
     * @dev Allows to withdraw deposited ERC20 token.
     * Takes _shareAmount as argument.
     */
    function withdrawExactShares(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _shareAmount
    )
        external
        nonReentrant
        validToken(_underlyingAsset)
        returns (uint256)
    {
        _checkOwner(
            _nftId
        );

        uint256 withdrawAmount = _wrapWithdrawExactShares(
            _nftId,
            _underlyingAsset,
            msg.sender,
            _shareAmount
        );

        emit IsWithdrawAave(
            _nftId,
            block.timestamp
        );

        return withdrawAmount;
    }

    /**
     * @dev Allows to withdraw deposited ETH token.
     * Takes _shareAmount as argument.
     */
    function withdrawExactSharesETH(
        uint256 _nftId,
        uint256 _shareAmount
    )
        external
        nonReentrant
        returns (uint256)
    {
        _checkOwner(
            _nftId
        );

        uint256 withdrawAmount = _wrapWithdrawExactShares(
            _nftId,
            WETH_ADDRESS,
            address(this),
            _shareAmount
        );

        _unwrapETH(
            withdrawAmount
        );

        _sendValue(
            msg.sender,
            withdrawAmount
        );

        emit IsWithdrawAave(
            _nftId,
            block.timestamp
        );

        return withdrawAmount;
    }

    /**
     * @dev Allows to borrow ERC20 token from a
     * wiseLending pool. Needs supplied collateral
     * inside the same position and to approve
     * aaveHub to borrow onBehalf for the caller.
     * Takes token amount as argument.
     */
    function borrowExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _borrowAmount
    )
        external
        nonReentrant
        validToken(_underlyingAsset)
        returns (uint256)
    {
        _checkOwner(
            _nftId
        );

        uint256 borrowShares = _wrapBorrowExactAmount(
            _nftId,
            _underlyingAsset,
            msg.sender,
            _borrowAmount
        );

        emit IsBorrowAave(
            _nftId,
            block.timestamp
        );

        return borrowShares;
    }

    /**
     * @dev Allows to borrow ETH token from
     * wiseLending. Needs supplied collateral
     * inside the same position and to approve
     * aaveHub to borrow onBehalf for the caller.
     * Takes token amount as argument.
     */
    function borrowExactAmountETH(
        uint256 _nftId,
        uint256 _borrowAmount
    )
        external
        nonReentrant
        returns (uint256)
    {
        _checkOwner(
            _nftId
        );

        uint256 borrowShares = _wrapBorrowExactAmount(
            _nftId,
            WETH_ADDRESS,
            address(this),
            _borrowAmount
        );

        _unwrapETH(
            _borrowAmount
        );

        _sendValue(
            msg.sender,
            _borrowAmount
        );

        emit IsBorrowAave(
            _nftId,
            block.timestamp
        );

        return borrowShares;
    }

    /**
     * @dev Allows to payback ERC20 token for
     * any postion. Takes _paybackAmount as argument.
     */
    function paybackExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _paybackAmount
    )
        external
        nonReentrant
        validToken(_underlyingAsset)
        returns (uint256)
    {
        _checkPositionLocked(
            _nftId
        );

        address aaveToken = aaveTokenAddress[
            _underlyingAsset
        ];

        _safeTransferFrom(
            _underlyingAsset,
            msg.sender,
            address(this),
            _paybackAmount
        );

        uint256 actualAmountDeposit = _wrapAaveReturnValueDeposit(
            _underlyingAsset,
            _paybackAmount,
            address(this)
        );

        uint256 borrowSharesReduction = WISE_LENDING.paybackExactAmount(
            _nftId,
            aaveToken,
            actualAmountDeposit
        );

        emit IsPaybackAave(
            _nftId,
            block.timestamp
        );

        return borrowSharesReduction;
    }

    /**
     * @dev Allows to payback ETH token for
     * any postion. Takes token amount as argument.
     */
    function paybackExactAmountETH(
        uint256 _nftId
    )
        external
        payable
        nonReentrant
        returns (uint256)
    {
        _checkPositionLocked(
            _nftId
        );

        address aaveWrappedETH = aaveTokenAddress[
            WETH_ADDRESS
        ];

        uint256 userBorrowShares = WISE_LENDING.getPositionBorrowShares(
            _nftId,
            aaveWrappedETH
        );

        WISE_LENDING.syncManually(
            aaveWrappedETH
        );

        uint256 maxPaybackAmount = WISE_LENDING.paybackAmount(
            aaveWrappedETH,
            userBorrowShares
        );

        (
            uint256 paybackAmount,
            uint256 ethRefundAmount

        ) = _getInfoPayback(
            msg.value,
            maxPaybackAmount
        );

        _wrapETH(
            paybackAmount
        );

        uint256 actualAmountDeposit = _wrapAaveReturnValueDeposit(
            WETH_ADDRESS,
            paybackAmount,
            address(this)
        );

        uint256 borrowSharesReduction = WISE_LENDING.paybackExactAmount(
            _nftId,
            aaveWrappedETH,
            actualAmountDeposit
        );

        if (ethRefundAmount > 0) {
            _sendValue(
                msg.sender,
                ethRefundAmount
            );
        }

        emit IsPaybackAave(
            _nftId,
            block.timestamp
        );

        return borrowSharesReduction;
    }

    /**
     * @dev Allows to payback ERC20 token for
     * any postion. Takes shares as argument.
     */
    function paybackExactShares(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _shares
    )
        external
        nonReentrant
        validToken(_underlyingAsset)
        returns (uint256)
    {
        _checkPositionLocked(
            _nftId
        );

        address aaveToken = aaveTokenAddress[
            _underlyingAsset
        ];

        WISE_LENDING.syncManually(
            aaveToken
        );

        uint256 paybackAmount = WISE_LENDING.paybackAmount(
            aaveToken,
            _shares
        );

        _safeTransferFrom(
            _underlyingAsset,
            msg.sender,
            address(this),
            paybackAmount
        );

        AAVE.supply(
            _underlyingAsset,
            paybackAmount,
            address(this),
            REF_CODE
        );

        WISE_LENDING.paybackExactShares(
            _nftId,
            aaveToken,
            _shares
        );

        emit IsPaybackAave(
            _nftId,
            block.timestamp
        );

        return paybackAmount;
    }

    function skimAave(
        address _underlyingAsset,
        bool _isAave
    )
        external
        validToken(_underlyingAsset)
        onlyMaster
    {
        address tokenToSend = _isAave
            ? aaveTokenAddress[_underlyingAsset]
            : _underlyingAsset;

        _safeTransfer(
            tokenToSend,
            master,
            IERC20(tokenToSend).balanceOf(address(this))
        );
    }

    /**
     * @dev View functions returning the combined rate
     * from aave supply APY and wiseLending borrow APY
     * of a pool.
     */
    function getLendingRate(
        address _underlyingAsset
    )
        external
        view
        returns (uint256)
    {
        address aToken = aaveTokenAddress[
            _underlyingAsset
        ];

        uint256 lendingRate = WISE_SECURITY.getLendingRate(
            aToken
        );

        uint256 aaveRate = getAavePoolAPY(
            _underlyingAsset
        );

        uint256 utilization = WISE_LENDING.globalPoolData(
            aToken
        ).utilization;

        return aaveRate
            * (PRECISION_FACTOR_E18 - utilization)
            / PRECISION_FACTOR_E18
            + lendingRate;
    }

    function _setAaveTokenAddress(
        address _underlyingAsset,
        address _aaveToken
    )
        internal
    {
        if (aaveTokenAddress[_underlyingAsset] > ZERO_ADDRESS) {
            revert AlreadySet();
        }

        aaveTokenAddress[_underlyingAsset] = _aaveToken;

        _safeApprove(
            _aaveToken,
            address(WISE_LENDING),
            MAX_AMOUNT
        );

        _safeApprove(
            _underlyingAsset,
            AAVE_ADDRESS,
            MAX_AMOUNT
        );

        emit SetAaveTokenAddress(
            _underlyingAsset,
            _aaveToken,
            block.timestamp
        );
    }
}
