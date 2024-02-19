// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IWiseOracleHub {

    function getTokensPriceFromUSD(
        address _tokenAddress,
        uint256 _usdValue
    )
        external
        view
        returns (uint256);

    function getTokensPriceInUSD(
        address _tokenAddress,
        uint256 _tokenAmount
    )
        external
        view
        returns (uint256);

    function latestResolver(
        address _tokenAddress
    )
        external
        view
        returns (uint256);

    function getTokensFromUSD(
        address _tokenAddress,
        uint256 _usdValue
    )
        external
        view
        returns (uint256);

    function getTokensFromETH(
        address _tokenAddress,
        uint256 _ethValue
    )
        external
        view
        returns (uint256);

    function getTokensInUSD(
        address _tokenAddress,
        uint256 _amount
    )
        external
        view
        returns (uint256);

    function getTokensInETH(
        address _tokenAddress,
        uint256 _tokenAmount
    )
        external
        view
        returns (uint256);

    function chainLinkIsDead(
        address _tokenAddress
    )
        external
        view
        returns (bool);

    function decimalsUSD()
        external
        pure
        returns (uint8);

    function addOracle(
        address _tokenAddress,
        address _priceFeedAddress,
        address[] calldata _underlyingFeedTokens
    )
        external;

    function recalibrate(
        address _tokenAddress
    )
        external;

    function WETH_ADDRESS()
        external
        view
        returns (address);

    function priceFeed(
        address _tokenAddress
    )
        external
        view
        returns (address);
}
