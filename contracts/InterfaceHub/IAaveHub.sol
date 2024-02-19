// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IAaveHub {

    function AAVE_ADDRESS()
        external
        view
        returns (address);

    function WETH_ADDRESS()
        external
        view
        returns (address);

    function aaveTokenAddress(
        address _underlyingToken
    )
        external
        view
        returns (address);

    function setAaveTokenAddress(
        address _underlyingToken,
        address _aaveToken
    )
        external;

    function borrowExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _borrowAmount
    )
        external
        returns (uint256);

    function paybackExactShares(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _shares
    )
        external
        returns (uint256);

    function paybackExactAmountETH(
        uint256 _nftId
    )
        external
        payable
        returns (uint256);

    function paybackExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _shares
    )
        external
        returns (uint256);

    function depositExactAmount(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _amount
    )
        external
        returns (uint256);

    function depositExactAmountETH(
        uint256 _nftId
    )
        external
        payable
        returns (uint256);

    function depositExactAmountETHMint()
        external
        payable
        returns (uint256);

    function withdrawExactShares(
        uint256 _nftId,
        address _underlyingAsset,
        uint256 _shares
    )
        external
        returns (uint256);

    function withdrawExactAmount(
        uint256 _nftId,
        address _token,
        uint256 _amount
    )
        external
        returns (uint256);

    function sendingProgressAaveHub()
        external
        view
        returns (bool);
}
