// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IWiseTokenGov {

    function checkStakeByID(
        address _staker,
        bytes16 _stakeID
    )
        external
        view
        returns (
            uint256 startDay,
            uint256 lockDays,
            uint256 finalDay,
            uint256 closeDay,
            uint256 scrapeDay,
            uint256 stakedAmount,
            uint256 stakesShares,
            uint256 rewardAmount,
            uint256 penaltyAmount,
            bool isActive,
            bool isMature
        );

    function currentWiseDay()
        external
        view
        returns (uint64);
}

interface IWiseInsuranceGov {

    function insuranceStakes(
        address _staker,
        uint256 _index
    )
        external
        view
        returns (
            bytes16,
            uint256,
            uint256,
            uint256,
            uint256,
            address,
            bool
        );
}