// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface ISyntethicLp {

    function mint(
        address _beneficiary,
        uint256 _leverage,
        uint256 _depositAmount
    )
        external
        returns (uint256);

    function burn(
        address _beneficiary,
        uint256 _amount
    )
        external;
}