// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IAggregator {

    function maxAnswer()
        external
        view
        returns (int192);

    function minAnswer()
        external
        view
        returns (int192);
}
