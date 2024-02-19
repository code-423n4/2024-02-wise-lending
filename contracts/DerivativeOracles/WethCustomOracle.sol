// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./CustomOracleSetup.sol";

contract WethCustomOracle is CustomOracleSetup {

    uint256 ethValuePerToken;
    uint8 immutable DECIMALS_ETH_VALUE;

    constructor(
        uint256 _ethValue,
        uint8 _decimals
    )
        CustomOracleSetup()
    {
        ethValuePerToken = _ethValue;
        DECIMALS_ETH_VALUE = _decimals;

        master = msg.sender;
    }

    function latestAnswer()
        external
        view
        returns (uint256)
    {
        return ethValuePerToken;
    }

    function decimals()
        external
        view
        returns (uint8)
    {
        return DECIMALS_ETH_VALUE;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answerdInRound
        )
    {
        roundId = globalRoundId;
        updatedAt = lastUpdateGlobal;

        return (
            roundId,
            int256(ethValuePerToken),
            startedAt,
            updatedAt,
            answerdInRound
        );
    }

    function setValue(
        uint256 _ethValue
    )
        external
        onlyOwner
    {
        ethValuePerToken = _ethValue;
    }

    function getRoundData(
        uint80 _roundId
    )
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        updatedAt = timeStampByRoundId[
            _roundId
        ];

        return (
            _roundId,
            int256(ethValuePerToken),
            startedAt,
            updatedAt,
            answeredInRound
        );
    }
}
