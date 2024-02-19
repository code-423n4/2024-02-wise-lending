// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/// @title The interface for the Uniswap V3 Factory
/// @notice The Uniswap V3 Factory facilitates creation of Uniswap V3 pools and control over the protocol fees
interface IUniswapV3Factory {

    /// @notice Returns the pool address for a given pair of tokens and a fee, or address 0 if it does not exist
    /// @dev _tokenA and tokenB may be passed in either token0/token1 or token1/token0 order
    /// @param _tokenA The contract address of either token0 or token1
    /// @param _tokenB The contract address of the other token
    /// @param _fee The fee collected upon every swap in the pool, denominated in hundredths of a bip
    /// @return pool The pool address
    function getPool(
        address _tokenA,
        address _tokenB,
        uint24 _fee
    )
        external
        view
        returns (address pool);
}
