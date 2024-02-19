// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IOraclePendle {
    function getOracleState(
        address market,
        uint32 duration
    )
        external
        view
        returns (
            bool increaseCardinalityRequired,
            uint16 cardinalityRequired,
            bool oldestObservationSatisfied
        );

    function getPtToAssetRate(
        address market,
        uint32 duration
    )
        external
        view
        returns (uint256 ptToAssetRate);
}