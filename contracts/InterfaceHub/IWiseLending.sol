// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

struct GlobalPoolEntry {
    uint256 totalPool;
    uint256 utilization;
    uint256 totalBareToken;
    uint256 poolFee;
}

struct BorrowPoolEntry {
    bool allowBorrow;
    uint256 pseudoTotalBorrowAmount;
    uint256 totalBorrowShares;
    uint256 borrowRate;
}

struct LendingPoolEntry {
    uint256 pseudoTotalPool;
    uint256 totalDepositShares;
    uint256 collateralFactor;
}

struct PoolEntry {
    uint256 totalPool;
    uint256 utilization;
    uint256 totalBareToken;
    uint256 poolFee;
}

struct BorrowRatesEntry {
    uint256 pole;
    uint256 deltaPole;
    uint256 minPole;
    uint256 maxPole;
    uint256 multiplicativeFactor;
}

interface IWiseLending {

    function borrowRatesData(
        address _pooToken
    )
        external
        view
        returns (BorrowRatesEntry memory);

    function newBorrowRate(
        address _poolToken
    )
        external;

    function calculateBorrowShares(
        address _poolToken,
        uint256 _amount,
        bool _maxSharePrice
    )
        external
        view
        returns (uint256);

    function borrowPoolData(
        address _poolToken
    )
        external
        view
        returns (BorrowPoolEntry memory);

    function lendingPoolData(
        address _poolToken
    )
        external
        view
        returns (LendingPoolEntry memory);

    function getPositionBorrowShares(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function getTimeStamp(
        address _poolToken
    )
        external
        view
        returns (uint256);

    function getPureCollateralAmount(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function isUncollateralized(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (bool);

    function verifiedIsolationPool(
        address _poolAddress
    )
        external
        view
        returns (bool);

    function positionLocked(
        uint256 _nftId
    )
        external
        view
        returns (bool);

    function getTotalBareToken(
        address _poolToken
    )
        external
        view
        returns (uint256);

    function maxDepositValueToken(
        address _poolToken
    )
        external
        view
        returns (uint256);

    function master()
        external
        view
        returns (address);

    function WETH_ADDRESS()
        external
        view
        returns (address);

    function WISE_ORACLE()
        external
        view
        returns (address);

    function POSITION_NFT()
        external
        view
        returns (address);

    function FEE_MANAGER()
        external
        view
        returns (address);

    function WISE_SECURITY()
        external
        view
        returns (address);

    function lastUpdated(
        address _poolAddress
    )
        external
        view
        returns (uint256);

    function isolationPoolRegistered(
        uint256 _nftId,
        address _isolationPool
    )
        external
        view
        returns (bool);

    function calculateLendingShares(
        address _poolToken,
        uint256 _amount,
        bool _maxSharePrice
    )
        external
        view
        returns (uint256);

    function pureCollateralAmount(
        uint256 _nftId,
        address _poolToken
    )
        external
        returns (uint256);

    function getTotalPool(
        address _poolToken
    )
        external
        view
        returns (uint256);

    function depositExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        returns (uint256);

    function withdrawOnBehalfExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        returns (uint256);

    function syncManually(
        address _poolToken
    )
        external;

    function withdrawOnBehalfExactShares(
        uint256 _nftId,
        address _poolToken,
        uint256 _shares
    )
        external
        returns (uint256);

    function borrowOnBehalfExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        returns (uint256);

    function borrowExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        returns (uint256);

    function paybackExactAmountETH(
        uint256 _nftId
    )
        external
        payable
        returns (uint256);

    function solelyDeposit(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external;

    function paybackExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        returns (uint256);

    function paybackExactShares(
        uint256 _nftId,
        address _poolToken,
        uint256 _shares
    )
        external
        returns (uint256);

    function setPoolFee(
        address _poolToken,
        uint256 _newFee
    )
        external;

    function getPositionLendingShares(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function collateralizeDeposit(
        uint256 _nftId,
        address _poolToken
    )
        external;

    function approve(
        address _spender,
        address _poolToken,
        uint256 _amount
    )
        external;

    function withdrawExactShares(
        uint256 _nftId,
        address _poolToken,
        uint256 _shares
    )
        external
        returns (uint256);

    function withdrawExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        returns (uint256);

    function poolTokenAddresses()
        external
        returns (address[] memory);

    function corePaybackFeeManager(
        address _poolToken,
        uint256 _nftId,
        uint256 _amount,
        uint256 _shares
    )
        external;

    function sendingProgress()
        external
        view
        returns (bool);

    function depositExactAmountETH(
        uint256 _nftId
    )
        external
        payable
        returns (uint256);

    function coreLiquidationIsolationPools(
        uint256 _nftId,
        uint256 _nftIdLiquidator,
        address _caller,
        address _tokenToPayback,
        address _tokenToRecieve,
        uint256 _paybackAmount,
        uint256 _shareAmountToPay
    )
        external
        returns (uint256 reveiveAmount);

    function preparePool(
        address _poolToken
    )
        external;

    function getPositionBorrowTokenLength(
        uint256 _nftId
    )
        external
        view
        returns (uint256);

    function getPositionBorrowTokenByIndex(
        uint256 _nftId,
        uint256 _index
    )
        external
        view
        returns (address);

    function getPositionLendingTokenByIndex(
        uint256 _nftId,
        uint256 _index
    )
        external
        view
        returns (address);

    function getPositionLendingTokenLength(
        uint256 _nftId
    )
        external
        view
        returns (uint256);

    function globalPoolData(
        address _poolToken
    )
        external
        view
        returns (GlobalPoolEntry memory);


    function getGlobalBorrowAmount(
        address _token
    )
        external
        view
        returns (uint256);

    function getPseudoTotalBorrowAmount(
        address _token
    )
        external
        view
        returns (uint256);

    function getInitialBorrowAmountUser(
        address _user,
        address _token
    )
        external
        view
        returns (uint256);

    function getPseudoTotalPool(
        address _token
    )
        external
        view
        returns (uint256);

    function getInitialDepositAmountUser(
        address _user,
        address _token
    )
        external
        view
        returns (uint256);

    function getGlobalDepositAmount(
        address _token
    )
        external
        view
        returns (uint256);

    function paybackAmount(
        address _token,
        uint256 _shares
    )
        external
        view
        returns (uint256);

    function getPositionLendingShares(
        address _user,
        address _token
    )
        external
        view
        returns (uint256);

    function cashoutAmount(
        address _poolToken,
        uint256 _shares
    )
        external
        view
        returns (uint256);

    function getTotalDepositShares(
        address _token
    )
        external
        view
        returns (uint256);

    function getTotalBorrowShares(
        address _token
    )
        external
        view
        returns (uint256);

    function checkPositionLocked(
        uint256 _nftId,
        address _caller
    )
        external
        view;

    function checkDeposit(
        uint256 _nftId,
        address _caller,
        address _poolToken,
        uint256 _amount
    )
        external
        view;

    function setRegistrationIsolationPool(
        uint256 _nftId,
        bool _state
    )
        external;
}
