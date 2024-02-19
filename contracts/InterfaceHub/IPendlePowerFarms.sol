// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IPendlePowerFarms {

    function oracleSyAmount()
        external
        view
        returns (uint256);

    function totalSupply()
        external
        view
        returns (uint256);

    function compoundFarm(
        uint256 _maxAmountInYt,
        uint256 _maxAmountInPt,
        uint256 _minAmountOutYt,
        uint256 _minAmountOutPt,
        uint256 _slippage
    )
        external;

    function YT_PENDLE_ADDRESS()
        external
        view
        returns (address);

    function PENDLE_MARKET_ADDRESS()
        external
        view
        returns (address);

    function SY_PENDLE_ADDRESS()
        external
        view
        returns (address);

    function underlyingFarmToken()
        external
        view
        returns (address);

    function addCompoundSyAmount(
        uint256 _amount
    )
        external;

    function compoundFarm(
        bytes calldata _data,
        uint256 _overhangQueried,
        bool _ptGreater,
        bool _swapAllSy
    )
        external;
}
