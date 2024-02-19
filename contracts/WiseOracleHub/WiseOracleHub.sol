// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author René Hochmuth
 * @author Christoph Krpoun
 * @author Vitally Marinchenko
 */

import "./OracleHelper.sol";

/**
 * @dev WiseOracleHub is an onchain extension for price feeds (chainLink or others).
 * The master address is owned by a timelock contract which itself is secured by a
 * multisig. Only the master can add new price feed <-> address pairs to the contract.
 *
 * One advantage is the linking of price feeds to their underlying token address.
 * Therefore, users can get the current ETH value of a token by just knowing the token
 * address when calling {latestResolver}. It takes the answer from {latestRoundData}
 * for chainLink oracles as recommended from chainLink.
 *
 * NOTE: If you want to propose adding an own developed price feed it is
 * mandatory to wrap its answer into a function mimicking {latestRoundData}
 * (See {latestResolver} implementation).
 *
 * Additionally, the oracleHub provides so called heartbeat checks if a token gets
 * still updated in expected time interval.
 */

contract WiseOracleHub is OracleHelper {

    constructor(
        address _wethAddrss,
        address _ethPricingFeed,
        address _uniswapFactoryV3
    )
        Declarations(
            _wethAddrss,
            _ethPricingFeed,
            _uniswapFactoryV3
        )
    {
        ETH_USD_PLACEHOLDER = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            "ETH_USD_PLACEHOLDER"
                        )
                    )
                )
            )
        );

        priceFeed[ETH_USD_PLACEHOLDER] = ETH_PRICE_FEED;
        _tokenDecimals[ETH_USD_PLACEHOLDER] = _decimalsETH;
        underlyingFeedTokens[ETH_USD_PLACEHOLDER] = new address[](0);

        heartBeat[ETH_USD_PLACEHOLDER] = _recalibratePreview(
            ETH_USD_PLACEHOLDER
        );
    }

    /**
     * @dev Returns priceFeed latest ETH value
     * by passing the underlying token address.
     */
    function latestResolver(
        address _tokenAddress
    )
        public
        view
        returns (uint256)
    {
        if (chainLinkIsDead(_tokenAddress) == true) {
            revert OracleIsDead();
        }

        return _validateAnswer(
            _tokenAddress
        );
    }

    function getTokenDecimals(
        address _tokenAddress
    )
        external
        view
        returns (uint8)
    {
        return _tokenDecimals[_tokenAddress];
    }

    // @TODO: Delete later, keep for backward compatibility
    function getTokensInUSD(
        address _tokenAddress,
        uint256 _tokenAmount
    )
        external
        view
        returns (uint256)
    {
        uint8 tokenDecimals = _tokenDecimals[
            _tokenAddress
        ];

        return _decimalsETH < tokenDecimals
            ? _tokenAmount
                * latestResolver(_tokenAddress)
                / 10 ** decimals(_tokenAddress)
                / 10 ** (tokenDecimals - _decimalsETH)
            : _tokenAmount
                * 10 ** (_decimalsETH - tokenDecimals)
                * latestResolver(_tokenAddress)
                / 10 ** decimals(_tokenAddress);
    }

    /**
     * @dev Returns USD value of a given token
     * amount in order of 1E18 decimal precision.
     */
    function getTokensPriceInUSD(
        address _tokenAddress,
        uint256 _tokenAmount
    )
        external
        view
        returns (uint256)
    {
        return getTokensInETH(
            _tokenAddress,
            _tokenAmount
        )
            * getETHPriceInUSD()
            / 10 ** _decimalsUSD;
    }

    /**
     * @dev Returns ETH value of a given token
     * amount in order of 1E18 decimal precision.
     */
    function getTokensInETH(
        address _tokenAddress,
        uint256 _tokenAmount
    )
        public
        view
        returns (uint256)
    {
        if (_tokenAddress == WETH_ADDRESS) {
            return _tokenAmount;
        }

        uint8 tokenDecimals = _tokenDecimals[
            _tokenAddress
        ];

        return _decimalsETH < tokenDecimals
            ? _tokenAmount
                * latestResolver(_tokenAddress)
                / 10 ** decimals(_tokenAddress)
                / 10 ** (tokenDecimals - _decimalsETH)
            : _tokenAmount
                * 10 ** (_decimalsETH - tokenDecimals)
                * latestResolver(_tokenAddress)
                / 10 ** decimals(_tokenAddress);
    }

    // @TODO: Delete later, keep for backward compatibility
    function getTokensFromUSD(
        address _tokenAddress,
        uint256 _usdValue
    )
        external
        view
        returns (uint256)
    {
        uint8 tokenDecimals = _tokenDecimals[
            _tokenAddress
        ];

        return _decimalsETH < tokenDecimals
            ? _usdValue
                * 10 ** (tokenDecimals - _decimalsETH)
                * 10 ** decimals(_tokenAddress)
                / latestResolver(_tokenAddress)
            : _usdValue
                * 10 ** decimals(_tokenAddress)
                / latestResolver(_tokenAddress)
                / 10 ** (_decimalsETH - tokenDecimals);
    }

    /**
     * @dev Converts USD value of a token into token amount with a
     * current price. The order of the argument _usdValue is 1E18.
     */
    function getTokensPriceFromUSD(
        address _tokenAddress,
        uint256 _usdValue
    )
        external
        view
        returns (uint256)
    {
        return getTokensFromETH(
            _tokenAddress,
            _usdValue
                * 10 ** _decimalsUSD
                / getETHPriceInUSD()
        );
    }

    /**
     * @dev Adds a new token address to the oracleHub Twap.
     * Can't overwrite existing mappings.
     */
    function addTwapOracle(
        address _tokenAddress,
        address _uniPoolAddress,
        address _token0,
        address _token1,
        uint24 _fee
    )
        external
        onlyMaster
    {
        address pool = _getPool(
            _token0,
            _token1,
            _fee
        );

        _validateTokenAddress(
            _tokenAddress,
            _token0,
            _token1
        );

        _validateTwapOracle(
            _tokenAddress
        );

        _validatePoolAddress(
            pool,
            _uniPoolAddress
        );

        _validatePriceFeed(
            _tokenAddress
        );

        _writeUniTwapPoolInfoStruct(
            {
                _tokenAddress: _tokenAddress,
                _oracle: pool,
                _isUniPool: true
            }
        );
    }

    /**
     * @dev Adds a new token address to TWAP as derivative.
     * Not permitted to overwrite existing mappings.
     */
    function addTwapOracleDerivative(
        address _tokenAddress,
        address _partnerTokenAddress,
        address[2] calldata _uniPools,
        address[2] calldata _token0Array,
        address[2] calldata _token1Array,
        uint24[2] calldata _feeArray
    )
        external
        onlyMaster
    {
        _validatePriceFeed(
            _tokenAddress
        );

        _validateTwapOracle(
            _tokenAddress
        );

        _validateTokenAddress(
            _tokenAddress,
            _token0Array[1],
            _token1Array[1]
        );

        uint256 i;
        address pool;
        uint256 length = _uniPools.length;

        while (i < length) {
            pool = _getPool(
                _token0Array[i],
                _token1Array[i],
                _feeArray[i]
            );

            _validatePoolAddress(
                pool,
                _uniPools[i]
            );

            unchecked {
                ++i;
            }
        }

        _writeUniTwapPoolInfoStructDerivative(
            {
                _tokenAddress: _tokenAddress,
                _partnerTokenAddress: _partnerTokenAddress,
                _oracleAddress: _uniPools[0],
                _partnerOracleAddress: _uniPools[1],
                _isUniPool: false
            }
        );
    }

    /**
     * @dev Converts ETH value of a token into token amount with a
     * current price. The order of the argument _ethAmount is 1E18.
     */
    function getTokensFromETH(
        address _tokenAddress,
        uint256 _ethAmount
    )
        public
        view
        returns (uint256)
    {
        if (_tokenAddress == WETH_ADDRESS) {
            return _ethAmount;
        }

        uint8 tokenDecimals = _tokenDecimals[
            _tokenAddress
        ];

        return _decimalsETH < tokenDecimals
            ? _ethAmount
                * 10 ** (tokenDecimals - _decimalsETH)
                * 10 ** decimals(_tokenAddress)
                / latestResolver(_tokenAddress)
            : _ethAmount
                * 10 ** decimals(_tokenAddress)
                / latestResolver(_tokenAddress)
                / 10 ** (_decimalsETH - tokenDecimals);
    }

    /**
     * @dev Adds priceFeed for a token.
     * Can't overwrite existing mappings.
     * Master is a timelock contract.
     */
    function addOracle(
        address _tokenAddress,
        IPriceFeed _priceFeedAddress,
        address[] calldata _underlyingFeedTokens
    )
        external
        onlyMaster
    {
        _addOracle(
            _tokenAddress,
            _priceFeedAddress,
            _underlyingFeedTokens
        );
    }

    /**
     * @dev Adds priceFeeds for tokens.
     * Can't overwrite existing mappings.
     * Master is a timelock contract.
     */
    function addOracleBulk(
        address[] calldata _tokenAddresses,
        IPriceFeed[] calldata _priceFeedAddresses,
        address[][] calldata _underlyingFeedTokens
    )
        external
        onlyMaster
    {
        uint256 i;
        uint256 l = _tokenAddresses.length;

        while (i < l) {
            _addOracle(
                _tokenAddresses[i],
                _priceFeedAddresses[i],
                _underlyingFeedTokens[i]
            );

            unchecked {
                ++i;
            }
        }
    }

    function addAggregator(
        address _tokenAddress
    )
        external
        onlyMaster
    {
        _addAggregator(
            _tokenAddress
        );
    }

    /**
     * @dev Looks at the maximal last 50 rounds and
     * takes second highest value to avoid counting
     * offline time of chainlink as valid heartbeat.
     */
    function recalibratePreview(
        address _tokenAddress
    )
        external
        view
        returns (uint256)
    {
        return _recalibratePreview(
            _tokenAddress
        );
    }

    /**
     * @dev Check if chainLink feed was
     * updated within expected timeFrame.
     * If length of {underlyingFeedTokens}
     * is greater than zero it checks the
     * heartbeat of all base feeds of the
     * derivate oracle.
     */
    function chainLinkIsDead(
        address _tokenAddress
    )
        public
        view
        returns (bool state)
    {
        uint256 i;
        uint256 length = underlyingFeedTokens[
            _tokenAddress
        ].length;

        if (sequencerIsDead() == true) {
            return true;
        }

        if (length == 0) {
            return _chainLinkIsDead(
                _tokenAddress
            );
        }

        while (i < length) {

            state = _chainLinkIsDead(
                underlyingFeedTokens[_tokenAddress][i]
            );

            _validateAnswer(
                underlyingFeedTokens[_tokenAddress][i]
            );

            unchecked {
                ++i;
            }

            if (state == true) {
                break;
            }
        }

        return state;
    }

    /**
     * @dev Recalibrates expected
     * heartbeat for a pricing feed.
     */
    function recalibrate(
        address _tokenAddress
    )
        external
    {
        _recalibrate(
            _tokenAddress
        );
    }

    /**
     * @dev Bulk function to recalibrate
     * the heartbeat for several tokens.
     */
    function recalibrateBulk(
        address[] calldata _tokenAddresses
    )
        external
    {
        uint256 i;
        uint256 l = _tokenAddresses.length;

        while (i < l) {
            _recalibrate(
                _tokenAddresses[i]
            );

            unchecked {
                ++i;
            }
        }
    }
}
