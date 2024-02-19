// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface ICustomOracle {
        function setRoundData(
        uint80 _roundId,
        uint256 _updateTime
    )
        external;

    function setLastUpdateGlobal(
        uint256 _time
    )
        external;

    function setGlobalAggregatorRoundId(
        uint80 _aggregatorRoundId
    )
        external;
}
