// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./PendlePowerFarmToken.sol";

error DeployForbidden();

contract PendlePowerFarmTokenFactory {

    address internal constant ZERO_ADDRESS = address(0x0);

    address public immutable IMPLEMENTATION_TARGET;
    address public immutable PENDLE_POWER_FARM_CONTROLLER;

    constructor(
        address _pendlePowerFarmController
    )
    {
        PENDLE_POWER_FARM_CONTROLLER = _pendlePowerFarmController;

        PendlePowerFarmToken implementation = new PendlePowerFarmToken{
            salt: keccak256(
                abi.encodePacked(
                    _pendlePowerFarmController
                )
            )
        }();

        IMPLEMENTATION_TARGET = address(
            implementation
        );
    }

    function deploy(
        address _underlyingPendleMarket,
        string memory _tokenName,
        string memory _symbolName,
        uint16 _maxCardinality
    )
        external
        returns (address)
    {
        if (msg.sender != PENDLE_POWER_FARM_CONTROLLER) {
            revert DeployForbidden();
        }

        return _clone(
            _underlyingPendleMarket,
            _tokenName,
            _symbolName,
            _maxCardinality
        );
    }

    function _clone(
        address _underlyingPendleMarket,
        string memory _tokenName,
        string memory _symbolName,
        uint16 _maxCardinality
    )
        private
        returns (address pendlePowerFarmTokenAddress)
    {
        bytes32 salt = keccak256(
            abi.encodePacked(
                _underlyingPendleMarket
            )
        );

        bytes20 targetBytes = bytes20(
            IMPLEMENTATION_TARGET
        );

        assembly {

            let clone := mload(0x40)

            mstore(
                clone,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )

            mstore(
                add(clone, 0x14),
                targetBytes
            )

            mstore(
                add(clone, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )

            pendlePowerFarmTokenAddress := create2(
                0,
                clone,
                0x37,
                salt
            )
        }

        PendlePowerFarmToken(pendlePowerFarmTokenAddress).initialize(
            _underlyingPendleMarket,
            PENDLE_POWER_FARM_CONTROLLER,
            _tokenName,
            _symbolName,
            _maxCardinality
        );
    }
}
