// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./../PowerFarms/PendlePowerFarmController/SimpleERC20Clone.sol";

contract MockErc20 is SimpleERC20 {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        _name = _name;
        _symbol = _symbol;
        _decimals = _decimals;
        _totalSupply = _totalSupply;
        _balances[msg.sender] = _totalSupply;
    }
}
