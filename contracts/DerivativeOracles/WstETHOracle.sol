// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author Christoph Krpoun
 */

/**
 * @dev Pricefeed contract for WstETH token.
 * Takes chainLink oracle value and multiplies it
 * with the corresponding stETH amount of 1E18 WstETH.
 * Can be deployed on any chain with WstETH contract
 * and chainLink pricefeed for stETH -> ETH.
 */

import "../InterfaceHub/IWstETH.sol";
import "../InterfaceHub/IPriceFeed.sol";

contract WstETHOracle {

    constructor(
        IWstETH _IWstETH,
        IPriceFeed _IPriceFeed
    )
    {
        WST_ETH = _IWstETH;
        ST_ETH_FEED = _IPriceFeed;

        decimalsWstETH = WST_ETH.decimals();
        decimalsPriceStETH = ST_ETH_FEED.decimals();

        decimalsDifference = decimalsWstETH - _decimals;
    }

    // ---- Interfaces ----

    // WstETH interface
    IWstETH immutable public WST_ETH;

    // Pricefeed for stETH in ETH
    IPriceFeed immutable public ST_ETH_FEED;

    // -- Immutable values --
    uint8 immutable public decimalsWstETH;
    uint8 immutable public decimalsPriceStETH;
    uint8 immutable public decimalsDifference;

    // -- Constant values --

    // Default decimals
    uint8 internal constant _decimals = 18;

    // Precision factor for computations.
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;

    /**
     * @dev Read function returning latest ETH value for WstETH.
     * Uses answer from stETH chainLink pricefeed and combines it with
     * the result from {getStETHByWstETH} for one token of WstETH.
     */
    function latestAnswer()
        public
        view
        returns (uint256)
    {
        uint256 stETHPerWstETH = WST_ETH.getStETHByWstETH(
            PRECISION_FACTOR_E18
        );

        (
            ,
            int256 answer,
            ,
            ,

        ) = ST_ETH_FEED.latestRoundData();

        return stETHPerWstETH
            * uint256(answer)
            / 10 ** decimalsPriceStETH
            / 10 ** decimalsDifference;
    }

    /**
     * @dev Returns priceFeed decimals.
     */
    function decimals()
        external
        pure
        returns (uint8)
    {
        return _decimals;
    }

    /**
     * @dev Read function returning the round data from
     * stETH. Needed for calibrating the priceFeed in
     * the oracleHub. (see WISE oracleHub and heartbeat)
     */
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

        ) = ST_ETH_FEED.getRoundData(
            _roundId
        );
    }

    /**
     * @dev Read function returning the latest round data
     * from stETH plus the latest ETH value for WstETH.
     * Needed for calibrating the pricefeed in
     * the oracleHub. (see WISE oracleHub and heartbeat)
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

        ) = ST_ETH_FEED.latestRoundData();
    }
}
