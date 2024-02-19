// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author René Hochmuth
 */

/**
 * @dev Pricefeed contract for PtToken with USD
 * chainLink feed to get a feed measured in ETH.
 * Takes chainLink oracle value and multiplies it with
 * the corresponding TWAP and other chainLink oracles
 */

import "../InterfaceHub/IPriceFeed.sol";
import "../InterfaceHub/IOraclePendle.sol";

error CardinalityNotSatisfied();
error OldestObservationNotSatisfied();

contract PtOracleDerivative {

    constructor(
        address _pendleMarketAddress,
        IPriceFeed _priceFeedChainLinkUsd,
        IPriceFeed _priceFeedChainLinkEthUsd,
        IOraclePendle _oraclePendlePt,
        string memory _oracleName,
        uint32 _twapDuration
    )
    {
        PENDLE_MARKET_ADDRESS = _pendleMarketAddress;

        USD_FEED_ASSET = _priceFeedChainLinkUsd;
        ETH_FEED_ASSET = _priceFeedChainLinkEthUsd;

        POW_USD_FEED = 10 ** USD_FEED_ASSET.decimals();
        POW_ETH_USD_FEED = 10 ** ETH_FEED_ASSET.decimals();

        ORACLE_PENDLE_PT = _oraclePendlePt;
        TWAP_DURATION = _twapDuration;
        name = _oracleName;
    }

    // Token interface for the asset.
    address immutable PENDLE_MARKET_ADDRESS;

    // Pricefeed for Asset in USD.
    IPriceFeed public immutable USD_FEED_ASSET;

    // Pricefeed for ETH in USD.
    IPriceFeed public immutable ETH_FEED_ASSET;

    // Oracle for Pendle PtToken.
    IOraclePendle public immutable ORACLE_PENDLE_PT;

    // 10 ** Decimals of the feeds for AssetUSD.
    uint256 public immutable POW_USD_FEED;

    // 10 ** Decimals of the feeds for EthUSD.
    uint256 public immutable POW_ETH_USD_FEED;

    // Default decimals for the Feed.
    uint8 internal constant FEED_DECIMALS = 18;

    // Precision factor for computations.
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;

    // -- Twap Duration --
    uint32 public immutable TWAP_DURATION;

    // -- Description --
    string public name;

    /**
     * @dev Read function returning latest ETH value for PtToken.
     * Uses answer from Usd chainLink pricefeed and combines it with
     * the result from ethInUsd for one token of PtToken.
     */
    function latestAnswer()
        public
        view
        returns (uint256)
    {
        (
            ,
            int256 answerUsdFeed,
            ,
            ,
        ) = USD_FEED_ASSET.latestRoundData();

        (
            ,
            int256 answerEthUsdFeed,
            ,
            ,
        ) = ETH_FEED_ASSET.latestRoundData();

        (
            bool increaseCardinalityRequired,
            ,
            bool oldestObservationSatisfied
        ) = ORACLE_PENDLE_PT.getOracleState(
            PENDLE_MARKET_ADDRESS,
            TWAP_DURATION
        );

        if (increaseCardinalityRequired == true) {
            revert CardinalityNotSatisfied();
        }

        if (oldestObservationSatisfied == false) {
            revert OldestObservationNotSatisfied();
        }

        uint256 ptToAssetRate = ORACLE_PENDLE_PT.getPtToAssetRate(
            PENDLE_MARKET_ADDRESS,
            TWAP_DURATION
        );

        return uint256(answerUsdFeed)
            * PRECISION_FACTOR_E18
            / POW_USD_FEED
            * POW_ETH_USD_FEED
            / uint256(answerEthUsdFeed)
            * ptToAssetRate
            / PRECISION_FACTOR_E18;
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
     * @dev Read function returning the latest
     * answer so WiseOracleHub can fetch it properly.
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
