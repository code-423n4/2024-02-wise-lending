// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IWstETHTest {

    function wrap(
        uint256 _stETHAmount
    )
        external
        returns (uint256);

    function unwrap(
        uint256 _wstETHAmount
    )
        external
        returns (uint256);

    function getStETHByWstETH(
        uint256 _wstETHAmount
    )
        external
        view
        returns (uint256);

    function balanceOf(
        address _account
    )
        external
        view
        returns (uint256);
}
