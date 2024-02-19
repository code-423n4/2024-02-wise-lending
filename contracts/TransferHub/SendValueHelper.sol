// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

error AmountTooSmall();
error SendValueFailed();

contract SendValueHelper {

    bool public sendingProgress;

    function _sendValue(
        address _recipient,
        uint256 _amount
    )
        internal
    {
        if (address(this).balance < _amount) {
            revert AmountTooSmall();
        }

        sendingProgress = true;

        (
            bool success
            ,
        ) = payable(_recipient).call{
            value: _amount
        }("");

        sendingProgress = false;

        if (success == false) {
            revert SendValueFailed();
        }
    }
}
