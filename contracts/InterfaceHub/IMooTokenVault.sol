// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IMooTokenVault {

    function approve(
        address _spender,
        uint256 _amount
    )
        external
        returns (bool);

    function totalSupply()
        external
        view
        returns (uint256);

    function withdraw(
        uint256 _shares
    )
        external;

    function getPricePerFullShare()
        external
        view
        returns (uint256);

    function balanceOf(
        address _user
    )
        external
        view
        returns (uint256);

    function decimals()
        external
        view
        returns (uint8);

    function depositAll()
        external;
}
