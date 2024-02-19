// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IHybridToken {

    function mint(
        address _account,
        uint256 _amount
    )
        external;

    function burn(
        address _account,
        uint256 _amount
    )
        external;

    function totalSupply()
        external
        view
        returns (uint256);
}
