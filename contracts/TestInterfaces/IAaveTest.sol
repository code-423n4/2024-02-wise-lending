// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IAaveTest {

    function deposit(
        address _token,
        uint256 _amount,
        address _owner,
        uint16 _referralCode
    )
        external;

    function supply(
        address _token,
        uint256 _amount,
        address _owner,
        uint16 _referralCode
    )
        external;
}