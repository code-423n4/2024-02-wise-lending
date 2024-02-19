// SPDX-License-Identifier: MIT
pragma solidity =0.8.24;

import "./../InterfaceHub/IERC20.sol";

interface IAaveToken {
    function withdraw(
        uint256 _amount
    )
        external;

    function supply(
        uint256 _amount
    )
        external;
}

contract MockAave {

    mapping(address => IAaveToken) public fromTokenToAaveToken;

    constructor(
        address[] memory _tokens,
        IAaveToken[] memory _aaveTokens
    ) {
        for (uint256 i = 0; i < _tokens.length; i++) {
            fromTokenToAaveToken[_tokens[i]] = _aaveTokens[i];
            IERC20(_tokens[i]).approve(
                address(_aaveTokens[i]),
                type(uint256).max
            );
        }
    }

    function withdraw(
        address _token,
        uint256 _amount,
        address _recipient
    )
        external
    {
        IERC20(address(fromTokenToAaveToken[_token])).transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        fromTokenToAaveToken[_token].withdraw(_amount);

        IERC20(_token).transfer(
            _recipient,
            _amount
        );
    }

    function supply(
        address _token,
        uint256 _amount,
        address _owner,
        uint16
    )
        external
    {
        IERC20(_token).transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        fromTokenToAaveToken[_token].supply(
            _amount
        );

        IERC20(address(fromTokenToAaveToken[_token])).transfer(
            _owner,
            _amount
        );
    }
}