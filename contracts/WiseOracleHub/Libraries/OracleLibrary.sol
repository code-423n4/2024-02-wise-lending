// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./FullMath.sol";
import "./TickMath.sol";
import "./IUniswapV3Pool.sol";

/// @title Oracle library
/// @notice Provides functions to integrate with V3 pool oracle
library OracleLibrary {

    /// @notice Given a tick and a token amount, calculates the amount of token received in exchange
    /// @param _tick Tick value used to calculate the quote
    /// @param _baseAmount Amount of token to be converted
    /// @param _baseToken Address of an ERC20 token contract used as the baseAmount denomination
    /// @param _quoteToken Address of an ERC20 token contract used as the quoteAmount denomination
    /// @return quoteAmount Amount of quoteToken received for baseAmount of baseToken
    function getQuoteAtTick(
        int24 _tick,
        uint128 _baseAmount,
        address _baseToken,
        address _quoteToken
    )
        internal
        pure
        returns (uint256 quoteAmount)
    {
        uint160 sqrtRatioX96 = TickMath.getSqrtRatioAtTick(
            _tick
        );

        // Calculate quoteAmount with better precision
        // if it doesn't overflow when multiplied by itself

        if (sqrtRatioX96 <= type(uint128).max) {

            uint256 ratioX192 = uint256(sqrtRatioX96)
                * sqrtRatioX96;

            quoteAmount = _baseToken < _quoteToken
                ? FullMath.mulDiv(
                    ratioX192,
                    _baseAmount,
                    1 << 192
                )
                : FullMath.mulDiv(
                    1 << 192,
                    _baseAmount,
                    ratioX192
                );

            return quoteAmount;
        }

        uint256 ratioX128 = FullMath.mulDiv(
            sqrtRatioX96,
            sqrtRatioX96,
            1 << 64
        );

        quoteAmount = _baseToken < _quoteToken
            ? FullMath.mulDiv(
                ratioX128,
                _baseAmount,
                1 << 128
            )
            : FullMath.mulDiv(
                1 << 128,
                _baseAmount,
                ratioX128
            );

        return quoteAmount;
    }
}
