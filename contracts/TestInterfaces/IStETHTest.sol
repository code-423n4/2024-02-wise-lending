// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IStETHTest {

    function submit(
        address _referral
    )
        external
        payable
        returns (uint256);

    function balanceOf(
        address _account
    )
        external
        view
        returns (uint256);

    function getPooledEthByShares(
        uint256 _sharesAmount
    )
        external
        view
        returns (uint256);

    function getSharesByPooledEth(
        uint256 _ethAmount
    )
        external
        view
        returns (uint256);

    function receiveELRewards()
        external
        payable;
}