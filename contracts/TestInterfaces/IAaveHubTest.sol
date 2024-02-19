// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IAaveHubTest {

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

    function setAaveTokenAddress(
        address _underlyingAsset,
        address _aToken
    )
        external;

    function depositExactAmountETHMint()
        external
        payable
        returns (uint256);
}

