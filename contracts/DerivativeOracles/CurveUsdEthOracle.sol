// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author René Hochmuth
 */

/**
 * @dev PriceFeed contract for crvUsd token.
 * Takes chainLink oracle value of crvUsd/USD and davides it
 * with the corresponding ETH value of USD taken by chainLink.
 */

import "../InterfaceHub/IPriceFeed.sol";

contract CurveUsdEthOracle {

    constructor(
        IPriceFeed _ethUsdFeed,
        IPriceFeed _crvUsdUsdFeed
    )
    {
        ETH_USD_FEED = _ethUsdFeed;
        CRVUSD_USD_FEED = _crvUsdUsdFeed;

        POW_ETH_USD = 10 ** ETH_USD_FEED.decimals();
        POW_CRVUSD_USD = 10 ** CRVUSD_USD_FEED.decimals();
    }

    // Pricefeed for ETH in USD.
    IPriceFeed public immutable ETH_USD_FEED;

    // Pricefeed for crvUsd in USD.
    IPriceFeed public immutable CRVUSD_USD_FEED;

    // 10 ** Decimals of the feeds for EthUsd.
    uint256 internal immutable POW_ETH_USD;

    // 10 ** Decimals of the feeds for crvUsdUsd.
    uint256 internal immutable POW_CRVUSD_USD;

    // Default decimals for the feed.
    uint8 internal constant FEED_DECIMALS = 18;

    // Precision factor for computations.
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;

    /**
     * @dev Read function returning latest ETH value for crvUsd.
     * Uses answer from crvUsd/Usd chainLink priceFeed then divides it
     * and combines it with the result from ETH/USD feed.
     */
    function latestAnswer()
        public
        view
        returns (uint256)
    {
        (
            ,
            int256 answerCrvUsdUsd,
            ,
            ,
        ) = CRVUSD_USD_FEED.latestRoundData();

        (
            ,
            int256 answerEthUsd,
            ,
            ,
        ) = ETH_USD_FEED.latestRoundData();

        return uint256(answerCrvUsdUsd)
            * PRECISION_FACTOR_E18
            / POW_CRVUSD_USD
            * POW_ETH_USD
            / uint256(answerEthUsd);
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
     * @dev Read function returning the latest round data
     * from stETH plus the latest USD value for WstETH.
     * Needed for calibrating the pricefeed in the
     * OracleHub. (see WiseOracleHub and heartbeat)
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
        answer = int256(
            latestAnswer()
        );

        (
            roundId,
            ,
            startedAt,
            updatedAt,
            answeredInRound
        ) = CRVUSD_USD_FEED.latestRoundData();
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
        (
            roundId,
            answer,
            startedAt,
            updatedAt,
            answeredInRound
        ) = CRVUSD_USD_FEED.getRoundData(
            _roundId
        );
    }
}
