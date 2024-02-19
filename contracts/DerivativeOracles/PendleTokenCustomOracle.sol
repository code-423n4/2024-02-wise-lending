// SPDX-License-Identifier: -- WISE --

import "./CustomOracleSetup.sol";

import "./../InterfaceHub/IERC20.sol";
import "./../WiseOracleHub/Libraries/OracleLibrary.sol";
import "./../WiseOracleHub/Libraries/IUniswapV3Factory.sol";

pragma solidity =0.8.24;

error InvalidPool();
error InvalidTokens();
error NoWethDetected();

contract PendleTokenCustomOracle is CustomOracleSetup {

    IUniswapV3Factory public immutable UNI_V3_FACTORY;

    uint256 public immutable globalAmountIn;

    address public immutable uniPool;
    address public immutable targetToken;

    address public immutable token0;
    address public immutable token1;

    uint8 immutable DECIMALS_PRECISION = 18;

    constructor(
        address _pendleToken,
        address _uniPool,
        address _token0,
        address _token1,
        address _weth,
        address _uniFactory,
        uint24 _fee,
        uint8 _decimals
    )
        CustomOracleSetup()
    {
        targetToken = _pendleToken;
        DECIMALS_PRECISION = _decimals;
        uniPool = _uniPool;
        globalAmountIn = 10 ** IERC20(targetToken).decimals();
        token0 = _token0;
        token1 = _token1;

        if (_token1 != _pendleToken && _token0 != _pendleToken) {
            revert InvalidTokens();
        }

        if (_token1 != _weth && _token0 != _weth) {
            revert NoWethDetected();
        }

        UNI_V3_FACTORY = IUniswapV3Factory(
            _uniFactory
        );

        address pool = _getPool(
            _token0,
            _token1,
            _fee
        );

        if (pool != _uniPool) {
            revert InvalidPool();
        }
    }

    /**
    * @dev Retrieves the pool address for given
    * tokens and fee from Uniswap V3 Factory.
    */
    function _getPool(
        address _token0,
        address _token1,
        uint24 _fee
    )
        internal
        view
        returns (address pool)
    {
        return UNI_V3_FACTORY.getPool(
            _token0,
            _token1,
            _fee
        );
    }

    function latestAnswer()
        public
        view
        returns (uint256 amountOutForOneTokenIn)
    {
        (
            ,
            int24 tick
            ,
            ,
            ,
            ,
            ,
        ) = IUniswapV3Pool(uniPool).slot0();

        address tokenIn = targetToken;
        uint128 amountIn = uint128(
            globalAmountIn
        );

        address tokenOut = targetToken == token1
            ? token0
            : token1;

        amountOutForOneTokenIn = OracleLibrary.getQuoteAtTick(
            tick,
            amountIn,
            tokenIn,
            tokenOut
        );
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
