// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IDssPsm {

    function buyGem(
        address _usr,
        uint256 _gemAmt
    )
        external;

    function sellGem(
        address _usr,
        uint256 _gemAmt
    )
        external;
}