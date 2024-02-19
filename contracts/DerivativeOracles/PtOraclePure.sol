// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author René Hochmuth
 */

/**
 * @dev PriceFeed contract for Pt-Token with USD
 * chainLink feed to get a feed measured in ETH.
 * Takes chainLink oracle value and multiplies it
 * with the corresponding TWAP and other chainLink oracles.
 */

import "../InterfaceHub/IPriceFeed.sol";
import "../InterfaceHub/IOraclePendle.sol";

error CardinalityNotSatisfied();
error OldestObservationNotSatisfied();

contract PtOraclePure {

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
        POW_FEED = 10 ** FEED_ASSET.decimals();

        DURATION = _twapDuration;
        ORACLE_PENDLE_PT = _oraclePendlePt;

        name = _oracleName;
    }

    // Token interface
    address public immutable PENDLE_MARKET_ADDRESS;

    // Pricefeed for asset in ETH and TWAP for PtToken.
    IPriceFeed public immutable FEED_ASSET;
    IOraclePendle public immutable ORACLE_PENDLE_PT;

    uint256 internal immutable POW_FEED;
    uint8 internal constant FEED_DECIMALS = 18;

    // Precision factor for computations.
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;

    // -- Twap Duration --
    uint32 public immutable DURATION;

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
            DURATION
        );

        if (increaseCardinalityRequired == true) {
            revert CardinalityNotSatisfied();
        }

        if (oldestObservationSatisfied == false) {
            revert OldestObservationNotSatisfied();
        }

        uint256 ptToAssetRate = ORACLE_PENDLE_PT.getPtToAssetRate(
            PENDLE_MARKET_ADDRESS,
            DURATION
        );

        return uint256(answerFeed)
            * PRECISION_FACTOR_E18
            / POW_FEED
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
     * @dev Read function returning the latest answer
     * so wise oracle hub can fetch it
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
