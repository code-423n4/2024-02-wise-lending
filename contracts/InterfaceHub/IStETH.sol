// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IStETH {

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
}
