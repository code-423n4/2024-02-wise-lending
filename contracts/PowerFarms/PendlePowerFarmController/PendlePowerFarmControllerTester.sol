// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./PendlePowerFarmController.sol";

contract PendleControllerTester is PendlePowerFarmController {

    constructor(
        address _vePendle,
        address _pendleToken,
        address _voterContract,
        address _voterRewardsClaimerAddress,
        address _wiseOracleHub
    )
        PendlePowerFarmController(
            _vePendle,
            _pendleToken,
            _voterContract,
            _voterRewardsClaimerAddress,
            _wiseOracleHub
        )
    {}

    function changeRewardTokenData(
        address _pendleMarket,
        address[] calldata _rewardTokenArray
    )
        external
    {
        CompoundStruct memory data = pendleChildCompoundInfo[
            _pendleMarket
        ];

        data.rewardTokens = _rewardTokenArray;
        pendleChildCompoundInfo[_pendleMarket] = data;
    }
}