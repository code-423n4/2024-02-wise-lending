// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

contract FeeManagerEvents {

    event ClaimedFeesWiseBulk(
        uint256 timestamp
    );

    event PoolTokenRemoved(
        address indexed poolToken,
        uint256 timestamp
    );

    event PoolTokenAdded(
        address indexed poolToken,
        uint256 timestamp
    );

    event IncentiveOwnerBChanged(
        address indexed newIncentiveOwnerB,
        uint256 timestamp
    );

    event IncentiveOwnerAChanged(
        address indexed newIncentiveOwnerA,
        uint256 timestamp
    );

    event ClaimedOwnershipIncentiveMaster(
        address indexed newIncentiveMaster,
        uint256 timestamp
    );

    event IncentiveMasterProposed(
        address indexed proposedIncentiveMaster,
        uint256 timestamp
    );

    event PoolFeeChanged(
        address indexed poolToken,
        uint256 indexed newPoolFee,
        uint256 timestamp
    );

    event ClaimedIncentives(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event ClaimedIncentivesBulk(
        uint256 timestamp
    );

    event IncentiveIncreasedB(
        uint256 indexed amount,
        uint256 timestamp
    );

    event IncentiveIncreasedA(
        uint256 indexed amount,
        uint256 timestamp
    );

    event BadDebtIncreasedLiquidation(
        uint256 amount,
        uint256 timestamp
    );

    event TotalBadDebtIncreased(
        uint256 amount,
        uint256 timestamp
    );

    event TotalBadDebtDecreased(
        uint256 amount,
        uint256 timestamp
    );

    event SetBadDebtPosition(
        uint256 indexed nftId,
        uint256 amount,
        uint256 timestamp
    );

    event UpdateBadDebtPosition(
        uint256 indexed nftId,
        uint256 newAmount,
        uint256 timestamp
    );

    event SetBeneficial(
        address indexed user,
        address[] token,
        uint256 timestamp
    );

    event RevokeBeneficial(
        address indexed user,
        address[] token,
        uint256 timestamp
    );

    event ClaimedFeesWise(
        address indexed token,
        uint256 indexed amount,
        uint256 indexed timestamp
    );

    event ClaimedFeesBeneficial(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 indexed timestamp
    );

    event PayedBackBadDebt(
        uint256 indexed nftId,
        address indexed sender,
        address indexed paybackToken,
        address receivingToken,
        uint256 paybackAmount,
        uint256 timestamp
    );

    event PayedBackBadDebtFree(
        uint256 indexed nftId,
        address indexed sender,
        address indexed paybackToken,
        uint256  paybackAmount,
        uint256 timestampp
    );
}