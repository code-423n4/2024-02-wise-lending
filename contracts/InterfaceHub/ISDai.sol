// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface ISDai {

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    )
        external
        returns (uint256 assets);

    function convertToShares(
        uint256 assets
    )
        external
        view
        returns (uint256);

    function convertToAssets(
        uint256 _sDAIAmount
    )
        external
        view
        returns (uint256);

    function decimals()
        external
        view
        returns (uint8);

    function deposit(
        uint256 assets,
        address receiver
    )
        external
        returns (uint256);

    function balanceOf(
        address _account
    )
        external
        view
        returns (uint256);
}
