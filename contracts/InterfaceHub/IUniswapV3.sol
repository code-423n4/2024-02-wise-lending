// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IUniswapV3SwapCallback {

    function uniswapV3SwapCallback(
        int256 _amount0Delta,
        int256 _amount1Delta,
        bytes calldata _data
    )
        external;
}

interface IUniswapV3 is IUniswapV3SwapCallback {

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata _params
    )
        external
        payable
        returns (uint256 amountOut);

    function exactOutputSingle(
        ExactOutputSingleParams calldata _params
    )
        external
        payable
        returns (uint256 amountIn);
}
