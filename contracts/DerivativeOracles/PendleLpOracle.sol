// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author René Hochmuth
 */

/**
 * @dev PriceFeed contract for Lp-Token with USD
 * chainLink feed to get a feed measured in ETH.
 * Takes chainLink oracle value and multiplies it
 * with the corresponding TWAP and other chainLink oracles.
 */

import "../InterfaceHub/IPendle.sol";
import "../InterfaceHub/IPriceFeed.sol";
import "../InterfaceHub/IOraclePendle.sol";
import {
    PendleLpOracleLib,
    IPMarket
} from "@pendle/core-v2/contracts/oracles/PendleLpOracleLib.sol";

error InvalidDecimals();
error CardinalityNotSatisfied();
error OldestObservationNotSatisfied();

contract PendleLpOracle {

    uint256 internal constant DEFAULT_DECIMALS = 18;

    constructor(
        address _pendleMarketAddress,
        IPriceFeed _priceFeedChainLinkEth,
        IOraclePendle _oraclePendlePt,
        string memory _oracleName,
        uint32 _twapDuration
    )
    {
        PENDLE_MARKET_ADDRESS = _pendleMarketAddress;

        FEED_ASSET = _priceFeedChainLinkEth;

        if (FEED_ASSET.decimals() != DEFAULT_DECIMALS) {
            revert InvalidDecimals();
        }

        TWAP_DURATION = _twapDuration;
        ORACLE_PENDLE_PT = _oraclePendlePt;

        PENDLE_MARKET = IPendleMarket(
            _pendleMarketAddress
        );

        name = _oracleName;
    }

    address public immutable PENDLE_MARKET_ADDRESS;
    IPendleMarket public immutable PENDLE_MARKET;

    // Pricefeed for asset in ETH and TWAP for PtToken.
    IPendleSy public immutable PENDLE_SY;
    IPriceFeed public immutable FEED_ASSET;
    IOraclePendle public immutable ORACLE_PENDLE_PT;

    uint8 internal constant FEED_DECIMALS = 18;
    uint256 internal constant POW_FEED_DECIMALS = 10 ** 18;

    // Precision factor for computations.
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;

    // -- Twap duration in seconds --
    uint32 public immutable TWAP_DURATION;

    // -- Farm description --
    string public name;

    /**
     * @dev Read function returning latest ETH value for PtToken.
     * Uses answer from USD chainLink pricefeed and combines it with
     * the result from ethInUsd for one token of PtToken.
     */
    function latestAnswer()
        public
        view
        returns (uint256)
    {
        (
            ,
            int256 answerFeed,
            ,
            ,
        ) = FEED_ASSET.latestRoundData();

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

        uint256 lpRate = _getLpToAssetRateWrapper(
            IPMarket(PENDLE_MARKET_ADDRESS),
            TWAP_DURATION
        );

        return lpRate
            * uint256(answerFeed)
            / PRECISION_FACTOR_E18;
    }

    function _getLpToAssetRateWrapper(
        IPMarket _market,
        uint32 _duration
    )
        internal
        view
        returns (uint256)
    {
        return PendleLpOracleLib.getLpToAssetRate(
            _market,
            _duration
        );
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
     * @dev Read function returning the latest answer
     * so wise oracle hub can fetch it
     */
    function latestRoundData()
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
        return (
            roundId,
            int256(latestAnswer()),
            startedAt,
            updatedAt,
            answeredInRound
        );
    }
}
