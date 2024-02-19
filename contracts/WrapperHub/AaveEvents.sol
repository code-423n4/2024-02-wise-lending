// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

contract AaveEvents {

    event SetAaveTokenAddress(
        address underlyingAsset,
        address aaveToken,
        uint256 timestamp
    );

    event IsDepositAave(
        uint256 nftId,
        uint256 timestamp
    );

    event IsWithdrawAave(
        uint256 nftId,
        uint256 timestamp
    );

    event IsBorrowAave(
        uint256 nftId,
        uint256 timestamp
    );

    event IsPaybackAave(
        uint256 nftId,
        uint256 timestamp
    );

    event IsSolelyDepositAave(
        uint256 nftId,
        uint256 timestamp
    );

    event IsSolelyWithdrawAave(
        uint256 nftId,
        uint256 timestamp
    );
}