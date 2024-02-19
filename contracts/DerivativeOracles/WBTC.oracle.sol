// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author Christoph Krpoun
 */

/**
 * @dev Pricefeed contract for WBTC token.
 * Takes ChainLink oracle values for WBTC -> BTC
 * and BTC -> ETH on ETH mainnet and combines them.
 * Can be deployed on any chain with both
 * ChainLink price feeds.
 *
 * NOTE: No need for {phaseId} or {getRoundData}
 * implementation because no heartbeat calibration
 * inside oracleHub. Heartbeat checks work with
 * underlying heartbeats of BTC -> ETH and
 * WBTC -> BTC oracle.
 */

import "../InterfaceHub/IPriceFeed.sol";

contract WBTCOracle {

    // Pricefeed for BTC in ETH
    IPriceFeed immutable public BTC_FEED;

    // Pricefeed for WBTC in BTC
    IPriceFeed immutable public WBTC_FEED;

    // -- Immutable values --
    uint8 immutable public DECIMALS_PRICE_BTC;
    uint256 immutable public POW_DECIMALS_PRICE_BTC;

    // -- Constant values --
    uint8 constant FEED_DECIMALS = 8;

    constructor(
        IPriceFeed _IPriceFeedBTC,
        IPriceFeed _IPriceFeedWBTC
    )
    {
        BTC_FEED = _IPriceFeedBTC;
        WBTC_FEED = _IPriceFeedWBTC;

        DECIMALS_PRICE_BTC = BTC_FEED.decimals();
        POW_DECIMALS_PRICE_BTC = 10 ** DECIMALS_PRICE_BTC;
    }

    /**
     * @dev Read function returning latest ETH value for WBTC.
     * Uses answer from BTC ChainLink price feed and combines it with
     * the result from WBTC ChainLink price feed to get the ETH value of WBTC.
     */
    function latestAnswer()
        public
        view
        returns (uint256)
    {
        (
            ,
            int256 answerBTC,
            ,
            ,

        ) = BTC_FEED.latestRoundData();

        (
            ,
            int256 answerWBTC,
            ,
            ,
        ) = WBTC_FEED.latestRoundData();

        return uint256(answerBTC)
            * uint256(answerWBTC)
            / POW_DECIMALS_PRICE_BTC;
    }

    /**
     * @dev Returns priceFeed decimals.
     */
    function decimals()
        external
        pure
        returns (uint8)
    {
        return FEED_DECIMALS;
    }

    /**
     * @dev Read function mimicking the latest round data
     * for our WBTC price feed.
     * Needed for latest {latestResolver} implementation
     * of the oracleHub (Former implementation used
     * {latestAnswer}).
     */
    function latestRoundData()
        public
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            roundId,
            int256(latestAnswer()),
            startedAt,
            updatedAt,
            answeredInRound
        );
    }
}
