// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

contract TesterChainlink {

    uint8 immutable DECIMALS_ETH_VALUE = 18;

    uint256 ethValuePerToken;
    uint256 lastUpdateGlobal;

    address public master;
    uint80 public globalRoundId;

    mapping(uint80 => uint256) timeStampByroundId;

    constructor(
        uint256 _ethValue,
        uint8 _decimals
    )
    {
        ethValuePerToken = _ethValue;
        DECIMALS_ETH_VALUE = _decimals;

        master = msg.sender;
    }

    function latestAnswer(
    )
        external
        view
        returns (uint256)
    {
        return ethValuePerToken;
    }

    function decimals()
        external
        pure
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

    function setLastUpdateGlobal(
        uint256 _time
    )
        public
    {
        if (master != msg.sender) {
            revert("testerChainlink: NOT_MASTER");
        }

        lastUpdateGlobal = _time;
    }

    function setValue(
        uint256 _ethValue
    )
        public
    {
        if (master != msg.sender) {
            revert("testerChainlink: NOT_MASTER");
        }

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
        updatedAt = timeStampByroundId[
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

    function setRoundData(
        uint80 _roundId,
        uint256 _updateTime
    )
        public
    {
        timeStampByroundId[_roundId] = _updateTime;
    }

    function getTimeStamp()
        external
        view
        returns (uint256)
    {
        return block.timestamp;
    }

    function setGlobalAggregatorRoundId(
        uint80 _aggregatorRoundId
    )
        public
    {
        globalRoundId = _aggregatorRoundId;
    }
}
