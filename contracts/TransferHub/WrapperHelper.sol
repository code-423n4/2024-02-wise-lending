// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../InterfaceHub/IWETH.sol";

contract WrapperHelper {

    IWETH internal immutable WETH;

    constructor(
        address _wethAddress
    )
    {
        WETH = IWETH(
            _wethAddress
        );
    }

    /**
     * @dev Wrapper for wrapping
     * ETH call.
     */
    function _wrapETH(
        uint256 _value
    )
        internal
    {
        WETH.deposit{
            value: _value
        }();
    }

    /**
     * @dev Wrapper for unwrapping
     * ETH call.
     */
    function _unwrapETH(
        uint256 _value
    )
        internal
    {
        WETH.withdraw(
            _value
        );
    }
}
