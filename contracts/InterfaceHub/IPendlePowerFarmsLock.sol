// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IPendlePowerFarmsLock {

    function transferLP(
        uint256 _amount,
        address _pendleFarm
    )
        external;

    function transferYT(
        uint256 _amount,
        address _pendleFarm
    )
        external;

    function sendYT(
        uint256 _amount,
        address _pendleFarm
    )
        external;

    function burnLP(
        uint256 _amount,
        address _pendleFarm
    )
        external
        returns (
            uint256,
            uint256
        );
}
