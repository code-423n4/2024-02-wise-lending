// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface ITriCrypto {

    function add_liquidity(
        uint256[3] memory _depositAmounts,
        uint256 _minOutAmount
    )
        external;

    function approve(
        address _spender,
        uint256 _amount
    )
        external
        returns (bool);
}