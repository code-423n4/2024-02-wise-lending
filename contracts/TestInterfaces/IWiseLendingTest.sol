// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

struct CreatePool {
    bool allowBorrow;
    address poolToken;
    uint256 poolMulFactor;
    uint256 poolCollFactor;
    uint256 maxDepositAmount;
}

interface IWiseLendingTest {

    function depositExactAmountETHMint()
        external
        payable
        returns (uint256);

    function master()
        external
        view
        returns (address);

    function getPositionBorrowShares(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function depositExactAmountETH(
        uint256 _nftId
    )
        external
        payable
        returns (uint256);

    function liquidatePartiallyFromTokens(
        uint256 _nftId,
        uint256 _nftIdLiquidator,
        address _paybackToken,
        address _receiveToken,
        uint256 _shareAmountToPay
    )
        external
        payable
        returns (uint256);

    function getPositionLendingShares(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function setVerifiedIsolationPool(
        address _isolationPool,
        bool _state
    )
        external;

    function setVeryfiedIsolationPool(
        address _isolationPool,
        bool _state
    )
        external;

    function depositExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        returns (uint256);

    function getTotalPool(
        address _poolToken
    )
        external
        view
        returns (uint256);

    function approve(
        address _spender,
        address _poolToken,
        uint256 _amount
    )
        external;

    function createPool(
        CreatePool memory _params
    )
        external;
}
