// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

struct MarketStorage {
    int128 totalPt;
    int128 totalSy;
    uint96 lastLnImpliedRate;
    uint16 observationIndex;
    uint16 observationCardinality;
    uint16 observationCardinalityNext;
}

struct MarketState {
    int256 totalPt;
    int256 totalSy;
    int256 totalLp;
    address treasury;
    int256 scalarRoot;
    uint256 expiry;
    uint256 lnFeeRateRoot;
    uint256 reserveFeePercent;
    uint256 lastLnImpliedRate;
}

struct LockedPosition {
    uint128 amount;
    uint128 expiry;
}

struct UserReward {
    uint128 index;
    uint128 accrued;
}

struct ApproxParams {
    uint256 guessMin;
    uint256 guessMax;
    uint256 guessOffchain;
    uint256 maxIteration;
    uint256 eps;
}

interface IPendleSy {

    function decimals()
        external
        view
        returns (uint8);

    function previewDeposit(
        address _tokenIn,
        uint256 _amountTokenToDeposit
    )
        external
        view
        returns (uint256 sharesAmount);

    function deposit(
        address _receiver,
        address _tokenIn,
        uint256 _amountTokenToDeposit,
        uint256 _minSharesOut
    )
        external
        returns (uint256 sharesAmount);

    function exchangeRate()
        external
        view
        returns (uint256);

    function redeem(
        address _receiver,
        uint256 _amountSharesToRedeem,
        address _tokenOut,
        uint256 _minTokenOut,
        bool _burnFromInternalBalance
    )
        external
        returns (uint256 amountTokenOut);
}

interface IPendleYt {

    function mintPY(
        address _receiverPT,
        address _receiverYT
    )
        external
        returns (uint256 pyAmount);

    function redeemPY(
        address _receiver
    )
        external
        returns (uint256);

    function redeemDueInterestAndRewards(
        address _user,
        bool _redeemInterest,
        bool _redeemRewards
    )
        external
        returns (
            uint256 interestOut,
            uint256[] memory rewardsOut
        );

    function getRewardTokens()
        external
        view
        returns (address[] memory);

    function userReward(
        address _token,
        address _user
    )
        external
        view
        returns (UserReward memory);

    function userInterest(
        address user
    )
        external
        view
        returns (
            uint128 lastPYIndex,
            uint128 accruedInterest
        );

    function pyIndexStored()
        external
        view
        returns (uint256);
}

interface IPendleMarket {

    function readTokens()
        external
        view
        returns (
            address SY,
            address PT,
            address YT
        );

    function activeBalance(
        address _user
    )
        external
        view
        returns (uint256);

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    )
        external;

    function balanceOf(
        address _user
    )
        external
        view
        returns (uint256);

    function isExpired()
        external
        view
        returns (bool);

    function decimals()
        external
        view
        returns (uint8);

    function increaseObservationsCardinalityNext(
        uint16 _newObservationCardinalityNext
    )
        external;

    function swapExactPtForSy(
        address receiver,
        uint256 exactPtIn,
        bytes calldata data
    )
        external
        returns (
            uint256 netSyOut,
            uint256 netSyFee
        );

    function _storage()
        external
        view
        returns (MarketStorage memory);

    function getRewardTokens()
        external
        view
        returns (address[] memory);

    function readState(
        address _router
    )
        external
        view
        returns (MarketState memory marketState);

    function mint(
        address _receiver,
        uint256 _netSyDesired,
        uint256 _netPtDesired
    )
        external
        returns (uint256[3] memory);

    function burn(
        address _receiverAddressSy,
        address _receiverAddressPt,
        uint256 _lpToBurn
    )
        external
        returns (
            uint256 syOut,
            uint256 ptOut
        );

    function redeemRewards(
        address _user
    )
        external
        returns (uint256[] memory);

    function totalSupply()
        external
        view
        returns (uint256);

    function userReward(
        address _token,
        address _user
    )
        external
        view
        returns (UserReward memory);
}

interface IPendleChildToken {

    function totalLpAssets()
        external
        view
        returns (uint256);

    function totalSupply()
        external
        view
        returns (uint256);

    function previewUnderlyingLpAssets()
        external
        view
        returns (uint256);

    function previewMintShares(
        uint256 _underlyingAssetAmount,
        uint256 _underlyingLpAssetsCurrent
    )
        external
        view
        returns (uint256);

    function previewAmountWithdrawShares(
        uint256 _shares,
        uint256 _underlyingLpAssetsCurrent
    )
        external
        view
        returns (uint256);

    function previewBurnShares(
        uint256 _underlyingAssetAmount,
        uint256 _underlyingLpAssetsCurrent
    )
        external
        view
        returns (uint256);
}

interface IPendleLock {

    function increaseLockPosition(
        uint128 _additionalAmountToLock,
        uint128 _newExpiry
    )
        external
        returns (uint128 newVeBalance);

    function withdraw()
        external
        returns (uint128);

    function positionData(
        address _user
    )
        external
        view
        returns (LockedPosition memory);

    function getBroadcastPositionFee(
        uint256[] calldata _chainIds
    )
        external
        view
        returns (uint256);
}

interface IPendleVoteRewards {
    function claimRetail(
        address _user,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    )
        external
        returns (uint256);
}

interface IPendleVoter {
    function vote(
        address[] memory _pools,
        uint64[] memory _weights
    )
        external;
}

interface IPendleChild {
    function depositExactAmount(
        uint256 _amount
    )
        external
        returns (
            uint256,
            uint256
        );

    function withdrawExactShares(
        uint256 _shares
    )
        external
        returns (uint256);
}

interface IPendleRouter {

    function swapSyForExactYt(
        address _receiver,
        address _market,
        uint256 _exactYtOut,
        uint256 _maxSyIn
    )
        external
        returns (
            uint256 netSyIn,
            uint256 netSyFee
        );

    function swapExactSyForYt(
        address _receiver,
        address _market,
        uint256 _exactSyIn,
        uint256 _minYtOut
    )
        external
        returns (
            uint256 netYtOut,
            uint256 netSyFee
        );

    function swapSyForExactPt(
        address _receiver,
        address _market,
        uint256 _exactPtOut,
        uint256 _maxSyIn
    )
        external
        returns (
            uint256 netSyIn,
            uint256 netSyFee
        );

    function swapExactSyForPt(
        address _receiver,
        address _market,
        uint256 _exactSyIn,
        uint256 _minPtOut
    )
        external
        returns (
            uint256 netPtOut,
            uint256 netSyFee
        );

    function removeLiquiditySingleSy(
        address _receiver,
        address _market,
        uint256 _netLpToRemove,
        uint256 _minSyOut
    )
        external
        returns (
            uint256 netSyOut,
            uint256 netSyFee
        );

    function addLiquiditySingleSy(
        address _receiver,
        address _market,
        uint256 _netSyIn,
        uint256 _minLpOut,
        ApproxParams calldata _guessPtReceivedFromSy
    )
        external
        returns (
            uint256 netLpOut,
            uint256 netSyFee
        );
}

interface IPendleRouterStatic {

    function addLiquiditySingleSyStatic(
        address _market,
        uint256 _netSyIn
    )
        external
        view
        returns (
            uint256 netLpOut,
            uint256 netPtFromSwap,
            uint256 netSyFee,
            uint256 priceImpact,
            uint256 exchangeRateAfter,
            uint256 netSyToSwap
        );

    function swapExactPtForSyStatic(
        address _market,
        uint256 _exactPtIn
    )
        external
        view
        returns (
            uint256 netSyOut,
            uint256 netSyFee,
            uint256 priceImpact,
            uint256 exchangeRateAfter
        );
}
