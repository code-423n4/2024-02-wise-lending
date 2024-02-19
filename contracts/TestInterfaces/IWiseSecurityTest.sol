// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IWiseSecurityTest {

    function getPositionLendingAmount(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function getBorrowRate(
        address _poolToken
    )
        external
        view
        returns (uint256);

    function getPositionBorrowAmount(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function checkMinDepositValue(
        address _poolToken,
        uint256 _amount
    )
        external
        view
        returns (bool);

    function getLiveDebtRatio(
        uint256 _nftId
    )
        external
        view
        returns (uint256);
}