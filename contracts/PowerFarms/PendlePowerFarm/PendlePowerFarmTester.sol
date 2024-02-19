// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./PendlePowerManager.sol";

contract PendlePowerFarmTester is PendlePowerManager {

    constructor(
        address _wiseLendingAddress,
        address _pendleChilTokenAddress,
        address _pendleRouter,
        address _entryAsset,
        address _pendleSy,
        address _underlyingMarket,
        address _routerStatic,
        address _dexAddress,
        uint256 _collateralFactor,
        address _powerFarmNFTs
    )
        PendlePowerManager(
            _wiseLendingAddress,
            _pendleChilTokenAddress,
            _pendleRouter,
            _entryAsset,
            _pendleSy,
            _underlyingMarket,
            _routerStatic,
            _dexAddress,
            _collateralFactor,
            _powerFarmNFTs
        )
    {}

    function setCollfactor(
        uint256 _newCollfactor
    )
        external
    {
        collateralFactor = _newCollfactor;
    }
}
