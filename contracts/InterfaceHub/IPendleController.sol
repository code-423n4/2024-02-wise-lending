// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IPendleController {

    struct compoundStruct {
        uint256[] reservedForCompound;
        uint128[] lastIndex;
        address[] rewardTokens;
    }

    function withdrawLp(
        address _pendleMarket,
        address _to,
        uint256 _amount
    )
        external;

    function increaseReservedForCompound(
        address _pendleMarket,
        uint256[] memory _amounts
    )
        external;

    function pendleChildCompoundInfoReservedForCompound(
        address _pendleMarket
    )
        external
        view
        returns (uint256[] memory);

    function pendleChildCompoundInfoLastIndex(
        address _pendleMarket
    )
        external
        view
        returns (uint128[] memory);

    function pendleChildCompoundInfoRewardTokens(
        address _pendleMarket
    )
        external
        view
        returns (address[] memory);

    function updateRewardTokens(
        address _pendleMarket
    )
        external
        returns (bool);

    function overWriteIndexAll(
        address _pendleMarket
    )
        external;

    function overWriteIndex(
        address _pendleMarket,
        uint256 _index
    )
        external;

    function overWriteAmounts(
        address _pendleMarket
    )
        external;
}
