// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IPendlePowerFarmToken {

    function changeMintFee(
        uint256 _newFee
    )
        external;

    function manualSync()
        external;

    function addCompoundRewards(
        uint256 _amount
    )
        external;

    function withdrawExactShares(
        uint256 _shares
    )
        external
        returns (uint256);

    function totalLpAssets()
        external
        view
        returns (uint256);

    function totalSupply()
        external
        view
        returns (uint256);

    function previewUnderlyingLpAssets()
        external
        view
        returns (uint256);

    function previewMintShares(
        uint256 _underlyingAssetAmount,
        uint256 _underlyingLpAssetsCurrent
    )
        external
        view
        returns (uint256);

    function previewAmountWithdrawShares(
        uint256 _shares,
        uint256 _underlyingLpAssetsCurrent
    )
        external
        view
        returns (uint256);

    function previewBurnShares(
        uint256 _underlyingAssetAmount,
        uint256 _underlyingLpAssetsCurrent
    )
        external
        view
        returns (uint256);

    function balanceOf(
        address _account
    )
        external
        view
        returns (uint256);

    function withdrawExactAmount(
        uint256 _underlyingLpAssetAmount
    )
        external
        returns (uint256);

    function depositExactAmount(
        uint256 _underlyingLpAssetAmount
    )
        external
        returns (
            uint256,
            uint256
        );

    function underlyingLpAssetsCurrent()
        external
        view
        returns (uint256);

    function totalLpAssetsToDistribute()
        external
        view
        returns (uint256);
}
