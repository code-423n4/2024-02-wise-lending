// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./IERC20.sol";

interface IMoo is IERC20 {

    function deposit(
        uint256 _amount
    )
        external;

    function withdraw(
        uint256 _amount
    )
        external;
}