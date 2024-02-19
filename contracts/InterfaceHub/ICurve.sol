// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface ICurve {

    function add_liquidity(
        address _pool,
        uint256[4] memory _depositAmounts,
        uint256 _minOutAmount
    )
        external
        returns (uint256);

    function balanceOf(
        address _userAddress
    )
        external
        view
        returns (uint256);

    function get_dy(
        int128 i,
        int128 j,
        uint256 dx
    )
        external
        view
        returns (uint256);

    function get_dy_underlying(
        int128 i,
        int128 j,
        uint256 dx
    )
        external
        view
        returns (uint256);

    function exchange(
        int128 fromIndex,
        int128 toIndex,
        uint256 exactAmountFrom,
        uint256 minReceiveAmount
    )
        external
        returns (uint256);

    function exchange_underlying(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    )
        external;

    function remove_liquidity(
        address _pool,
        uint256 _burnAmount,
        uint256[4] memory _coins
    )
        external;

    function remove_liquidity_one_coin(
        address _addy,
        uint256 _burnAmount,
        int128 _i,
        uint256 _minReceived
    )
        external;

    function coins(
        uint256 arg0
    )
        external
        view
        returns (address);

    function decimals()
        external
        view
        returns (uint8);

    function totalSupply()
        external
        view
        returns (uint256);

    function balances(
        uint256 arg0
    )
        external
        view
        returns (uint256);

    function approve(
        address _spender,
        uint256 _amount
    )
        external
        returns (bool);
}
