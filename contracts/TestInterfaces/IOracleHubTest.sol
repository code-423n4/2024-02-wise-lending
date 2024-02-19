// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../InterfaceHub/IPriceFeed.sol";

interface IOracleHubTest {

    function priceFeed(
        address _tokenAddress
    )
        external
        view
        returns (IPriceFeed);

    function getTokensFromETH(
        address _tokenAddress,
        uint256 _usdValue
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

    function getTokensInETH(
        address _tokenAddress,
        uint256 _amount
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

    function latestResolver(
        address _tokenAddress
    )
        external
        view
        returns (uint256);

    function addOracle(
        address _tokenAddress,
        IPriceFeed _priceFeedAddress,
        address[] memory _underlyingFeedTokens
    )
        external;

    function chainLinkIsDead(
        address _tokenAddress
    )
        external
        view
        returns (bool);

    function recalibrateBulk(
        address[] memory _tokenAddresses
    )
        external;

    function recalibrate(
        address _tokenAddress
    )
        external;
}