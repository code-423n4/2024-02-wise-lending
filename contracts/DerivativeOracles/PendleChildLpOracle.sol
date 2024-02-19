// SPDX-License-Identifier: -- WISE --

import "./CustomOracleSetup.sol";

import "../InterfaceHub/IPendle.sol";
import "../InterfaceHub/IPriceFeed.sol";

pragma solidity =0.8.24;

// Notice: only to use this for PendleMarkets that has 18 decimals
// if different amount of decimals - pass as argument to constructor

contract PendleChildLpOracle is CustomOracleSetup  {

    IPriceFeed public priceFeedPendleLpOracle;
    IPendleChildToken public pendleChildToken;

    uint8 constant DECIMALS_PRECISION = 18;
    uint256 private constant PRECISION_FACTOR_E18 = 1E18;

    constructor(
        address _pendleLpOracle,
        address _pendleChild
    )
        CustomOracleSetup()
    {
        priceFeedPendleLpOracle = IPriceFeed(
            _pendleLpOracle
        );
        pendleChildToken = IPendleChildToken(
            _pendleChild
        );
    }

    function latestAnswer()
        public
        view
        returns (uint256)
    {
        return priceFeedPendleLpOracle.latestAnswer()
            * pendleChildToken.totalLpAssets()
            * PRECISION_FACTOR_E18
            / pendleChildToken.totalSupply()
            / PRECISION_FACTOR_E18;
    }

    function decimals()
        external
        pure
        returns (uint8)
    {
        return DECIMALS_PRECISION;
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
            int256(latestAnswer()),
            startedAt,
            updatedAt,
            answerdInRound
        );
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
            int256(latestAnswer()),
            startedAt,
            updatedAt,
            answeredInRound
        );
    }
}
