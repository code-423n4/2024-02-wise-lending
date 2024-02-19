// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IPendlePowerFarmTokenFactory {
    function deploy(
        address _underlyingPendleMarket,
        string memory _tokenName,
        string memory _symbolName,
        uint16 _maxCardinality
    )
        external
        returns (address);
}