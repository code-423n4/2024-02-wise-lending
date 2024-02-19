// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IWiseLiquidation {

    function coreLiquidationIsolationPools(
        uint256 _nftId,
        uint256 _nftIdLiquidator,
        address _caller,
        address _tokenToPayback,
        address _tokenToRecieve,
        uint256 _paybackAmount,
        uint256 _shareAmountToPay
    )
        external
        returns (uint256 reveiveAmount);

    function liquidatePartiallyFromTokens(
        uint256 _nftId,
        uint256 _nftIdLiquidator,
        address _tokenToPayback,
        address _tokenToRecieve,
        uint256 _shareAmountToPay
    )
        external;
}
