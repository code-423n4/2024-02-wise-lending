// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

struct CurveSwapStructToken {
    uint256 curvePoolTokenIndexFrom;
    uint256 curvePoolTokenIndexTo;
    uint256 curveMetaPoolTokenIndexFrom;
    uint256 curveMetaPoolTokenIndexTo;
}

struct CurveSwapStructData {
    address curvePool;
    address curveMetaPool;
    bytes swapBytesPool;
    bytes swapBytesMeta;
}

interface IWiseSecurity {

    function checkMinDepositValue(
        address _poolToken,
        uint256 _amount
    )
        external
        view
        returns (bool);

    function overallETHBorrow(
        uint256 _nftId
    )
        external
        view
        returns (uint256 buffer);

    function overallETHCollateralsBoth(
        uint256 _nftId
    )
        external
        view
        returns (uint256 weighted, uint256 unweightedamount);

    function checkHealthState(
        uint256 _nftId,
        bool _isPowerFarm
    )
        external
        view;

    function checkPoolCondition(
        address _token
    )
        external
        view;

    function checkPoolWithMinDeposit(
        address _poolToken,
        uint256 _amount
    )
        external
        view
        returns (bool);

    function overallETHBorrowHeartbeat(
        uint256 _nftId
    )
        external
        view
        returns (uint256 buffer);

    function checkBadDebtLiquidation(
        uint256 _nftId
    )
        external;

    function checksLiquidation(
        uint256 _nftIdLiquidate,
        address _tokenToPayback,
        uint256 _shareAmountToPay
    )
        external
        view;

    function getPositionLendingAmount(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function getBorrowRate(
        address _poolToken
    )
        external
        view
        returns (uint256);

    function getPositionBorrowAmount(
        uint256 _nftId,
        address _poolToken
    )
        external
        view
        returns (uint256);

    function overallUSDCollateralsBare(
        uint256 _nftId
    )
        external
        view
        returns (uint256 amount);

    function overallETHCollateralsBare(
        uint256 _nftId
    )
        external
        view
        returns (uint256 amount);

    function FEE_MANAGER()
        external
        view
        returns (address);

    function AAVE_HUB()
        external
        view
        returns (address);

    function curveSecurityCheck(
        address _poolAddress
    )
        external;

    function prepareCurvePools(
        address _poolToken,
        CurveSwapStructData calldata _curveSwapStructData,
        CurveSwapStructToken calldata _curveSwapStructToken
    )
        external;

    function overallETHBorrowBare(
        uint256 _nftId
    )
        external
        view
        returns (uint256 amount);

    function checksWithdraw(
        uint256 _nftId,
        address _caller,
        address _poolToken
    )
        external
        view
        returns (bool);

    function checksBorrow(
        uint256 _nftId,
        address _caller,
        address _poolToken
    )
        external
        view
        returns (bool);

    function checksSolelyWithdraw(
        uint256 _nftId,
        address _caller,
        address _poolToken
    )
        external
        view
        returns (bool);

    function checkOwnerPosition(
        uint256 _nftId,
        address _caller
    )
        external
        view;

    function checksCollateralizeDeposit(
        uint256 _nftIdCaller,
        address _caller,
        address _poolAddress
    )
        external
        view;

    function calculateWishPercentage(
        uint256 _nftId,
        address _receiveToken,
        uint256 _paybackETH,
        uint256 _maxFeeETH,
        uint256 _baseRewardLiquidation
    )
        external
        view
        returns (uint256);

    function checkUncollateralizedDeposit(
        uint256 _nftIdCaller,
        address _poolToken
    )
        external
        view;

    function checkPositionLocked(
        uint256 _nftId,
        address _caller
    )
        external
        view;

    function maxFeeETH()
        external
        view
        returns (uint256);

    function maxFeeFarmETH()
        external
        view
        returns (uint256);

    function baseRewardLiquidation()
        external
        view
        returns (uint256);

    function baseRewardLiquidationFarm()
        external
        view
        returns (uint256);

    function checksRegister(
        uint256 _nftId,
        address _caller
    )
        external
        view;

    function getLendingRate(
        address _poolToken
    )
        external
        view
        returns (uint256);
}
