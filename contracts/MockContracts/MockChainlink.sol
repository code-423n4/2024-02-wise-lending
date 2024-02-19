// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./../TesterChainlink.sol";

contract MockChainlink is TesterChainlink {

    uint80 INITIATION_VALUE_GLOBAL_ROUND_ID = 5;
    address public aggregator;

    constructor(
        uint256 _ethValue,
        uint8 _decimals
    )
        TesterChainlink(
            _ethValue,
            _decimals
        )

    {
        setGlobalAggregatorRoundId(
            INITIATION_VALUE_GLOBAL_ROUND_ID
        );

        uint80 startRoundId = 1;
        uint256 startTime = block.timestamp;

        setLastUpdateGlobal(
            startTime
        );

        setRoundData(
            startRoundId,
            startTime
        );

        setRoundData(
            startRoundId + 1,
            startTime + 1200
        );

        setRoundData(
            startRoundId + 2,
            startTime + 1200 + 600 + 600 ether
        );

        setRoundData(
            startRoundId + 3,
            startTime + 1200 + 600 + 300 + 6000 ether
        );

        setRoundData(
            startRoundId + 4,
            startTime + 1200 + 600 + 300 + 6000 + 60000 ether
        );
    }

    function changeOnePercentUp()
        external
    {
        ethValuePerToken = ethValuePerToken * 101 / 100;
    }

    function changeOnePercentDown()
        external
    {
        ethValuePerToken = ethValuePerToken * 99 / 100;
    }

    function setAggregator(
        address _aggregator
    )
        external
    {
        aggregator = _aggregator;
    }
}