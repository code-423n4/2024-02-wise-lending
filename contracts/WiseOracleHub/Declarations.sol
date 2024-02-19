// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../InterfaceHub/IERC20.sol";
import "../InterfaceHub/IPriceFeed.sol";
import "../InterfaceHub/IAggregator.sol";

import "./Libraries/IUniswapV3Factory.sol";
import "./Libraries/OracleLibrary.sol";

import "../OwnableMaster.sol";

error OracleIsDead();
error OraclesDeviate();
error OracleAlreadySet();
error ChainLinkOracleNotSet();

error SampleTooSmall(
    uint256 size
);

error HeartBeatNotSet();
error PoolDoesNotExist();
error PoolAddressMismatch();
error TokenAddressMismatch();
error TwapOracleAlreadySet();
error ZeroAddressNotAllowed();
error FunctionDoesntExist();
error AggregatorNotNecessary();
error AggregatorAlreadySet();

abstract contract Declarations is OwnableMaster {

    struct UniTwapPoolInfo {
        bool isUniPool;
        address oracle;
    }

    struct DerivativePartnerInfo {
        address partnerTokenAddress;
        address partnerOracleAddress;
    }

    constructor(
        address _wethAddress,
        address _ethPriceFeed,
        address _uniswapV3Factory
    )
        OwnableMaster(
            msg.sender
        )
    {
        WETH_ADDRESS = _wethAddress;

        _decimalsWETH = IERC20(
            WETH_ADDRESS
        ).decimals();

        ETH_PRICE_FEED = IPriceFeed(
            _ethPriceFeed
        );

        UNI_V3_FACTORY = IUniswapV3Factory(
            _uniswapV3Factory
        );

        SEQUENCER = IPriceFeed(
            SEQUENCER_ADDRESS
        );

        IS_ARBITRUM_CHAIN = block.chainid == ARBITRUM_CHAIN_ID;
    }

    // Address of WETH token on Mainnet
    address public immutable WETH_ADDRESS;

    // Sequencer address on Arbitrum
    address public constant SEQUENCER_ADDRESS = 0xFdB631F5EE196F0ed6FAa767959853A9F217697D;

    // EthUsd PlaceHolder address
    address public immutable ETH_USD_PLACEHOLDER;

    // Target Decimals of the returned WETH values.
    uint8 internal immutable _decimalsWETH;

    // ChainLink ETH price feed ETH to USD value.
    IPriceFeed public immutable ETH_PRICE_FEED;

    // Chainlink sequencer interface for L2 communication
    IPriceFeed public immutable SEQUENCER;

    // Uniswap Factory interface
    IUniswapV3Factory public immutable UNI_V3_FACTORY;

    // Target Decimals of the returned USD values.
    uint8 internal constant _decimalsUSD = 8;

    // Target Decimals of the returned ETH values.
    uint8 internal constant _decimalsETH = 18;

    // Number of last rounds which are checked for heartbeat.
    uint80 internal constant MAX_ROUND_COUNT = 50;

    // Define the number of seconds in a minute.
    uint32 internal constant SECONDS_IN_MINUTE = 60;

    // Define TWAP period in seconds.
    uint32 internal constant TWAP_PERIOD = 30 * SECONDS_IN_MINUTE;

    // Allowed difference between oracle values.
    uint256 internal ALLOWED_DIFFERENCE = 10250;

    // Minimum iteration count for median calculation.
    uint256 internal constant MIN_ITERATION_COUNT = 3;

    // Precision factor for ETH values.
    uint256 internal constant PRECISION_FACTOR_E4 = 1E4;

    // Time period to wait when sequencer is active again.
    uint256 internal constant GRACE_PEROID = 3600;

    // Value address used for empty feed comparison.
    IPriceFeed internal constant ZERO_FEED = IPriceFeed(
        address(0x0)
    );

    // Value address used for empty aggregator comparison.
    IAggregator internal constant ZERO_AGGREGATOR = IAggregator(
        address(0x0)
    );

    bool internal immutable IS_ARBITRUM_CHAIN;
    uint256 internal constant ARBITRUM_CHAIN_ID = 42161;

    // -- Mapping values --

    // Stores decimals of specific ERC20 token.
    mapping(address => uint8) _tokenDecimals;

    // Stores the price feed address from oracle sources.
    mapping(address => IPriceFeed) public priceFeed;

    // Stores the time between chainLink heartbeats.
    mapping(address => uint256) public heartBeat;

    // Stores the aggregator of a specific token.
    mapping(address => IAggregator) public tokenAggregatorFromTokenAddress;

    // Mapping underlying feed token for multi token derivate oracle.
    mapping(address => address[]) public underlyingFeedTokens;

    // Stores the uniswap twap pool or derivative info.
    mapping(address => UniTwapPoolInfo) public uniTwapPoolInfo;

    // Stores the derivative partner address of the TWAP.
    mapping(address => DerivativePartnerInfo) public derivativePartnerTwap;
}
