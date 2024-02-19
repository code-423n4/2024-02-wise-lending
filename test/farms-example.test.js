const Token = artifacts.require("TestToken");
const Farm = artifacts.require("SimpleFarm");
const { expectRevert, time } = require('@openzeppelin/test-helpers');

require("./utils");

const _BN = web3.utils.BN;
const BN = (value) => {
    return new _BN(value)
}

const tokens = (value) => {
    return web3.utils.toWei(value);
}

const ONE_TOKEN = tokens("1");
const TWO_TOKENS = tokens("2");

const MAX_VALUE = BN(2)
    .pow(BN(256))
    .sub(BN(1));

const getLastEvent = async (eventName, instance) => {
    const events = await instance.getPastEvents(eventName, {
        fromBlock: 0,
        toBlock: "latest",
    });
    return events.pop().returnValues;
};

contract("SimpleFarm", ([owner, alice, bob, chad, random]) => {

    const setupScenario = async (inputParams = {}) => {

        stakeToken = await Token.new();
        rewardToken = await Token.new();

        defaultApprovalAmount = 100;
        defaultDurationInSeconds = 300;

        farm = await Farm.new(
            stakeToken.address,
            rewardToken.address,
            defaultDurationInSeconds
        );

        if (inputParams.approval) {

            const approvalAmount = tokens(
                defaultApprovalAmount.toString()
            );

            await stakeToken.approve(
                farm.address,
                approvalAmount
            );

            await rewardToken.approve(
                farm.address,
                approvalAmount
            );
        }

        if (inputParams.deposit) {
            await farm.farmDeposit(
                inputParams.deposit
            );
        }

        if (inputParams.rate) {
            await farm.setRewardRate(
                inputParams.rate
            );
        }

        return {
            stakeToken,
            rewardToken,
            farm
        }
    }

    describe("Farm initial values", () => {

        beforeEach(async () => {
            const result = await setupScenario();
            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;
        });

        it("should have correct farm name", async () => {
            const name = await farm.name();
            assert.equal(
                name,
                "VerseFarm"
            );
        });

        it("should have correct farm symbol", async () => {
            const symbol = await farm.symbol();
            assert.equal(
                symbol,
                "VFARM"
            );
        });

        it("should have correct farm decimals", async () => {
            const decimals = await farm.decimals();
            assert.equal(
                decimals,
                18
            );
        });

        it("should have correct farm supply", async () => {

            const defaultSupplyValue = await farm.totalSupply();
            const expectedDefaultValue = 0;

            assert.equal(
                defaultSupplyValue,
                expectedDefaultValue
            );
        });

        it("should return receipt balance for the given account", async () => {

            const defaultBalance = await farm.balanceOf(
                owner
            );

            const expectedDefaultBalance = 0;

            assert.equal(
                defaultBalance,
                expectedDefaultBalance
            );
        });

        it("should return the correct allowance for the given spender", async () => {

            const defaultAllowance = await farm.allowance(
                owner,
                bob
            );

            const expectedDefaultAllowance = 0;

            assert.equal(
                defaultAllowance,
                expectedDefaultAllowance
            );
        });

        it("should have correct staking token address", async () => {

            const stakeTokenValue = await farm.stakeToken();

            assert.equal(
                stakeTokenValue,
                stakeToken.address
            );
        });

        it("should have correct reward token address", async () => {

            const rewardTokenValue = await farm.rewardToken();

            assert.equal(
                rewardTokenValue,
                rewardToken.address
            );
        });

        it("should have correct owner address", async () => {

            const ownerAddress = await farm.ownerAddress();

            assert.equal(
                ownerAddress,
                owner
            );
        });

        it("should have correct manager address", async () => {

            const managerAddress = await farm.managerAddress();

            assert.equal(
                managerAddress,
                owner
            );
        });

        it("should have correct perTokenStored value", async () => {

            const perTokenStored = await farm.perTokenStored();
            const expectedDefaultValue = 0;

            assert.equal(
                perTokenStored,
                expectedDefaultValue
            );
        });

        it("should have correct lastUpdateTime value", async () => {

            const lastUpdateTime = await farm.lastUpdateTime();
            const expectedDefaultValue = 0;

            assert.equal(
                lastUpdateTime,
                expectedDefaultValue
            );
        });

        it("should have correct duration value", async () => {

            const defaultDurationValue = await farm.rewardDuration();

            assert.equal(
                defaultDurationValue,
                defaultDurationInSeconds
            );
        });

        it("should not be able to deploy with wrong default duration value", async () => {

            const invalidDuration = 0;
            const correctDuration = 1;

            await expectRevert(
                Farm.new(
                    stakeToken.address,
                    rewardToken.address,
                    invalidDuration
                ),
                "SimpleFarm: INVALID_DURATION"
            );

            await Farm.new(
                stakeToken.address,
                rewardToken.address,
                correctDuration
            );

            assert.isAbove(
                correctDuration,
                invalidDuration
            );
        });
    });

    describe("Duration initial functionality", () => {

        beforeEach(async () => {
            const result = await setupScenario({
                approval: true
            });
            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;
        });

        it("should be able to change farm duration value", async () => {

            const defaultDuration = await farm.rewardDuration();
            const expectedDefaultDuration = defaultDurationInSeconds;
            const newDurationValueIncrease = 600;
            const newDurationValueDecrease = 100;

            assert.equal(
                defaultDuration,
                expectedDefaultDuration
            );

            assert.isAbove(
                newDurationValueIncrease,
                parseInt(defaultDuration)
            );

            assert.isBelow(
                newDurationValueDecrease,
                parseInt(defaultDuration)
            );

            await farm.setRewardDuration(
                newDurationValueDecrease
            );

            const durationValueDecreased = await farm.rewardDuration();

            assert.equal(
                durationValueDecreased,
                newDurationValueDecrease
            );

            assert.isBelow(
                parseInt(durationValueDecreased),
                parseInt(defaultDuration)
            );

            await farm.setRewardDuration(
                newDurationValueIncrease
            );

            const durationValueIncreased = await farm.rewardDuration();

            assert.equal(
                durationValueIncreased,
                durationValueIncreased
            );

            assert.isAbove(
                parseInt(durationValueIncreased),
                parseInt(defaultDuration)
            );
        });

        it("should be able to change farm duration value only by manager", async () => {

            const newDurationValue = 10;
            const actualManager = await farm.managerAddress();
            const wrongManager = bob;
            const correctManager = owner;

            await expectRevert(
                farm.setRewardDuration(
                    newDurationValue,
                    {
                        from: wrongManager
                    }
                ),
                "SimpleFarm: INVALID_MANAGER"
            );

            assert.notEqual(
                wrongManager,
                actualManager
            );

            await farm.setRewardDuration(
                newDurationValue,
                {
                    from: correctManager
                }
            );

            assert.equal(
                correctManager,
                actualManager
            );

            const durationValueChanged = await farm.rewardDuration();

            assert.equal(
                durationValueChanged,
                newDurationValue
            );
        });

        it("should not be able to change farm duration value to 0", async () => {

            const defaultDuration = await farm.rewardDuration();
            const expectedDefaultDuration = defaultDurationInSeconds;

            assert.equal(
                defaultDuration,
                expectedDefaultDuration
            );

            const newDurationWrongValue = 0;
            const newDurationRightValue = 1;

            await expectRevert(
                farm.setRewardDuration(
                    newDurationWrongValue
                ),
                "SimpleFarm: INVALID_DURATION"
            );

            await farm.setRewardDuration(
                newDurationRightValue
            );

            assert.isAbove(
                newDurationRightValue,
                newDurationWrongValue
            );
        });

        it("should not be able to change farm duration during distribution", async () => {

            const defaultDuration = await farm.rewardDuration();
            const expectedDefaultDuration = defaultDurationInSeconds;
            const newDurationWrongValue = 100;

            assert.equal(
                defaultDuration,
                expectedDefaultDuration
            );

            await farm.farmDeposit(
                10
            );

            await farm.setRewardRate(
                10
            );

            await expectRevert(
                farm.setRewardDuration(
                    newDurationWrongValue
                ),
                "SimpleFarm: ONGOING_DISTRIBUTION"
            );

            await time.increase(
                defaultDuration + 1
            );

            await farm.setRewardDuration(
                newDurationWrongValue
            );

            const newDuration = await farm.rewardDuration();

            assert.equal(
                newDuration,
                newDurationWrongValue
            );
        });
    });

    describe("Reward allocation initial functionality by manager", () => {

        beforeEach(async () => {

            const result = await setupScenario({
                approval: true
            });

            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;
        });

        it("should not be able to set rate to 0", async () => {

            await farm.farmDeposit(
                ONE_TOKEN
            );

            await expectRevert(
                farm.setRewardRate(
                    0
                ),
                "SimpleFarm: INVALID_RATE"
            );

            await farm.setRewardRate(
                1
            );
        });

        it("should correctly set the periodFinished date value", async () => {

            const initialPeriod = await farm.periodFinished();
            const expectedDuration = await farm.rewardDuration();
            const initialRate = 10;
            const expectedInitialValue = 0;

            assert.equal(
                initialPeriod,
                expectedInitialValue
            );

            await farm.farmDeposit(
                ONE_TOKEN
            );

            await farm.setRewardRate(
                initialRate
            );

            const initialTimestamp = await rewardToken.timestamp();
            const valueAfterChange = await farm.periodFinished();

            assert.isAbove(
                parseInt(valueAfterChange),
                parseInt(initialPeriod)
            );

            assert.equal(
                parseInt(valueAfterChange),
                parseInt(initialTimestamp) + parseInt(expectedDuration)
            );
        });

        it("should increase perTokenStored value", async () => {

            const perTokenStoredDefault = await farm.perTokenStored();
            const expectedDefaultValue = 0;
            const initialRate = 10;

            assert.equal(
                perTokenStoredDefault,
                expectedDefaultValue
            );

            await farm.farmDeposit(
                ONE_TOKEN
            );

            await farm.setRewardRate(
                initialRate
            );

            await time.increase(
                1
            );

            await farm.farmDeposit(
                ONE_TOKEN
            );

            const perTokenStoredNew = await farm.perTokenStored();

            assert.isAbove(
                parseInt(perTokenStoredNew),
                parseInt(perTokenStoredDefault)
            );
        });

        it("should emit correct RewardAdded event", async () => {

            const initialRate = 10;
            const rewardDuration = await farm.rewardDuration();
            const expectedAmount = rewardDuration * initialRate;

            await farm.farmDeposit(
                ONE_TOKEN
            );

            await farm.setRewardRate(
                initialRate
            );

            const rewardEvent = await getLastEvent(
                "RewardAdded",
                farm
            );

            assert.equal(
                expectedAmount,
                rewardEvent.tokenAmount
            );
        });

        it("manager should be able to set rewards rate only if stakers exist", async () => {

            const newRewardRate = 10;
            const expectedNewRate = newRewardRate;

            await expectRevert(
                farm.setRewardRate(
                    newRewardRate
                ),
                "SimpleFarm: NO_STAKERS"
            );

            await farm.farmDeposit(
                ONE_TOKEN
            );

            await farm.setRewardRate(
                newRewardRate
            );

            const rateAfterChanged = await farm.rewardRate();

            assert.equal(
                rateAfterChanged,
                expectedNewRate
            );
        });

        it("manager should fund the farm during reward rate announcement", async () => {

            const newRewardRate = 10;
            const expectedDuration = await farm.rewardDuration();
            const currentManager = await farm.managerAddress();

            const expectedTransferAmount = newRewardRate
                * expectedDuration;

            const managerBalance = await rewardToken.balanceOf(
                currentManager
            );

            assert.isAbove(
                parseInt(managerBalance),
                expectedTransferAmount
            );

            await farm.farmDeposit(
                ONE_TOKEN
            );

            await farm.setRewardRate(
                newRewardRate
            );

            const transferData = await getLastEvent(
                "Transfer",
                rewardToken
            );

            assert.equal(
                transferData.from,
                currentManager
            );

            assert.equal(
                transferData.to,
                farm.address
            );

            assert.equal(
                transferData.value,
                expectedTransferAmount
            );

            const afterTransferManager = await rewardToken.balanceOf(
                currentManager
            );

            const afterTransferFarm = await rewardToken.balanceOf(
                farm.address
            );

            assert.equal(
                managerBalance,
                parseInt(afterTransferManager) + parseInt(expectedTransferAmount)
            );

            assert.equal(
                expectedTransferAmount,
                afterTransferFarm
            );
        });

        it("manager should be able to increase rate any time", async () => {

            const initialRate = 10;
            const increasedRewardRate = 11;

            assert.isAbove(
                increasedRewardRate,
                initialRate
            );

            await farm.farmDeposit(
                ONE_TOKEN
            );

            await farm.setRewardRate(
                initialRate
            );

            const rateBeforeChanged = await farm.rewardRate();

            assert.equal(
                rateBeforeChanged,
                initialRate
            );

            await farm.setRewardRate(
                increasedRewardRate
            );

            const rateAfterChanged = await farm.rewardRate();

            assert.equal(
                rateAfterChanged,
                increasedRewardRate
            );
        });

        it("manager should be able to decrease rate only after distribution finished", async () => {

            const initialRate = 10;
            const decreasedRewardRate = 9;

            assert.isBelow(
                decreasedRewardRate,
                initialRate
            );

            await farm.farmDeposit(
                ONE_TOKEN
            );

            await farm.setRewardRate(
                initialRate
            );

            const rateAfterChanged = await farm.rewardRate();

            assert.equal(
                rateAfterChanged,
                initialRate
            );

            await expectRevert(
                farm.setRewardRate(
                    decreasedRewardRate
                ),
                "SimpleFarm: RATE_CANT_DECREASE"
            );

            const currentDuration = await farm.rewardDuration();

            await time.increase(
                currentDuration
            );

            await farm.setRewardRate(
                decreasedRewardRate
            );

            const newRate = await farm.rewardRate();

            assert.equal(
                parseInt(newRate),
                decreasedRewardRate
            );
        });
    });

    describe("Deposit initial functionality", () => {

        beforeEach(async () => {

            const result = await setupScenario({
                approval: true
            });

            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;
        });

        it("should transfer correct amount from farmer to farm", async () => {

            const depositValue = ONE_TOKEN;
            const depositAddress = bob;

            await stakeToken.mint(
                depositValue,
                {
                    from: depositAddress
                }
            );

            //@TODO: test without approve
            await stakeToken.approve(
                farm.address,
                depositValue,
                {
                    from: depositAddress
                }
            );

            const balanceBefore = await stakeToken.balanceOf(
                depositAddress
            );

            await farm.farmDeposit(
                depositValue,
                {
                    from: depositAddress
                }
            );

            const balanceAfter = await stakeToken.balanceOf(
                depositAddress
            );

            assert.equal(
                parseInt(balanceAfter),
                parseInt(balanceBefore) - parseInt(depositValue)
            );
        });

        it("should increase the balance of the wallet thats deposits the tokens", async () => {

            const depositAmount = ONE_TOKEN;

            const supplyBefore = await farm.balanceOf(
                owner
            );

            await farm.farmDeposit(
                depositAmount,
                {
                    from: owner
                }
            );

            const supplyAfter = await farm.balanceOf(
                owner
            );

            assert.equal(
                parseInt(supplyAfter),
                parseInt(supplyBefore) + parseInt(depositAmount)
            );
        });

        it("should add the correct amount to the total supply", async () => {

            const supplyBefore = await farm.balanceOf(owner);
            const depositAmount = ONE_TOKEN;

            await farm.farmDeposit(
                depositAmount,
                {
                    from: owner
                }
            );

            const totalSupply = await farm.totalSupply();

            assert.equal(
                totalSupply.toString(),
                (BN(supplyBefore).add(BN(depositAmount))).toString()
            );
        });

        it("should not be able to deposit if not appored enough", async () => {

            const allowance = await stakeToken.allowance(
                owner,
                farm.address
            );

            const depositAmount = tokens("2000");

            assert.isAbove(
                parseInt(depositAmount),
                parseInt(allowance)
            );

            await expectRevert.unspecified(
                farm.farmDeposit(
                    depositAmount,
                    {
                        from: owner
                    }
                ),
                "SafeERC20: CALL_FAILED"
            );
        });
    });

    describe("Receipt token approve functionality", () => {

        beforeEach(async () => {

            const result = await setupScenario({
                approval: true,
                deposit: ONE_TOKEN
            });

            farm = result.farm;

        });

        it("should be able to increase allowance", async () => {

            const initialAllowance = await farm.allowance(
                owner,
                bob
            );
            const increaseValue = ONE_TOKEN;

            await farm.increaseAllowance(
                bob,
                increaseValue
            );

            const allowanceIncreased = await farm.allowance(
                owner,
                bob
            );

            assert.isAbove(
                parseInt(allowanceIncreased),
                parseInt(initialAllowance)
            );

            assert.equal(
                parseInt(allowanceIncreased),
                parseInt(initialAllowance) + parseInt(increaseValue)
            );
        });

        it("should be able to decrease allowance", async () => {

            await farm.approve(
                bob,
                ONE_TOKEN
            );

            const initialAllowance = await farm.allowance(
                owner,
                bob
            );

            const decreaseValue = ONE_TOKEN;

            await farm.decreaseAllowance(
                bob,
                decreaseValue
            );

            const allowanceDecreased = await farm.allowance(
                owner,
                bob
            );

            assert.isBelow(
                parseInt(allowanceDecreased),
                parseInt(initialAllowance)
            );

            assert.equal(
                parseInt(allowanceDecreased),
                parseInt(initialAllowance) - parseInt(decreaseValue)
            );
        });

        it("should not change allowance if its at maximum", async () => {

            const approvalValue = MAX_VALUE;
            const transferValue = ONE_TOKEN;

            await stakeToken.mint(
                transferValue,
                {
                    from: bob
                }
            );

            await stakeToken.approve(
                farm.address,
                approvalValue,
                {
                    from: bob
                }
            );

            await farm.farmDeposit(
                ONE_TOKEN,
                {
                    from: bob
                }
            );

            await farm.approve(
                bob,
                approvalValue
            );

            const allowanceValueBefore = await farm.allowance(
                owner,
                bob
            );

            assert.equal(
                MAX_VALUE.toString(),
                allowanceValueBefore.toString()
            );

            await farm.transferFrom(
                owner,
                alice,
                transferValue,
                {
                    from: bob
                }
            );

            const allowanceValueAfter = await farm.allowance(
                owner,
                bob
            );

            assert.equal(
                allowanceValueBefore.toString(),
                allowanceValueAfter.toString()
            );

            assert.equal(
                MAX_VALUE.toString(),
                allowanceValueAfter.toString()
            );
        });

        it("should revert if the sender has spent more than their approved amount", async () => {

            const approvedValue = ONE_TOKEN;
            const transferValue = TWO_TOKENS;
            const approvedWallet = alice;

            await farm.approve(
                approvedWallet,
                approvedValue
            );

            await expectRevert.unspecified(
                farm.transferFrom(
                    owner,
                    bob,
                    transferValue,
                    {
                        from: approvedWallet
                    }
                )
            );
        });
    });

    describe("Receipt token transfer functionality", () => {

        beforeEach(async () => {

            const result = await setupScenario({
                approval: true
            });

            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;

            defaultTokenAmount = TWO_TOKENS;

            await farm.farmDeposit(
                defaultTokenAmount
            );
        });

        it("should transfer correct amount from walletA to walletB", async () => {

            const transferValue = defaultTokenAmount;
            const balanceBefore = await farm.balanceOf(bob);

            await farm.transfer(
                bob,
                transferValue,
                {
                    from: owner
                }
            );

            const balanceAfter = await farm.balanceOf(bob);

            assert.equal(
                parseInt(balanceAfter),
                parseInt(balanceBefore) + parseInt(transferValue)
            );
        });

        it("should revert if not enough balance in the wallet", async () => {

            const balanceBefore = await farm.balanceOf(alice);

            await expectRevert.unspecified(
                farm.transfer(
                    bob,
                    parseInt(balanceBefore) + 1,
                    {
                        from: alice
                    }
                )
            );
        });

        it("should reduce wallets balance after transfer", async () => {

            const transferValue = defaultTokenAmount;
            const balanceBefore = await farm.balanceOf(owner);

            await farm.transfer(
                bob,
                transferValue,
                {
                    from: owner
                }
            );

            const balanceAfter = await farm.balanceOf(owner);

            assert.equal(
                parseInt(balanceAfter),
                parseInt(balanceBefore) - parseInt(transferValue)
            );
        });

        it("should emit correct Transfer event", async () => {

            const transferValue = defaultTokenAmount;
            const expectedRecepient = bob;

            await farm.transfer(
                expectedRecepient,
                transferValue,
                {
                    from: owner
                }
            );

            const { from, to, value } = await getLastEvent(
                "Transfer",
                farm
            );

            assert.equal(
                from,
                owner
            );

            assert.equal(
                to,
                expectedRecepient
            );

            assert.equal(
                value,
                transferValue
            );
        });

        it("should update the balance of the recipient when using transferFrom", async () => {

            const transferValue = defaultTokenAmount;
            const expectedRecipient = bob;
            const balanceBefore = await farm.balanceOf(bob);

            await farm.approve(
                owner,
                transferValue
            );

            await farm.transferFrom(
                owner,
                expectedRecipient,
                transferValue,
            );

            const balanceAfter = await farm.balanceOf(bob);

            assert.equal(
                parseInt(balanceAfter),
                parseInt(balanceBefore) + parseInt(transferValue)
            );
        });

        it("should deduct from the balance of the sender when using transferFrom", async () => {

            const transferValue = defaultTokenAmount;
            const expectedRecipient = bob;
            const balanceBefore = await farm.balanceOf(owner);

            await farm.approve(
                owner,
                transferValue
            );

            await farm.transferFrom(
                owner,
                expectedRecipient,
                transferValue,
            );

            const balanceAfter = await farm.balanceOf(owner);

            assert.equal(
                parseInt(balanceAfter),
                parseInt(balanceBefore) - parseInt(transferValue)
            );
        });

        it("should revert if there is no approval when using transferFrom", async () => {

            const transferValue = defaultTokenAmount;
            const expectedRecipient = bob;

            await expectRevert.unspecified(
                farm.transferFrom(
                    owner,
                    expectedRecipient,
                    transferValue
                )
            );
        });

        it("should revert if the sender has spent more than their approved amount when using transferFrom", async () => {

            const approvedValue = ONE_TOKEN;
            const transferValue = TWO_TOKENS;
            const expectedRecipient = bob;

            await farm.approve(
                alice,
                approvedValue
            );

            await expectRevert.unspecified(
                farm.transferFrom(
                    owner,
                    expectedRecipient,
                    transferValue,
                    {
                        from: alice
                    }
                )
            );
        });
    });

    describe("Witharaw initial dunctionality", () => {

        beforeEach(async () => {

            const result = await setupScenario({
                approval: true
            });

            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;

            defaultTokenAmount = TWO_TOKENS;

            await farm.farmDeposit(
                defaultTokenAmount
            );
        });

        it("should reduce the balance of the wallet thats withrawing the stakeTokens", async () => {

            const withdrawAmount = ONE_TOKEN;
            const withdrawAccount = owner;

            const supplyBefore = await farm.balanceOf(
                withdrawAccount
            );

            await farm.farmWithdraw(
                withdrawAmount,
                {
                    from: withdrawAccount
                }

            );

            const supplyAfter = await farm.balanceOf(
                withdrawAccount
            );

            assert.equal(
                supplyAfter,
                supplyBefore - withdrawAmount
            );
        });

        it("should deduct the correct amount from the total supply", async () => {

            const withdrawAmount = ONE_TOKEN;
            const withdrawAccount = owner;

            const supplyBefore = await farm.balanceOf(
                withdrawAccount
            );

            await farm.farmWithdraw(
                withdrawAmount,
                {
                    from: owner
                }

            );

            const totalSupply = await farm.totalSupply();

            assert.equal(
                totalSupply,
                supplyBefore - withdrawAmount
            );
        });

        it("should not be able to withdraw as last farmer until rewards are still available", async () => {

            await farm.farmDeposit(
                defaultTokenAmount
            );

            await farm.setRewardRate(
                10
            );

            const withdrawAccount = owner;

            const possibleWithdraw = await farm.balanceOf(
                withdrawAccount
            );

            await expectRevert(
                farm.farmWithdraw(
                    possibleWithdraw,
                    {
                        from: owner
                    }
                ),
                "SimpleFarm: STILL_EARNING"
            );

            await stakeToken.mint(
                defaultTokenAmount,
                {
                    from: bob
                }
            );

            await stakeToken.approve(
                farm.address,
                defaultTokenAmount,
                {
                    from: bob
                }
            );

            await farm.farmDeposit(
                defaultTokenAmount,
                {
                    from: bob
                }
            );

            await farm.farmWithdraw(
                possibleWithdraw,
                {
                    from: owner
                }
            );
        });
    });

    describe("Owner functionality", () => {

        beforeEach(async () => {
            const result = await setupScenario();
            farm = result.farm;
        });

        it("should have correct owner address", async () => {

            const expectedAddress = owner;
            const ownerAddress = await farm.ownerAddress();

            assert.equal(
                expectedAddress,
                ownerAddress
            );
        });

        it("should have correct owner address based on deployment wallet", async () => {

            const expectedAddress = alice;

            const newFarm = await Farm.new(
                stakeToken.address,
                rewardToken.address,
                defaultDurationInSeconds,
                {
                    from: expectedAddress
                }
            );

            const ownerAddress = await newFarm.ownerAddress();

            assert.equal(
                expectedAddress,
                ownerAddress
            );
        });

        it("should be able to announce new owner only by current owner", async () => {

            const expectedCurrentOwner = owner;
            const newProposedOwner = bob;
            const wrongOwner = alice;

            const currentOwner = await farm.ownerAddress();

            assert.equal(
                currentOwner,
                expectedCurrentOwner
            );

            await expectRevert(
                farm.proposeNewOwner(
                    newProposedOwner,
                    {
                        from: wrongOwner
                    }
                ),
                "SimpleFarm: INVALID_OWNER"
            );

            await farm.proposeNewOwner(
                newProposedOwner,
                {
                    from: currentOwner
                }
            );

            assert.notEqual(
                wrongOwner,
                currentOwner
            );

            assert.notEqual(
                currentOwner,
                newProposedOwner
            );
        });

        it("should be able to claim ownership only by proposed wallet", async () => {

            const expectedCurrentOwner = owner;
            const newProposedOwner = bob;
            const wrongOwner = alice;

            const currentOwner = await farm.ownerAddress();

            assert.equal(
                currentOwner,
                expectedCurrentOwner
            );

            await expectRevert(
                farm.proposeNewOwner(
                    newProposedOwner,
                    {
                        from: wrongOwner
                    }
                ),
                "SimpleFarm: INVALID_OWNER"
            );

            await farm.proposeNewOwner(
                newProposedOwner,
                {
                    from: currentOwner
                }
            );

            assert.notEqual(
                wrongOwner,
                currentOwner
            );

            assert.notEqual(
                currentOwner,
                newProposedOwner
            );

            await expectRevert(
                farm.claimOwnership(
                    {
                        from: currentOwner
                    }
                ),
                "SimpleFarm: INVALID_CANDIDATE"
            );

            await expectRevert(
                farm.claimOwnership(
                    {
                        from: wrongOwner
                    }
                ),
                "SimpleFarm: INVALID_CANDIDATE"
            );

            await farm.claimOwnership(
                {
                    from: newProposedOwner
                }
            );

            const newOwnerAfterChange = await farm.ownerAddress();

            assert.equal(
                newProposedOwner,
                newOwnerAfterChange
            );
        });

        it("should produce correct event during ownership change", async () => {

            const expectedCurrentOwner = owner;
            const newProposedOwner = bob;

            const currentOwner = await farm.ownerAddress();

            await farm.proposeNewOwner(
                newProposedOwner,
                {
                    from: currentOwner
                }
            );

            await farm.claimOwnership(
                {
                    from: newProposedOwner
                }
            );

            const newOwnerAfterChange = await farm.ownerAddress();

            assert.equal(
                newProposedOwner,
                newOwnerAfterChange
            );

            const eventData = await getLastEvent(
                "OwnerChanged",
                farm
            );

            assert.equal(
                eventData.newOwner,
                newOwnerAfterChange
            );
        });
    });

    describe("Manager functionality", () => {

        beforeEach(async () => {
            const result = await setupScenario();
            farm = result.farm;
        });

        it("should have correct manager address", async () => {

            const expectedAddress = owner;
            const managerAddress = await farm.managerAddress();

            assert.equal(
                expectedAddress,
                managerAddress
            );
        });

        it("should have correct manager address based on deployment wallet", async () => {

            const expectedAddress = alice;

            const newFarm = await Farm.new(
                stakeToken.address,
                rewardToken.address,
                defaultDurationInSeconds,
                {
                    from: expectedAddress
                }
            );

            const managerAddress = await newFarm.managerAddress();

            assert.equal(
                expectedAddress,
                managerAddress
            );
        });

        it("should be able to change manager only by owner address", async () => {

            const expectedCurrentOwner = owner;
            const expectedCurrentManager = owner;
            const newManager = bob;
            const wrongOwner = alice;

            const currentOwner = await farm.ownerAddress();
            const currentManager = await farm.managerAddress();

            assert.equal(
                currentOwner,
                expectedCurrentOwner
            );

            assert.equal(
                currentManager,
                expectedCurrentManager
            );

            await expectRevert(
                farm.changeManager(
                    newManager,
                    {
                        from: wrongOwner
                    }
                ),
                "SimpleFarm: INVALID_OWNER"
            );

            await farm.changeManager(
                newManager,
                {
                    from: currentOwner
                }
            );

            const newManagerAfterChange = await farm.managerAddress();

            assert.notEqual(
                currentManager,
                newManagerAfterChange
            );

            assert.equal(
                newManager,
                newManagerAfterChange
            );
        });

        it("should emit correct ManagerChanged event", async () => {

            const newManager = bob;

            await farm.changeManager(
                newManager
            );

            const newManagerAfterChange = await farm.managerAddress();

            assert.equal(
                newManager,
                newManagerAfterChange
            );

            const transactionData = await getLastEvent(
                "ManagerChanged",
                farm
            );

            assert.equal(
                transactionData.newManager,
                newManagerAfterChange
            );
        });
    });

    describe("Earn functionality", () => {

        beforeEach(async () => {

            const result = await setupScenario({
                approval: true
            });

            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;

            defaultTokenAmount = TWO_TOKENS;
            defaultRewardRate = 10;

            await farm.farmDeposit(
                defaultTokenAmount
            );

            await stakeToken.mint(
                defaultTokenAmount,
                {
                    from: bob
                }
            );

            await stakeToken.approve(
                farm.address,
                defaultTokenAmount,
                {
                    from: bob
                }
            );
        });

        it("should earn rewards proportionally to stake time", async () => {

            await farm.setRewardRate(
                defaultRewardRate
            );

            const stepTimeFrame = 1;
            const expectedDefaultEarn = 0;
            const rewardRate = await farm.rewardRate();
            const earnPerStep = stepTimeFrame * rewardRate;

            const earnedInital = await farm.earned(
                owner
            );

            assert.equal(
                parseInt(earnedInital),
                parseInt(expectedDefaultEarn)
            );

            await time.increase(
                stepTimeFrame
            );

            const earnedStep1 = await farm.earned(
                owner
            );

            assert.isAtLeast(
                parseInt(earnedStep1),
                earnPerStep * 1
            );

            await time.increase(
                stepTimeFrame
            );

            const earnedStep2 = await farm.earned(
                owner
            );

            assert.isAtLeast(
                parseInt(earnedStep2),
                earnPerStep * 2
            );
        });

        it("should earn rewards proportionally to staked amount single", async () => {

            await farm.farmDeposit(
                defaultTokenAmount,
                {
                    from: bob
                }
            );

            await farm.setRewardRate(
                defaultRewardRate
            );

            const stepTimeFrame = 1;
            const expectedDefaultEarn = 0;

            const depositedByOwner = await farm.balanceOf(
                owner
            );

            const depositedByBob = await farm.balanceOf(
                bob
            );

            assert.equal(
                depositedByOwner.toString(),
                depositedByBob.toString()
            );

            const earnedInitalOwner = await farm.earned(
                owner
            );

            const earnedInitalBob = await farm.earned(
                owner
            );

            assert.equal(
                earnedInitalOwner.toString(),
                earnedInitalBob.toString()
            );

            await time.increase(
                stepTimeFrame
            );

            const earnedOwnerStep1 = await farm.earned(
                owner
            );

            const earnedBobStep1 = await farm.earned(
                bob
            );

            assert.equal(
                earnedOwnerStep1.toString(),
                earnedBobStep1.toString()
            );

            await time.increase(
                stepTimeFrame
            );

            const earnedOwnerStep2 = await farm.earned(
                owner
            );

            const earnedBobStep2 = await farm.earned(
                bob
            );

            assert.equal(
                earnedOwnerStep2.toString(),
                earnedBobStep2.toString()
            );

            assert.isAbove(
                parseInt(earnedOwnerStep2),
                parseInt(earnedOwnerStep1)
            );

            assert.isAbove(
                parseInt(earnedBobStep2),
                parseInt(earnedBobStep1)
            );
        });

        it("should earn rewards proportionally to staked amount multiple", async () => {

            await farm.farmDeposit(
                ONE_TOKEN,
                {
                    from: bob
                }
            );

            await farm.setRewardRate(
                defaultRewardRate
            );

            const stepTimeFrame = 1;
            const expectedDefaultEarn = 0;
            const rewardRate = await farm.rewardRate();
            const earnPerStep = stepTimeFrame * rewardRate;

            const depositedByOwner = await farm.balanceOf(
                owner
            );

            const depositedByBob = await farm.balanceOf(
                bob
            );

            assert.isAbove(
                parseInt(depositedByOwner),
                parseInt(depositedByBob)
            );

            assert.equal(
                depositedByOwner,
                depositedByBob * 2
            );

            const earnedInitalOwner = await farm.earned(
                owner
            );

            const earnedInitalBob = await farm.earned(
                owner
            );

            assert.equal(
                earnedInitalOwner,
                earnedInitalBob * 2
            );

            await time.increase(
                stepTimeFrame
            );

            const earnedOwnerStep1 = await farm.earned(
                owner
            );

            const earnedBobStep1 = await farm.earned(
                bob
            );

            assert.equal(
                earnedOwnerStep1,
                earnedBobStep1 * 2
            );
        });
    });

    describe("Claiming functionality", () => {

        beforeEach(async () => {

            defaultDeposit = tokens("1");
            defaultRate = 10;

            const result = await setupScenario({
                approval: true,
                deposit: defaultDeposit
                // rate: defaultRate
            });

            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;
        });

        it("should reset userRewards mapping after claim to 0", async () => {

            const stakerAddess = owner;
            const expectedValue = 0;

            const userRewardsBeforeClaim = await farm.userRewards(
                stakerAddess
            );

            const earnedFromStart = await farm.earned(
                stakerAddess
            );

            assert.equal(
                parseInt(earnedFromStart),
                expectedValue
            );

            assert.equal(
                parseInt(userRewardsBeforeClaim),
                expectedValue
            );

            await farm.setRewardRate(
                defaultRate
            );

            const timeJumpStep = 1;

            await time.increase(
                timeJumpStep
            );

            const earnedAfterStart = await farm.earned(
                stakerAddess
            );

            assert.isAbove(
                parseInt(earnedAfterStart),
                expectedValue
            );

            await time.increase(
                timeJumpStep
            );

            await farm.claimReward();

            const userRewardsAfterClaim = await farm.userRewards(
                stakerAddess
            );

            const earnAfterClaim = await farm.earned(
                stakerAddess
            );

            assert.isBelow(
                parseInt(earnAfterClaim),
                parseInt(earnedAfterStart)
            );

            assert.equal(
                parseInt(userRewardsAfterClaim),
                expectedValue
            );
        });

        it("should revert if nothing to claim", async () => {
            const stakerAddess = owner;
            const nonStakerAddress = bob;
            const timeJumpStep = 1;

            await farm.setRewardRate(
                defaultRate,
                {
                    from: stakerAddess
                }
            );

            await time.increase(
                timeJumpStep
            );

            await expectRevert(
                farm.claimReward(
                    {
                        from: nonStakerAddress
                    }
                ),
                "SimpleFarm: NOTHING_TO_CLAIM"
            );
        });

        it("should update lastUpdateTime value after claim", async () => {

            const stakerAddess = owner;
            const expectedValue = 0;

            const userRewardsBeforeClaim = await farm.userRewards(
                stakerAddess
            );

            const earnedFromStart = await farm.earned(
                stakerAddess
            );

            assert.equal(
                parseInt(earnedFromStart),
                expectedValue
            );

            assert.equal(
                parseInt(userRewardsBeforeClaim),
                expectedValue
            );

            await farm.setRewardRate(
                defaultRate
            );

            const timeJumpStep = 1;

            await time.increase(
                timeJumpStep
            );

            const earnedAfterStart = await farm.earned(
                stakerAddess
            );

            assert.isAbove(
                parseInt(earnedAfterStart),
                expectedValue
            );

            await time.increase(
                timeJumpStep
            );

            const lastUpdateTime = await farm.lastUpdateTime();
            await farm.claimReward();
            const lastUpdateTimeAfter = await farm.lastUpdateTime();

            assert.isAbove(
                lastUpdateTimeAfter.toNumber(),
                lastUpdateTime.toNumber()
            );
        });
    });

    describe("Exit functionality", () => {

        beforeEach(async () => {

            defaultTokenAmount = TWO_TOKENS;
            defaultRate = 10;

            const result = await setupScenario({
                approval: true,
                deposit: defaultTokenAmount,
                rate: defaultRate
            });

            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;
        });

        it("should not be able to exit until rewards are still available", async () => {

            const withdrawAccount = owner;

            const possibleWithdraw = await farm.balanceOf(
                withdrawAccount
            );

            await expectRevert(
                farm.exitFarm(
                    {
                        from: owner
                    }
                ),
                "SimpleFarm: STILL_EARNING"
            );

            await time.increase(
                defaultDurationInSeconds + 1
            );

            await farm.exitFarm(
                {
                    from: withdrawAccount
                }
            );
        });

        it("should not be able to exit as last farmer until rewards are still available", async () => {

            const withdrawAccount = owner;

            const possibleWithdraw = await farm.balanceOf(
                withdrawAccount
            );

            await expectRevert(
                farm.exitFarm(
                    {
                        from: owner
                    }
                ),
                "SimpleFarm: STILL_EARNING"
            );

            await stakeToken.mint(
                defaultTokenAmount,
                {
                    from: bob
                }
            );

            await stakeToken.approve(
                farm.address,
                defaultTokenAmount,
                {
                    from: bob
                }
            );

            await farm.farmDeposit(
                defaultTokenAmount,
                {
                    from: bob
                }
            );

            await time.increase(
                1
            );

            await farm.exitFarm(
                {
                    from: withdrawAccount
                }
            );
        });

        it("should not be able to exit if nothing to claim, perform withdraw instead", async () => {

            const withdrawAccount = owner;

            const possibleWithdraw = await farm.balanceOf(
                withdrawAccount
            );

            await expectRevert(
                farm.exitFarm(
                    {
                        from: owner
                    }
                ),
                "SimpleFarm: STILL_EARNING"
            );

            await time.increase(
                defaultDurationInSeconds + 1
            );

            await farm.claimReward(
                {
                    from: withdrawAccount
                }
            );

            await expectRevert(
                farm.exitFarm(
                    {
                        from: owner
                    }
                ),
                "SimpleFarm: NOTHING_TO_CLAIM"
            );

            await farm.farmWithdraw(
                possibleWithdraw,
                {
                    from: withdrawAccount
                }
            );

            await expectRevert.unspecified(
                farm.farmWithdraw(
                    possibleWithdraw,
                    {
                        from: withdrawAccount
                    }
                )
            );
        });
    });

    describe("Recover token functionality", () => {

        beforeEach(async () => {

            const result = await setupScenario();

            randomToken = await Token.new();
            stakeToken = result.stakeToken;
            rewardToken = result.rewardToken;
            farm = result.farm;
        });

        it("should be able to recover accidentally sent tokens from the contract", async () => {

            const transferAmount = ONE_TOKEN;

            await randomToken.transfer(
                farm.address,
                transferAmount
            );

            const balanceBefore = await randomToken.balanceOf(
                farm.address
            );

            assert.equal(
                balanceBefore,
                transferAmount
            );

            await farm.recoverToken(
                randomToken.address,
                balanceBefore
            );

            const balanceAfter = await randomToken.balanceOf(
                farm.address
            );

            assert.equal(
                balanceAfter.toString(),
                "0"
            );
        });

        it("should not be able to recover stakeTokens from the contract", async () => {

            const transferAmount = ONE_TOKEN;

            await rewardToken.transfer(
                farm.address,
                transferAmount
            );

            await expectRevert(
                farm.recoverToken(
                    rewardToken.address,
                    transferAmount
                ),
                "SimpleFarm: INVALID_TOKEN"
            );
        });

        it("should not be able to recover rewardTokens from the contract", async () => {

            const transferAmount = ONE_TOKEN;

            await stakeToken.transfer(
                farm.address,
                transferAmount
            );

            await expectRevert(
                farm.recoverToken(
                    stakeToken.address,
                    transferAmount
                ),
                "SimpleFarm: INVALID_TOKEN"
            );
        });
    });
});
