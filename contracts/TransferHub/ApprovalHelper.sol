// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./CallOptionalReturn.sol";

contract ApprovalHelper is CallOptionalReturn {

    /**
     * @dev
     * Allows to execute safe approve for a token
     */
    function _safeApprove(
        address _token,
        address _spender,
        uint256 _value
    )
        internal
    {
        _callOptionalReturn(
            _token,
            abi.encodeWithSelector(
                IERC20.approve.selector,
                _spender,
                _value
            )
        );
    }
}