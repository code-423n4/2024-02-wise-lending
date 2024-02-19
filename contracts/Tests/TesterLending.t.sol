// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../WiseLending.sol";

contract TesterLending is WiseLending {
    constructor(
        address _master,
        address _wiseOracleHub,
        address _nftContract
    )
        WiseLending(
            _master,
            _wiseOracleHub,
            _nftContract
        )
    {}

    function setPoleTest(
        uint256 _value,
        address _poolAddress
    )
        external
    {
        borrowRatesData[_poolAddress].pole = _value;
    }

    function setUtilisationTest(
        uint256 _value,
        address _poolAddress
    )
        external
    {
        globalPoolData[_poolAddress].utilization = _value;
    }

    function newBorrowRateTest(
        address _tokenAddress
    )
        external
    {
        _calculateNewBorrowRate(
            _tokenAddress
        );
    }

    function setPseudoTotalPoolTest(
        uint256 _value,
        address _tokenAddress
    )
        external
    {
        lendingPoolData[_tokenAddress].pseudoTotalPool = _value;
    }

    function setPseudoTotalBorrowAmountTest(
        uint256 _value,
        address _tokenAddress
    )
        external
    {
        borrowPoolData[_tokenAddress].pseudoTotalBorrowAmount = _value;
    }
}
