// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IFlashBorrower {

    function onFlashLoan(
        address _initiator,
        address[] memory _tokenList,
        uint256[] memory _amountList,
        uint256[] memory feeList,
        bytes[] calldata _data
    )
        external
        returns (bytes32);
}

interface IFlashLender {

    function maxFlashLoan(
        address _tokenAddress
    )
        external
        view
        returns (uint256);

    function flashFee(
        address _tokenAddress,
        uint256 _tokenAmount
    )
        external
        view
        returns (uint256);

    function flashLoan(
        IFlashBorrower _receiver,
        address[] memory _tokenList,
        uint256[] memory _amountList,
        bytes[] calldata _data
    )
        external
        returns (bool);
}

