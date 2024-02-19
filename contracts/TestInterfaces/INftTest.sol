// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface INftTest {

    function totalSupply()
        external
        view
        returns (uint256);

    function mintPosition()
        external;

    function walletOfOwner(
        address _owner
    )
        external
        view
        returns (uint256[] memory);

    function mintPositionForUser(
        address _user
    )
        external
        returns (uint256);

}