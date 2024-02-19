const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { weeks } = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration");
const { advanceTimeAndBlock } = require("./utils");
const { toWei } = require("./constants");

takeSnapshot = async (_helpers) => {
    snapshot = await _helpers.takeSnapshot();
}

// Arguments: address[] depositTokens, address[] user, bool[] exactTokens,
// bool[] isCollateral, uint256[] amounts, object lendingContract, object Token, object Helpers
depositTokens = async (_Lending, _Helper, _Token, inputParam = {}) => {

    let balAfter;
    let balBefore;

    let internBalBefore;
    let internBalAfter;

    let diff;

    const lendingAddress = _Lending.address;

    for (index = 0; index < inputParam.token.length; index++) {

        const nftId = inputParam.nftId[index];
        const user = inputParam.user[index];
        const amount = inputParam.amounts[index];
        const token = inputParam.token[index];

        balBefore = await _Lending.getPositionLendingShares(
            nftId,
            token.address
        );

        if (inputParam.exactTokens[index] == true) {

            await token.approve(
                lendingAddress,
                amount,
                {
                    from: user
                }
            );

            await _Lending.depositExactAmount(
                nftId,
                token.address,
                amount,
                {
                    from: user
                }
            );

            balAfter = await token.balanceOf(
                lendingAddress
            );

            assert.equal(
                amount.toString(),
                balAfter.toString()
            );

        } else {

            internBalBefore = await token.balanceOf(
                lendingAddress
            );

            await takeSnapshot(
                inputParam.Helpers
            );

            await _Lending.syncManually(
                token.address
            );

            // const maxAmount = false;

            sharesIntoToken = await _Lending.cashoutAmount(
                token.address,
                amount
                // maxAmount
            );

            await snapshot.restore();

            await token.approve(
                lendingAddress,
                sharesIntoToken,
                {
                    from: user
                }
            );

            await _Lending.depositExactShares(
                token.address,
                amount,
                {
                    from: user
                }
            );

            internBalAfter = await token.balanceOf(
                lendingAddress
            );

            diff = internBalAfter.sub(
                internBalBefore
            );

            assert.equal(
                diff.toString(),
                sharesIntoToken.toString()
            );
        }

        if (balBefore == 0 && inputParam.isCollateral[index] == true) {

            await _Lending.collateralizeDeposit(
                nftId,
                token.address,
                {
                    from: user
                }
            );
        }
    }
}

// Arguments: address[] withdrawTokens, address[] user, bool[] exactTokens,
// uint256[] amounts, object lendingContract, object Token, object Helpers
withdrawTokens = async (inputParam = {}) => {

    let token;

    let balBeforeUser;
    let balBefore;

    let balAfter;
    let balAfterUser;

    let diffContract;
    let diffUser;

    for (index = 0; index < inputParam.withdrawTokens.length; index++) {

        const lendingContract = inputParam.lendingContract;
        const lendingAddress = lendingContract.address;

        token = await inputParam.Token.at(
            inputParam.withdrawTokens[index].address
        );

        const exactToken = data.exactTokens

        balBeforeUser = await token.balanceOf(
            inputParam.user[index]
        );

        balBefore = await token.balanceOf(
            lendingAddress
        );

        if (exactToken == true) {

            await lendingContract.withdrawExactAmount(
                token.address,
                inputParam.amounts[index],
                {
                    from: inputParam.user[index]
                }
            );

            balAfterUser = await token.balanceOf(
                inputParam.user[index]
            );

            balAfter = await token.balanceOf(
                lendingAddress
            );

            diffContract =balBefore.sub(
                balAfter
            );

            diffUser = balAfterUser.sub(
                balBeforeUser
            );

            assert.equal(
                diffContract.toString(),
                diffUser.toString()
            );

            assert.equal(
                diffUser.toString(),
                inputParam.amounts[index]
            );

        } else {

            await lendingContract.syncManually(
                token.address
            );

            const maxShareUser = await lendingContract.getPositionLendingShares(
                inputParam.user[index],
                token.address
            );

            // const maxAmount = false;

            sharesIntoToken = await lendingContract.cashoutAmount(
                token.address,
                inputParam.amounts[index]
                // maxAmount
            );

            if (maxShareUser < sharesIntoToken) {

                console.log(`
                    Not enough share. Exit tests...
                `);

                process.exit(1);
            }

            await lendingContract.withdrawExactShares(
                token.address,
                inputParam.amounts[index],
                {
                    from: inputParam.user[index]
                }
            );

            balAfter = await token.balanceOf(
                lendingAddress
            );

            balAfterUser = await token.balanceOf(
                inputParam.user[index]
            );

            diffContract = balBefore.sub(
                balAfter
            );

            diffUser = balAfterUser.sub(
                balBeforeUser
            );

            assert.equal(
                diffContract.toString(),
                diffUser.toString()
            );

            assert.equal(
                diffUser.toString(),
                sharesIntoToken.toString()
            );
        }
    }
}

// Arguments: address[] borrowTokens, address[] user, bool[] exactTokens,
// uint256[] amounts, object lendingContract, object Token, object Helpers
borrowToken = async (_Lending, _borrowData) => {

    let diff;
    let diffUser;

    let balAfter;
    let balBefore;

    let balAfterUser;
    let balBeforeUser;

    let shareToToken;

    const lendingAddress = _Lending.address;

    await Promise.all(_borrowData.map(async (data) => {

        const user = data.user;
        const nftId = data.nftId;
        const amount = data.amounts;
        const token = data.token;

        const exactToken = data.exactTokens;

        balBefore = await token.balanceOf(
            lendingAddress
        );

        balBeforeUser = await token.balanceOf(
            user
        );

        if (exactToken == true) {

            await _Lending.borrowExactAmount(
                nftId,
                token.address,
                amount,
                {
                    from: user
                }
            );

            balAfter = await token.balanceOf(
                lendingAddress
            );

            balAfterUser = await token.balanceOf(
                user
            );

            diff = balBefore.sub(
                balAfter
            );

            diffUser = balAfterUser.sub(
                balBeforeUser
            );

            assert.equal(
                amount.toString(),
                diff.toString()
            );

            assert.equal(
                diffUser.toString(),
                diff.toString()
            );
        } else {

            await _Lending.syncManually(
                token.address
            );

            shareToToken = await _Lending.paybackAmount(
                token.address,
                amount
            );

            await _Lending.borrowExactShares(
                nftId,
                token.address,
                amount,
                {
                    from: user
                }
            );

            balAfter = await token.balanceOf(
                lendingAddress
            );

            balAfterUser = await token.balanceOf(
                user
            );

            diff = balBefore.sub(
                balAfter
            );

            diffUser = balAfterUser.sub(
                balBeforeUser
            );

            assert.equal(
                shareToToken.toString(),
                diff.toString()
            );

            assert.equal(
                diffUser.toString(),
                diff.toString()
            );
        }

    }));
}

// Arguments: address[] paybackTokens, address[] user, bool[] exactTokens,
// uint256[] amounts, object lendingContract, object Token, object Helpers
paybackToken = async (_Lending, _Helpers, _paybackData) => {

    let diff;
    let diffUser;

    let balAfter;
    let balBefore;

    let balAfterUser;
    let balBeforeUser;

    let shareToToken;

    const lendingAddress = _Lending.address;

    await Promise.all(_paybackData.map(async (data) => {

        const user = data.user;
        const nftId = data.nftId;
        const amount = data.amounts;
        const token = data.token;

        const exactToken = data.exactTokens;

        balBefore = await token.balanceOf(
            lendingAddress
        );

        balBeforeUser = await token.balanceOf(
            user
        );

        if (exactToken == true) {

            await _Lending.paybackExactAmount(
                nftId,
                token.address,
                amount,
                {
                    from: user
                }
            );

            balAfter = await token.balanceOf(
                lendingAddress
            );

            balAfterUser = await token.balanceOf(
                user
            );

            diff = balAfter.sub(
                balBefore
            );

            diffUser = balBeforeUser.sub(
                balAfterUser
            );

            assert.equal(
                amount.toString(),
                diff.toString()
            );

            assert.equal(
                diffUser.toString(),
                diff.toString()
            );
        } else {

            await takeSnapshot(
                _Helpers
            );

            await _Lending.syncManually(
                token.address
            );

            shareToToken = await _Lending.paybackAmount(
                nftId,
                token.address,
                amount
            );

            const maxShareUser = await inputParam.lendingContract.getPositionBorrowShares(
                inputParam.user[index],
                token.address
            )

            if (maxShareUser < sharesIntoToken) {

                console.log(`
                    Not enough share. Exit tests...
                `);

                process.exit(1);
            }

            await snapshot.restore();

            await _Lending.paybackExactShares(
                nftId,
                token.address,
                amount,
                {
                    from: user
                }
            );

            balAfter = await token.balanceOf(
                lendingAddress
            );

            balAfterUser = await token.balanceOf(
                user
            );

            diff = balAfter.sub(
                balBefore
            );

            diffUser = balBeforeUser.sub(
                balAfterUser
            );

            assert.equal(
                shareToToken.toString(),
                diff.toString()
            );

            assert.equal(
                diffUser.toString(),
                diff.toString()
            );
        }

    }));
}

// Arguments: address[] depositTokens, address[] depositTokensAave, address[] user, bool[] exactTokens,
// bool[] isCollateral, uint256[] amounts, object lendingContract, object aaveLayer, object Token, object Helpers
depositTokensAave = async ( inputParam = {}) => {

    const MAX_AAVE_TOKEN_DIFF = 1000; // ~ error of order 1E-15
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    let balAfter;
    let balBefore;

    let balBeforeUser;
    let balAfterUser;

    let diff;
    let diffUser;

    let token;
    let tokenAave;

    let balBeforeUserLending;

    for (index = 0; index < inputParam.depositTokens.length; index++) {

        const inputUser = inputParam.user[index];
        const inputAmount = inputParam.amounts[index];
        const lendingAddress = inputParam.lendingContract.address;

        tokenAave = await inputParam.Token.at(
            inputParam.depositTokensAave[index].address
        );

        token = await inputParam.Token.at(
            inputParam.depositTokens[index].address
        );

        balBeforeUserLending = await inputParam.lendingContract.getPositionLendingShares(
            inputUser,
            tokenAave.address
        );

        if (inputParam.exactTokens[index] == true) {

            if (token.address == WETH_ADDRESS) {

                balBefore = await tokenAave.balanceOf(
                    lendingAddress
                );

                await inputParam.aaveLayer.depositExactAmountETH(
                    {
                        from: inputUser,
                        value: inputAmount
                    }
                );

                balAfter = await tokenAave.balanceOf(
                    lendingAddress
                );

                diff = balAfter
                    .sub(balBefore)
                    .sub(BN(inputAmount))

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

            } else {

                await token.approve(
                    inputParam.aaveLayer.address,
                    inputAmount,
                    {
                        from: inputUser
                    }
                );

                balBeforeUser = await token.balanceOf(
                    inputUser
                );

                balBefore = await tokenAave.balanceOf(
                    lendingAddress
                );

                await inputParam.aaveLayer.depositExactAmount(
                    token.address,
                    inputAmount,
                    {
                        from: inputUser,
                    }
                );

                balAfterUser = await token.balanceOf(
                    inputUser
                );

                balAfter = await tokenAave.balanceOf(
                    lendingAddress
                );

                diffUser = balBeforeUser.sub(
                    balAfterUser
                );

                diff = balAfter
                    .sub(balBefore)
                    .sub(inputAmount);

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

                assert.equal(
                    diffUser.toString(),
                    inputAmount.toString()
                );
            }

        } else {

            balBefore = await tokenAave.balanceOf(
                lendingAddress
            );

            balBeforeUser = await token.balanceOf(
                inputUser
            );

            await takeSnapshot(inputParam.Helpers);

            await inputParam.lendingContract.syncManually(
                tokenAave.address
            );

            const maxAmount = false;

            sharesIntoToken = await inputParam.lendingContract.cashoutAmount(
                tokenAave.address,
                inputParam.amounts[index]
                // maxAmount
            );

            await snapshot.restore();

            await token.approve(
                inputParam.aaveLayer.address,
                sharesIntoToken,
                {
                    from: inputUser
                }
            );

            await inputParam.aaveLayer.depositExactShares(
                token.address,
                inputParam.amounts[index],
                {
                    from: inputUser
                }
            );

            balAfterUser = await token.balanceOf(
                inputUser
            );

            balAfter = await tokenAave.balanceOf(
                lendingAddress
            );

            diffUser = balBeforeUser.sub(
                balAfterUser
            );

            diff = balAfter
                .sub(balBefore)
                .sub(sharesIntoToken);

            assert.isAtLeast(
                parseInt(MAX_AAVE_TOKEN_DIFF),
                parseInt(diff)
            );

            assert.equal(
                diffUser.toString(),
                sharesIntoToken.toString()
            );
        }

        if (balBeforeUserLending == 0 && inputParam.isCollateral[index] == true) {

            await inputParam.lendingContract.collateralizeDeposit(
                tokenAave.address,
                {
                    from: inputUser
                }
            );
        }
    }
}

// Arguments: address[] withdrawTokens, address[] withdrawTokensAave, address[] user, bool[] exactTokens,
// uint256[] amounts, object lendingContract, object aaveLayer, object Token, object Helpers
withdrawTokensAave = async ( inputParam = {}) => {

    const MAX_AAVE_TOKEN_DIFF = 1000; // ~ error of order 1E-15
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    let balAfter;
    let balBefore;

    let balBeforeUser;
    let balAfterUser;

    let diff;
    let diffUser;

    let token;
    let tokenAave;

    for (index = 0; index < inputParam.withdrawTokens.length; index++) {

        const amount = inputParam.amounts[index];
        const user = inputParam.user[index];
        const lendingContract = inputParam.lendingContract;

        tokenAave = await inputParam.Token.at(
            inputParam.withdrawTokensAave[index].address
        );

        token = await inputParam.Token.at(
            inputParam.withdrawTokens[index].address
        );

        if (inputParam.exactTokens[index] == true) {

            if (token.address == WETH_ADDRESS) {

                balBefore = await tokenAave.balanceOf(
                    lendingContract.address
                );

                await inputParam.aaveLayer.withdrawExactAmountETH(
                        amount,
                    {
                        from: user,
                    }
                );

                balAfter = await tokenAave.balanceOf(
                    lendingContract.address
                );

                diff = Bn(amount)
                    .sub(balBefore)
                    .sub(balAfter);

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

            } else {

                balBeforeUser = await token.balanceOf(
                    user
                );

                balBefore = await tokenAave.balanceOf(
                    lendingContract.address
                );

                await inputParam.aaveLayer.withdrawExactAmount(
                    token.address,
                    amount,
                    {
                        from: user,
                    }
                );

                balAfterUser = await token.balanceOf(
                    user
                );

                balAfter = await tokenAave.balanceOf(
                    lendingContract.address
                );

                diffUser = balAfterUser.sub(
                    balBeforeUser
                );

                diff = Bn(amount)
                    .sub(balBefore)
                    .sub(balAfter);

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

                assert.equal(
                    diffUser.toString(),
                    amount.toString()
                );
            }

        } else {

            balBefore = await tokenAave.balanceOf(
                lendingContract.address
            );

            balBeforeUser = await token.balanceOf(
                user
            );

            const maxShareUser = await lendingContract.getPositionLendingShares(
                user,
                tokenAave.address
            )

            if (maxShareUser < amount) {

                console.log(`
                    Not enough share. Exit tests...
                `);

                process.exit(1);
            }

            await takeSnapshot(
                inputParam.Helpers
            );

            await lendingContract.syncManually(
                tokenAave.address
            );

            // const maxAmount = false;

            sharesIntoToken = await lendingContract.cashoutAmount(
                tokenAave.address,
                amount
                // maxAmount
            );

            await snapshot.restore();

            if (token.address == WETH_ADDRESS) {

                await inputParam.aaveLayer.withdrawExactSharesETH(
                        amount,
                    {
                        from: user,
                    }
                );

                balAfter = await tokenAave.balanceOf(
                    lendingContract.address
                );

                diff = Bn(amount)
                    .sub(Bn(balBefore))
                    .sub(Bn(balAfter));

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

            } else {

                await inputParam.aaveLayer.withdrawExactShares(
                    token.address,
                    amount,
                    {
                        from: user
                    }
                );

                balAfterUser = await token.balanceOf(
                    user
                );

                balAfter = await tokenAave.balanceOf(
                    lendingContract.address
                );

                diffUser = balAfterUser
                    .sub(balBeforeUser)

                diff = balAfter
                    .sub(balBefore)
                    .sub(sharesIntoToken);

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

                const finalDiff = Math.abs(
                    Bn(diffUser).sub(Bn(sharesIntoToken))
                );

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(finalDiff)
                );
            };
        }
    }
}

// Arguments: address[] borrowTokens, address[] borrowTokensAave, address[] user, bool[] exactTokens,
// uint256[] amounts, object lendingContract, object aaveLayer, object Token, object Helpers
borrowTokensAave = async ( inputParam = {}) => {

    const MAX_AAVE_TOKEN_DIFF = 1000; // ~ error of order 1E-15
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    let balAfter;
    let balBefore;

    let balBeforeUser;
    let balAfterUser;

    let diff;
    let diffUser;

    let token;
    let tokenAave;

    for (index = 0; index < inputParam.borrowTokensAave.length; index++) {

        const user = inputParam.user[index];
        const amount = inputParam.amounts[index];

        tokenAave = await inputParam.Token.at(
            inputParam.borrowTokensAave[index].address
        );

        token = await inputParam.Token.at(
            inputParam.borrowTokens[index].address
        );

        if (inputParam.exactTokens[index] == true) {

            if (token.address == WETH_ADDRESS) {

                balBefore = await tokenAave.balanceOf(
                    inputParam.lendingContract.address
                );

                await inputParam.aaveLayer.borrowExactAmountETH(
                        amount,
                    {
                        from: user,
                    }
                );

                balAfter = await tokenAave.balanceOf(
                    inputParam.lendingContract.address
                );

                diff = Bn(amount)
                    .sub(Bn(balBefore))
                    .sub(Bn(balAfter));

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

            } else {

                balBeforeUser = await token.balanceOf(
                    user
                );

                balBefore = await tokenAave.balanceOf(
                    inputParam.lendingContract.address
                );

                await inputParam.aaveLayer.borrowExactAmount(
                    token.address,
                    amount,
                    {
                        from: user,
                    }
                );

                balAfterUser = await token.balanceOf(
                    user
                );

                balAfter = await tokenAave.balanceOf(
                    inputParam.lendingContract.address
                );

                diffUser = balAfterUser.sub(
                    balBeforeUser
                );

                diff = Bn(amount)
                .sub(Bn(balBefore))
                .sub(Bn(balAfter));

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

                assert.equal(
                    diffUser.toString(),
                    amount.toString()
                );
            }

        } else {

            balBefore = await tokenAave.balanceOf(
                inputParam.lendingContract.address
            );

            balBeforeUser = await token.balanceOf(
                user
            );

            await takeSnapshot(inputParam.Helpers);

            await inputParam.lendingContract.syncManually(
                tokenAave.address
            );

            sharesIntoToken = await inputParam.lendingContract.paybackAmount(
                tokenAave.address,
                amount
            );

            await snapshot.restore();

            if (token.address == WETH_ADDRESS) {

                await inputParam.aaveLayer.borrowExactSharesETH(
                        amount,
                    {
                        from: user,
                    }
                );

                balAfter = await tokenAave.balanceOf(
                    inputParam.lendingContract.address
                );

                diff = Bn(amount)
                    .sub(balBefore)
                    .sub(balAfter);

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

            } else {

                await inputParam.aaveLayer.borrowExactShares(
                    token.address,
                    amount,
                    {
                        from: user
                    }
                );

                balAfterUser = await token.balanceOf(
                    user
                );

                balAfter = await tokenAave.balanceOf(
                    inputParam.lendingContract.address
                );

                diffUser = balAfterUser.sub(
                    balBeforeUser
                );

                diff = balAfter
                    .sub(balBefore)
                    .sub(sharesIntoToken);

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

                assert.equal(
                    diffUser.toString(),
                    sharesIntoToken.toString()
                );
            };
        }
    }
}

// Arguments: address[] paybackTokens, address[] paybackTokensAave, address[] user, bool[] exactTokens,
// uint256[] amounts, object lendingContract, object aaveLayer, object Token, object Helpers
paybackTokensAave = async (inputParam = {}) => {

    MAX_AAVE_TOKEN_DIFF = 1000; // ~ error of order 1E-15
    MAX_AAVE_TOKEN_DIFF_2 = 5000000000;

    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    let balAfter;
    let balBefore;

    let balBeforeUser;
    let balAfterUser;

    let diff;
    let diffUser;

    let token;
    let tokenAave;

    for (index = 0; index < inputParam.paybackTokensAave.length; index++) {

        const userAddress = inputParam.user[index];
        const paymentAmount = inputParam.amounts[index];
        const lendingContract = inputParam.lendingContract;

        tokenAave = await inputParam.Token.at(
            inputParam.paybackTokensAave[index].address
        );

        token = await inputParam.Token.at(
            inputParam.paybackTokens[index].address
        );

        if (inputParam.exactTokens[index] == true) {

            if (token.address == WETH_ADDRESS) {

                balBefore = await tokenAave.balanceOf(
                    lendingContract.address
                );

                await inputParam.aaveLayer.paybackExactAmountETH(
                    {
                        from: userAddress,
                        value: inputParam.amounts[index]
                    }
                );

                balAfter = await tokenAave.balanceOf(
                    lendingContract.address
                );

                assert.isAbove(
                    parseInt(balAfter),
                    parseInt(balBefore)
                );

            } else {

                balBeforeUser = await token.balanceOf(
                    userAddress
                );

                balBefore = await tokenAave.balanceOf(
                    lendingContract.address
                );

                await inputParam.aaveLayer.paybackExactAmount(
                    token.address,
                    paymentAmount,
                    {
                        from: userAddress,
                    }
                );

                balAfterUser = await token.balanceOf(
                    userAddress
                );

                balAfter = await tokenAave.balanceOf(
                    lendingContract.address
                );

                diffUser = Bn(balBeforeUser)
                    .sub(Bn(balAfterUser))

                diff = balAfter
                    .sub(balBefore)
                    .sub(paymentAmount);

                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diff)
                );

                assert.equal(
                    diffUser.toString(),
                    paymentAmount.toString()
                );
            }

        } else {

            balBefore = await tokenAave.balanceOf(
                lendingContract.address
            );

            balBeforeUser = await token.balanceOf(
                userAddress
            );

            await takeSnapshot(
                inputParam.Helpers
            );

            await lendingContract.syncManually(
                tokenAave.address
            );

            sharesIntoToken = await lendingContract.paybackAmount(
                tokenAave.address,
                paymentAmount
            );

            const maxShareUser = await lendingContract.getPositionBorrowShares(
                userAddress,
                tokenAave.address
            )

            await snapshot.restore();

            await inputParam.aaveLayer.paybackExactShares(
                token.address,
                paymentAmount,
                {
                    from: userAddress
                }
            );

            balAfterUser = await token.balanceOf(
                userAddress
            );

            balAfter = await tokenAave.balanceOf(
                lendingContract.address
            );

            diffUser = Bn(balBeforeUser)
                .sub(balAfterUser);

            assert.isAbove(
                parseInt(balAfter),
                parseInt(balBefore)
            );

            const diffEnd = Math.abs(
               Bn(diffUser).sub(Bn(sharesIntoToken))
            );
            const decimals = await token.decimals();

            if (decimals != 18) {
                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF),
                    parseInt(diffEnd)
                );
            } else {
                assert.isAtLeast(
                    parseInt(MAX_AAVE_TOKEN_DIFF_2),
                    parseInt(diffEnd)
                );
            }
        };
    }
}

// @dev NEED ADJUSTMENT WITH BYTES32

// Arguments: address user[], uint256 amounts[], bool[] shouldRegister, object lendingContract, object isolationPool, instance Token
depositTokensIsolation = async ( inputParam = {}) => {

    let registered;

    let balBefore;
    let balBeforeUser;

    let balAfter;
    let balAfterUser;

    let diff;
    let diffUser;

    // bravo!
    const collateralToken = await inputParam.isolationPool.COLLATERAL_TOKEN_ADDRESS();

    // bravo!
    const token = await inputParam.Token.at(
        collateralToken
    );

    // why not continue with same references?
    // create more:

    for (index = 0; index < inputParam.user.length; index++) {

        const userAddress = inputParam.user[index];
        const paymentAmount = inputParam.amounts[index];
        const lendingContract = inputParam.lendingContract;
        const isolationPool = inputParam.isolationPool;

        registered = await lendingContract.positionLocked(
            userAddress
        );

        if (registered == false && inputParam.shouldRegister[index] == true) {

            await lendingContract.registrationIsolationPool(
                isolationPool.address,
                {
                    from: userAddress
                }
            );
        }

        balBeforeUser = await token.balanceOf(
            userAddress
        );

        balBefore = await token.balanceOf(
            lendingContract.address
        );

        await token.approve(
            isolationPool.address,
            paymentAmount,
            {
                from: userAddress
            }
        );

        await isolationPool.depositExactAmount(
            paymentAmount,
            {
                from: userAddress
            }
        );

        balAfterUser = await token.balanceOf(
            userAddress
        );

        balAfter = await token.balanceOf(
            lendingContract.address
        );

        diffUser = balBeforeUser.sub(
            balAfterUser
        );

        diff = balAfter.sub(
            balBefore
        );

        assert.equal(
            diffUser.toString(),
            diff.toString()
        );

        assert.equal(
            diff.toString(),
            paymentAmount.toString()
        );
    }
}

// Arguments: address user, uint256 amounts, bool exactTokens, object lendingContract, object isolationPool,
// object Token, object Helpers
withdrawTokensIsolation = async ( inputParam = {}) => {

    let balAfter;
    let balAfterUser;

    let diff;
    let diffUser;

    // bravo!
    const collateralToken = await inputParam
        .isolationPool
        .COLLATERAL_TOKEN_ADDRESS();

    // bravo! (continue same!)
    const token = await inputParam.Token.at(
        collateralToken
    );

    for (index = 0; index < inputParam.user.length; index++) {

        // you can add references to avoid complex-deep property lookup
        const userAddress = inputParam.user[index];
        const paymentAmount = inputParam.amounts[index];
        const lendingContract = inputParam.lendingContract;
        const isolationPool = inputParam.isolationPool;

        const balBeforeUser = await token.balanceOf(
            userAddress
        );

        const balBefore = await token.balanceOf(
            lendingContract.address
        );

        if (inputParam.exactTokens[index] == true) {

            await isolationPool.withdrawExactAmount(
                paymentAmount,
                {
                    from: userAddress
                }
            );

            balAfterUser = await token.balanceOf(
                userAddress
            );

            balAfter = await token.balanceOf(
                lendingContract.address
            );

            diffUser = balAfterUser.sub(
                balBeforeUser
            );

            diff = balBefore.sub(
                balAfter
            );

            assert.equal(
                diffUser.toString(),
                diff.toString()
            );

            assert.equal(
                diff.toString(),
                paymentAmount.toString()
            );

        } else {

            await takeSnapshot(
                inputParam.Helpers
            );

            await lendingContract.syncManually(
                collateralToken
            );

            // const maxAmount = false;

            sharesIntoToken = await lendingContract.cashoutAmount(
                collateralToken,
                paymentAmount
                // maxAmount
            );

            const maxShareUser = await lendingContract.getPositionLendingShares(
                userAddress,
                collateralToken
            )

            if (maxShareUser < paymentAmount) {

                console.log(`
                    Not enough share. Exit tests...
                `);

                process.exit(1);
            }

            await snapshot.restore();

            await isolationPool.withdrawExactShares(
                paymentAmount,
                {
                    from: userAddress
                }
            );

            balAfterUser = await token.balanceOf(
                userAddress
            );

            balAfter = await token.balanceOf(
                lendingContract.address
            );

            diffUser = balAfterUser.sub(
                balBeforeUser
            );

            diff = balBefore.sub(
                balAfter
            );

            assert.equal(
                diffUser.toString(),
                diff.toString()
            );

            assert.equal(
                diff.toString(),
                sharesIntoToken.toString()
            );
        }
    }
}

// Arguments: address[] user, uint256 value, bool debtRatio, object lendingContract, object isolationPool, object Token
borrowTokensIsolation = async ( inputParam = {}) => {

    let balAfterUser;
    let balAfter;

    let diff;
    let diffUser;

    const borrowTokenNumber = await inputParam
        .isolationPool
        .borrowTokenNumber();

    let borrowTokenAddresses = new Array(
        borrowTokenNumber
    );

    let balBeforeUser = new Array(
        borrowTokenNumber
    );

    let balBefore = new Array(
        borrowTokenNumber
    );

    let borrowToken = new Array(
        borrowTokenNumber
    );

    for (j = 0; j < borrowTokenNumber; j++){

        borrowTokenAddresses[j] = await inputParam
            .isolationPool
            .borrowTokenAddresses(j);

        borrowToken[j] = await inputParam.Token.at(
            borrowTokenAddresses[j]
        );
    }

    for (index = 0; index < inputParam.user.length; index++) {

        const user = inputParam.user[index];
        const value = inputParam.value[index];

        const lendingContract = inputParam.lendingContract;
        const isolationPool = inputParam.isolationPool;

        for (j = 0; j < borrowTokenNumber; j++) {

            balBeforeUser[j] = await borrowToken[j].balanceOf(
                user
            );

            balBefore[j] = await borrowToken[j].balanceOf(
                lendingContract.address
            );
        }

        if (inputParam.debtRatio[index] == true) {

            await isolationPool.borrowExactDebtRatio(
                value,
                {
                    from: user
                }
            );

        } else {

            await isolationPool.borrowExactUSD(
                value,
                {
                    from: user
                }
            );
        }

        for (j = 0; j < borrowTokenNumber; j++) {

            balAfterUser = await borrowToken[j].balanceOf(
                user
            );

            balAfter = await borrowToken[j].balanceOf(
                lendingContract.address
            );

            diff = balBefore[j].sub(
                balAfter
            );

            diffUser = balAfterUser.sub(
                balBeforeUser[j]
            );

            assert.equal(
                diffUser.toString(),
                diff.toString()
            );
        }
    }
}

// Arguments: address[] user, uint256[] value, bool[] debtRatio, bool[] paybackAll, object lendingContract, object isolationPool
// object Token
paybackTokensIsolation = async ( inputParam = {}) => {

    let balAfterUser;
    let balAfter;

    let diff;
    let diffUser;
    let sharesAfter;

    const borrowTokenNumber = await inputParam
        .isolationPool
        .borrowTokenNumber();

    let borrowTokenAddresses = new Array(
        borrowTokenNumber
    );

    let balBeforeUser = new Array(
        borrowTokenNumber
    );

    let balBefore = new Array(
        borrowTokenNumber
    );

    let borrowToken = new Array(
        borrowTokenNumber
    );

    for (j = 0; j < borrowTokenNumber; j++){

        borrowTokenAddresses[j] = await inputParam
            .isolationPool
            .borrowTokenAddresses(j);

        borrowToken[j] = await inputParam.Token.at(
            borrowTokenAddresses[j]
        );
    }

    for (index = 0; index < inputParam.user.length; index++) {

        const userAddress = inputParam.user[index];
        const paymentValue = inputParam.value[index];

        const lendingContract = inputParam.lendingContract;
        const isolationPool = inputParam.isolationPool;

        for (j = 0; j < borrowTokenNumber; j++) {

            balBeforeUser[j] = await borrowToken[j].balanceOf(
                userAddress
            );

            balBefore[j] = await borrowToken[j].balanceOf(
                lendingContract.address
            );
        }

        if (inputParam.paybackAll[index] == false) {

            if (inputParam.debtRatio[index] == true) {

                await isolationPool.paybackExactDebtratio(
                    paymentValue,
                    {
                        from: userAddress
                    }
                );

            } else {

                await isolationPool.paybackExactUSD(
                    paymentValue,
                    {
                        from: userAddress
                    }
                );
            }

        } else {

            await isolationPool.paybackAll(
                {
                    from: userAddress
                }
            );

            for (j = 0; j < borrowTokenNumber; j++) {

                sharesAfter = await lendingContract.getPositionBorrowShares(
                    userAddress,
                    borrowTokenAddresses[j]
                );

                assert.equal(
                    sharesAfter.toString(),
                    "0"
                );
            }
        }

        for (j = 0; j < borrowTokenNumber; j++) {

            balAfterUser = await borrowToken[j].balanceOf(
                userAddress
            );

            balAfter = await borrowToken[j].balanceOf(
                lendingContract.address
            );

            diff = balAfter.sub(
                balBefore[j]
            );

            diffUser = balBeforeUser[j].sub(
                balAfterUser
            );

            assert.equal(
                diffUser.toString(),
                diff.toString()
            );
        }
    }
}

// Arguments: uint256 time, address[] poolTokens, object Time, object lendingContract
generateFees = async (inputParam = {}) => {

    await inputParam.Time.increase(
        inputParam.timeintervall
    );

    for (index = 0; index < inputParam.poolTokens.length; index++) {

        await inputParam.lendingContract.syncManually(
            inputParam.poolTokens[index].address
        );
    }
}

createToken = async (_data) => {

    const buffer = await _data.Token.new(
        _data.dec,
        _data.user
    );

    const bufferOracle = await _data.Chainlink.new(
        _data.value,
        8
    );

    await _data.OracleHub.addOracle(
        buffer.address,
        bufferOracle.address,
        []
    );

    return {
        token: buffer,
        oracle: bufferOracle
    }
}

// Arguments: uint256[] amounts, address[] tokens, address[] sender, address[] receiver, object Token
transferTokens = async (inputParam = {}) => {

    let balBefore;
    let balAfter;
    let diff;
    let token;

    // if this would be done through array of object we could use simpler construction
    // instead we could use .forEach() or .map() functions
    for (index = 0; index < inputParam.tokens.length; index++) {

        const receiver = inputParam.receiver[index];
        const tokeInput = inputParam.tokens[index];
        const amount = inputParam.amounts[index];
        const sender = inputParam.sender[index];

        token = await inputParam.Token.at(
            tokeInput.address
        );

        balBefore = await token.balanceOf(
            receiver
        );

        await token.transfer(
            receiver,
            amount,
            {
                from: sender
            }
        );

        balAfter = await token.balanceOf(
            receiver
        );

        diff = balAfter.sub(
            balBefore
        );

        assert.equal(
            diff.toString(),
            amount.toString()
        );
    }
}

// Arguments: address[] tokenAddress, address[] user, address[] approveContracts, instance Token
approveTokens = async (_LendingContract, _approveData) => {

    _approveData.map(async (data) => {

        if (data.type == "borrow") {

            await _LendingContract.approve(
                data.contract.address,
                data.Token.address,
                HUGE_AMOUNT,
                {
                    from: data.user
                }
            );
        }

        if (data.type == "withdraw") {

            await _LendingContract.approve(
                data.contract.address,
                data.Token.address,
                HUGE_AMOUNT,
                {
                    from: data.user
                }
            );
        }

        if (data.type == "normal") {

            await data.Token.approve(
                data.contract.address,
                HUGE_AMOUNT,
                {
                    from: data.user
                }
            );
        }
    });
}

// Arguments: uint256 decimals, uint256 value, object Token, object Oracle
createTokenWithOracle = async (inputParam = {}) => {

    const number = inputParam.decimals.length;

    let oracle = new Array(number);
    let token = new Array(number);

    for (index = 0; index < number; index++) {

        const user = inputParam.user[index];

        token[index] = await inputParam.Token.new(
            {
                from: user
            }
        );

        await token[index].setDecimals(
            inputParam.decimals[index]
        );

        oracle[index] = await inputParam.Oracle.new(
            inputParam.usdValue[index],
            8
        );
    }

    // should be object
    return [
        token,
        oracle
    ];
}

// Arguments: address paybackToken, address receiveToken, address user, address liquidator, uint256 percent, object lendingContract, object liquidationContract
liquidateNormal = async (_liquidationData = {}) => {

    const user = _liquidationData.user;
    const liquidator = _liquidationData.liquidator;

    const nftIdUser = _liquidationData.nftIdUser;
    const nftIdLiquidator = _liquidationData.nftIdLiquidator;

    const paybackToken = _liquidationData.paybackToken;
    const paybackTokenAddress = paybackToken.address;

    const receiveToken = _liquidationData.receiveToken;

    const liquidationContract = _liquidationData.liquidationContract;
    const lendingContract = _liquidationData.lendingContract;
    const wiseSecurityContract = _liquidationData.WiseSecurity;
    const helper = _liquidationData.Helper;

    const percent = inputParam.percent;

    const borrowShares = await lendingContract.getPositionBorrowShares(
        nftIdUser,
        paybackTokenAddress
    );

    const paybackShares = borrowShares
        .mul(Bn(percent))
        .div(Bn(toWei("1")));

    await takeSnapshot(
        helper
    );

    await lendingContract.syncManually(
        paybackTokenAddress
    );

    const paybackTokenAmount = await lendingContract.paybackAmount(
        paybackTokenAddress,
        paybackShares
    );

    const balLiquidatorBefore = await paybackToken.balanceOf(
        liquidator
    );

    const debtBefore = await wiseSecurityContract.getLiveDebtRatio(
        nftIdUser
    );

    await snapshot.restore();

    await paybackToken.approve(
        liquidationContract.address,
        HUGE_AMOUNT,
        {
            from: liquidator
        }
    );

    await liquidationContract.liquidatePartiallyFromTokens(
        nftIdUser,
        nftIdLiquidator,
        paybackTokenAddress,
        receiveToken.address,
        paybackShares,
        {
            from: liquidator
        }
    );

    const balLiquidatorAfter = await paybackToken.balanceOf(
        liquidator
    );

    const diff = balLiquidatorBefore.sub(
        balLiquidatorAfter
    );

    const debtAfter = await wiseSecurityContract.getLiveDebtRatio(
        user
    );

    assert.isAbove(
        parseInt(debtBefore),
        parseInt(debtAfter)
    );

    const diffPayback = Math.abs(
        diff.sub(Bn(paybackTokenAmount)));

    const diffBool= await inBound(
        diffPayback,
        paybackToken
    );

    assert.equal(
        diffBool.toString(),
        "true"
    );
}

// Arguments: bool usdValue, address user, address liquidator, uint256 percent, object isolationContract, object liquidationContract
liqudateIsolationPool = async (inputParam = {}) => {

    let value;
    let diff;
    let portion;
    let addresses;
    let balAfterUser;

    const isolationContract = inputParam.isolationContract;
    const wiseSecurityContract = inputParam.WiseSecurity;

    const borrowTokenNumber = await isolationContract.borrowTokenNumber()

    let paybackTokenAmounts = new Array(
        borrowTokenNumber
    );

    let usdValueToken = new Array(
        borrowTokenNumber
    );

    let balBeforeUser = new Array(
        borrowTokenNumber
    );

    let Token = new Array(
        borrowTokenNumber
    );

    if (inputParam.usdValue == false) {

        await takeSnapshot(
            inputParam.helpers
        );

        await isolationContract.prepareBorrows();

        const borrowUSD = await isolationContract.getTotalBorrowUSD(
            inputParam.user
        );

        value = borrowUSD
            .mul(Bn(inputParam.percent))
            .div(Bn(toWei("1")));

        await snapshot.restore();

    } else {
        value = inputParam.value
    }

    for (j = 0; j < borrowTokenNumber; j++) {

        portion = await isolationContract.portionTotalBorrow(j);
        addresses = await isolationContract.borrowTokenAddresses(j);

        usdValueToken[j] = Bn(value)
            .mul(Bn(portion))
            .div(Bn(toWei("1")));

        paybackTokenAmounts[j] = await inputParam.oracle.getTokensFromUSD(
            addresses,
            usdValueToken[j]
        );

        Token[j] = await inputParam.Token.at(
            addresses
        );

        balBeforeUser[j] = await Token[j].balanceOf(
            inputParam.liquidator
        );
    }

    const debtBefore = await wiseSecurityContract.getLiveDebtRatio(
        inputParam.user
    );

    for (j = 0; j < borrowTokenNumber; j++) {
        await Token[j].approve(
            isolationContract.address,
            paybackTokenAmounts[j],
            {
                from: inputParam.liquidator
            }
        );
    }

    await isolationContract.liquidationUSDAmount(
        inputParam.user,
        value,
        {
            from: inputParam.liquidator
        }
    );

    const debtAfter = await wiseSecurityContract.getLiveDebtRatio(
        inputParam.user
    );

    for (j = 0; j < borrowTokenNumber; j++) {

        balAfterUser = await Token[j].balanceOf(
            inputParam.liquidator
        );

        diff = balBeforeUser[j].sub(
            balAfterUser
        );

        assert.equal(
            diff.toString(),
            paybackTokenAmounts[j].toString()
        );
    }

    assert.isAbove(
        parseInt(debtBefore),
        parseInt(debtAfter)
    );
}

// Arguments: object[] oracles, object isolationPool, object lendingContract, object Helpers
const getUSDValueBorrowIsolationPool = async (inputParam = {}) => {

    const lendingContract = inputParam.lendingContract;

    const borrowTokenNumber = await inputParam
        .isolationPool
        .borrowTokenNumber();

    let borrowTokenAddresses = new Array(
        borrowTokenNumber
    );

    borrowTokenAddresses = await inputParam
        .isolationPool
        .borrowTokenAddresses();

    let usdValue;
    let shares;
    let token;

    await takeSnapshot(inputParam.Helpers);

    for (index = 0; index < borrowTokenNumber; index++) {

        const oracle = inputParam.oracles[index];

        shares = await lendingContract.getPositionBorrowShares(
            inputParam.user,
            borrowTokenAddresses[index]
        );

        await lendingContract.syncManually(
            borrowTokenAddresses[index]
        );

        token = await lendingContract.paybackAmount(
            borrowTokenAddresses[index],
            shares
        );

        usdValue += oracle.getTokensInUSD(
            borrowTokenAddresses[index],
            token
        );
    }

    await snapshot.restore();

    return usdValue;
}

// Arguemtns: address[] tokenAddresses, address[] oracleAddresses, address owner, address gouvernace, bool[] allowBorrows,
// address[]curvePools, address[] curveMetaPools, uint256[] mulFactors, uint256[] collateralFactors, uint256[] maxDepositAmounts,
// uint256[] borrowPercCaps
setUpContracts = async (inputParam = {}) => {

    // this is WETH on mainnet - we can do this dynamically
    // @TODO: we can try to deploy WETH contract locally if needed

    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const AAVE_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";

    const ETH_PRICE_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
    const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

    const wiseOracleHub = await inputParam.OracleHub.new(
        WETH_ADDRESS,
        ETH_PRICE_FEED,
        UNISWAP_V3_FACTORY
    );

    await wiseOracleHub.setHeartBeat(
        await wiseOracleHub.ETH_USD_PLACEHOLDER(),
        toWei("1")
    );

    const positionNFT = await inputParam.PositionNFT.new(
        "PositionsNFTs",
        "POSNFTS",
        "app.wisetoken.net/json-data/nft-data/"
    );

    const borrowCap = inputParam.borrowCap;
    const lendingMaster = inputParam.owner;
    const lendingContract = inputParam.Lending;
    const securityContract = inputParam.WiseSecurity;
    // const governance = inputParam.gouvernance;
    const feeContract = inputParam.FeeManager;
    // const liquidationContract = inputParam.Liquidation;
    const aaveHubContract = inputParam.AaveHub;

    const wiseOracleHubAddress = wiseOracleHub.address;
    const nftContractAddress = positionNFT.address;

    const lending = await lendingContract.new(
        lendingMaster,
        wiseOracleHubAddress,
        nftContractAddress
    );

    const lendingAddress = lending.address;

    const aaveHub = await aaveHubContract.new(
        lendingMaster,
        AAVE_ADDRESS,
        lendingAddress
    );

    const aaveHubAddress = aaveHub.address;

    const wiseSecurity = await securityContract.new(
        lendingMaster,
        lendingAddress,
        aaveHubAddress
    );

    const wiseSecurityAddress = wiseSecurity.address;

    await aaveHub.setWiseSecurity(
        wiseSecurityAddress
    )

    await lending.setSecurity(
        wiseSecurityAddress
    );

    const feeManagerAddress = await wiseSecurity.FEE_MANAGER();

    const feeManager = await feeContract.at(
        feeManagerAddress
    );

    await expectRevert(
        positionNFT.forwardFeeManagerNFT(
            ZERO_ADDRESS
        ),
        "ERC721: transfer to the zero address"
    );

    await positionNFT.forwardFeeManagerNFT(
        feeManagerAddress
    );

    await expectRevert(
        positionNFT.forwardFeeManagerNFT(
            feeManagerAddress
        ),
        "NotPermitted()"
    );

    return {
        lending: lending,
        oracleHub: wiseOracleHub,
        liquidation: lending,
        feeManager: feeManager,
        security: wiseSecurity,
        nft: positionNFT,
        aaveHub: aaveHub
    };
}

addPools = async (_Lending, _poolData) => {

    const emptyStructToken = {
        curvePoolTokenIndexFrom: 0,
        curvePoolTokenIndexTo: 0,
        curveMetaPoolTokenIndexFrom: 0,
        curveMetaPoolTokenIndexTo: 0
    };

    const emptyStructData = {
        curvePool: ZERO_ADDRESS,
        curveMetaPool: ZERO_ADDRESS,
        swapBytesPool: [],
        swapBytesMeta: []
    }

    await Promise.all(_poolData.map(async (data) => {

        await _Lending.createPool(
            {
                allowBorrow: data.allowBorrow,
                poolToken: data.poolToken.address,
                poolMulFactor: data.mulFactor,
                poolCollFactor: data.collFactor,
                maxDepositAmount: data.maxDeposit
            }
        );
    }));

    await advanceTimeAndBlock(
        60 * 60 * 24 * 30
    );
}

addPoolsCurve = async (_Lending, _poolData) => {

    await Promise.all(_poolData.map(async (data) => {

        const securityStructToken = {
            curvePoolTokenIndexFrom: data.curveIndexFrom,
            curvePoolTokenIndexTo: data.curveIndexTo,
            curveMetaPoolTokenIndexFrom: data.curveMetaIndexFrom,
            curveMetaPoolTokenIndexTo: data.curveMetaIndexTo
        };

        const securityStructData = {
            curvePool: data.curvePool.address,
            curveMetaPool: data.curveMetaPool.address,
            swapBytesPool: data.swapBytesPool,
            swapBytesMeta: data.swapBytesMeta
        }

        await _Lending.createCurvePool(
            {
                allowBorrow: data.allowBorrow,
                poolToken: data.poolToken.address,

                poolMulFactor: data.mulFactor,
                poolCollFactor: data.collFactor,
                maxDepositAmount: data.maxDeposit
            },
            {
                curveSecuritySwapsToken: securityStructToken,
                curveSecuritySwapsData: securityStructData
            }
        );
    }));
}

// Arguments: address collateralToken, uint256 collateralFactor, uint256 borrowPercCap, address[] borrowTokens, uint256[] weightBorrowTokens,
// object lendingContract, object liquidation, object oracleHub, object IsolationContract
setUpIsolationPool = async (_isolationPoolData) => {

    const stableIsolationPool = await _isolationPoolData.isolationContract.new(
        _isolationPoolData.oracleHub.address,
        _isolationPoolData.lendingContract.address,
        _isolationPoolData.liquidation.address,
        _isolationPoolData.collateralToken.address,
        _isolationPoolData.wiseSecurity.address,
        _isolationPoolData.collateralFactor,
        // _isolationPoolData.borrowPercCap,
        _isolationPoolData.borrowTokens,
        _isolationPoolData.weights
    );

    await _isolationPoolData.lendingContract.setVerifiedIsolationPool(
        stableIsolationPool.address,
        true
    );

    return stableIsolationPool
}

// Arguments: address aaveAddress, object[] tokens, object[] aaveTokens, object lendingContract, object aaveSecondLayer
setUpAavePools = async (
    _AaveSecondLayer,
    _lendingAddress,
    _aaveAddress,
    _tokens
) => {

    const aaveScondLayer = await _AaveSecondLayer.new(
        _aaveAddress,
        _lendingAddress
    );

    await Promise.all(_feeData.map(async (data) => {

        await aaveScondLayer.setAaveTokenAddress(
            _tokens.tokens.address,
            _tokens.aaveTokens.address
        );

    }));

    return aaveScondLayer;
}

// Arguments: object Token (FOR ETH MAIN: WETH, WBTC, LINK, USDC, USDT)
getAaveTokenETH = async (_Token) => {

    const aUSDC = await _Token.at(
        "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c"
    );

    const aUSDT = await _Token.at(
        "0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a"
    );

    const aWETH = await _Token.at(
        "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8"
    );

    const aWBTC = await _Token.at(
        "0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8"
    );

    const aLINK = await _Token.at(
        "0x5E8C8A7243651DB1384C0dDfDbE39761E8e7E51a"
    );

    return {
        aWETH,
        aWBTC,
        aLINK,
        aUSDC,
        aUSDT
    };
}

// Arguments: object Token (FOR ETH MAIN: WETH, WBTC, LINK, USDC, USDT)
getTokenETH = async (_Token) => {

    const USDC = await _Token.at(
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    );

    const USDT = await _Token.at(
        "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    );

    const WETH = await _Token.at(
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );

    const WBTC = await _Token.at(
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
    );

    const LINK = await _Token.at(
        "0x514910771AF9Ca656af840dff83E8264EcF986CA"
    );

    return {
        WETH,
        WBTC,
        LINK,
        USDC,
        USDT
    };
}

// (FOR ETH MAIN: WETH, WBTC, LINK, USDC, USDT)
getChainlinkAddressETH = async () => {

    // USD Equivalent
    // const chainlinkUSDC = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";
    // const chainlinkUSDT = "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D";
    // const chainlinkWETH = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
    // const chainlinkWBTC = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c";
    // const chainlinkLINK = "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c";

    // ETH Equivalent
    const chainlinkUSDC = "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4";
    const chainlinkUSDT = "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46";
    const chainlinkWBTC = "0xdeb288f737066589598e9214e782fa5a8ed689e8";
    // const chainlinkLINK = "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c";

    // should be object
    return {
        chainlinkUSDC,
        chainlinkUSDT,
        // chainlinkWETH,
        chainlinkWBTC,
        // chainlinkLINK
    };
}

// Arguements: uint256[] price, object[] oracle
manipulatePrices = async (inputParam = {}) => {

    for (index = 0; index < inputParam.oracles.length; index++) {
        await inputParam.oracles[index].setValue(
            inputParam.price[index]
        );
    }
}

// Arguments: address user, address whaleAddress, address tokenAddress, object Web3, object Ethers, object Token, object Helpers
getTokenFromWhale = async (inputParams = {}) => {

    const whaleAddress = inputParams.whaleAddress;

    const token = await inputParams.Token.at(
        inputParams.tokenAddress.address
    );

    const currencyEthers = await inputParams.Ethers.getContractAt(
        "contracts/InterfaceHub/IERC20.sol:IERC20",
        token.address
    );

    await inputParams.Helpers.impersonateAccount(
        whaleAddress
    );

    const impersonatedSigner = await inputParams.Ethers.getSigner(
        whaleAddress
    );

    const currencyBalanceWhale = await token.balanceOf(
        whaleAddress
    );

    let currencyBal = await inputParams.Ethers.utils.parseUnits(
        currencyBalanceWhale.toString(),
        0
    );

    await currencyEthers.connect(impersonatedSigner).transfer(
        inputParams.user,
        currencyBal
    );

    const balUserEnd = await token.balanceOf(
        inputParams.user
    );

    console.log(
        ` ${inputParams.user} has following number of tokens: ${balUserEnd}`
    );
}

module.exports = {
    depositTokens,
    borrowToken,
    generateFees,
    transferTokens,
    liquidateNormal,
    manipulatePrices,
    setUpIsolationPool,
    setUpContracts,
    getUSDValueBorrowIsolationPool,
    createTokenWithOracle,
    approveTokens,
    paybackTokensIsolation,
    borrowTokensIsolation,
    depositTokensIsolation,
    withdrawTokensIsolation,
    paybackTokensAave,
    borrowTokensAave,
    withdrawTokensAave,
    depositTokensAave,
    paybackToken,
    withdrawTokens,
    takeSnapshot,
    getTokenFromWhale
}
