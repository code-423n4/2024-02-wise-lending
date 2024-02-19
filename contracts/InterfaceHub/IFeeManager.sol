// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IFeeManager {

    function underlyingToken(
        address _poolToken
    )
        external
        view
        returns (address);

    function isAaveToken(
        address _poolToken
    )
        external
        view
        returns (bool);

    function setBadDebtUserLiquidation(
        uint256 _nftId,
        uint256 _amount
    )
        external;

    function increaseTotalBadDebtLiquidation(
        uint256 _amount
    )
        external;

    function FEE_MANAGER_NFT()
        external
        view
        returns (uint256);

    function addPoolTokenAddress(
        address _poolToken
    )
        external;

    function getPoolTokenAdressesByIndex(
        uint256 _index
    )
        external
        view
        returns (address);

    function getPoolTokenAddressesLength()
        external
        view
        returns (uint256);
}