const { BN } = require('@openzeppelin/test-helpers');
// const helpers = require("@nomicfoundation/hardhat-network-helpers");

advanceTime = time => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [time],
                id: new Date().getTime()
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            }
        );
    });
};

inBound = async (
    _value,
    _Token
) => {

    const BASE_BOUND = 5000;
    const dec = await _Token.decimals();

    return _value < Bi(BASE_BOUND
        * Math.pow(
            10,
            dec
        )
    );
}

inBoundVar = async (_value, _Token, _baseBound) => {

    const dec = await _Token.decimals();
    return _value < Bi(_baseBound * Math.pow(10,dec));
}

inGasBound = async (_value, _Token) => {

    const GAS_BOUND = 0.002;
    const dec = await _Token.decimals();

    return _value < Bi(GAS_BOUND * Math.pow(10,dec));
}


abs = (_value) => (_value < 0)
    ? -_value
    : _value;

Bn = (_value) => {
    return new BN(_value)
}

Bi = (_value) => {
    return BigInt(_value)
}

pow8 = (_value) => {
    return new BN(_value * Math.pow(10,8));
}

pow6 = (_value) => {
    return new BN(_value * Math.pow(10,6));
}

debug = (
    message1,
    message2
) => {
        console.log(
            `${message1}: ${message2.toString()}`);
}

setPhaseIdAndAggregator = async (_oracles) => {

    // const phaseId = 1;
    const aggregatorRoundMax = 3;

    for (index = 0; index < _oracles.length; index++) {

        // await _oracles[index].updatePhaseId(
            // phaseId
        // );

        await _oracles[index].setGlobalAggregatorRoundId(
            aggregatorRoundMax
        );
    }
}

getBigGas = (_order) => {
    Math.pow(10, _order)
}

getBlockInfo = async () => {
    const fetchedObject = await web3.eth.getBlock('latest');

    return {
        blockNumber: fetchedObject.number,
        timestamp: fetchedObject.timestamp
    }
}

setupHeartbeatForTests = async (inputParam = {}) => {

    const tokens = inputParam.tokens;
    const chainlinkInterfaces = inputParam.chainlinkInterfaces;
    const oracleHub = inputParam.oracleHub;

    // const phaseId = 1;
    const aggregatorRoundMax = 3;

    const timeDistances = [
        840000000000000,
        890000000000000,
        930000000000000,
        990000000000000,
    ];

    await setPhaseIdAndAggregator(
        chainlinkInterfaces
    );

    let currentTime;
    let distance;


    for (i = 1; i <= aggregatorRoundMax; i++) {

        currentRoundId = i;

        for (index = 0; index < chainlinkInterfaces.length; index++) {

            currentTime = await chainlinkInterfaces[index].getTimeStamp();

            distance = currentTime.add(
                Bn(timeDistances[i - 1])
            );

            await chainlinkInterfaces[index].setRoundData(
                currentRoundId,
                distance
            );
        }
    }

    for (index = 0; index < tokens.length; index++) {
        /*
            const prev = await oracleHub.recalibratePreview(
                tokens[index].address
            );
        */
        await oracleHub.recalibrate(
            tokens[index].address
        );
    }
}

/*
setupHeartbeatForTests = async (_inputData) => {

    await Promise.all(_inputData.map(async (inputData, counter) => {

        debug("counter", counter);

        const phaseId = inputData.phaseId;
        const aggregatorRoundMax = inputData.roundMax;
        const timeDistances = inputData.timeDistances;
        const tokenAddress = inputData.tokenAddress;

        const oracleHubInterface = inputData.oracleHubInterface;
        const chainlinkInterface = inputData.chainlinkInterface;

        const currentTime = await chainlinkInterface.getTimeStamp();

        await chainlinkInterface.updatePhaseId(
            phaseId
        );

        await chainlinkInterface.setGlobalAggregatorRoundId(
            aggregatorRoundMax
        );

        let shiftedIndex;
        let currentRoundId;

        for (index = 0; index < aggregatorRoundMax; index++) {

            shiftedIndex = index + 1;
            debug("shiftedIndex", shiftedIndex);

            currentRoundId = await oracleHubInterface.getRoundIdByByteShift(
                phaseId,
                shiftedIndex
            );

            debug("currentRoundId", currentRoundId);

            await chainlinkInterface.setRoundData(
                currentRoundId,
                currentTime.add(Bn(timeDistances[index]))
            );
        }

        await oracleHubInterface.recalibrate(
            tokenAddress
        );

        })
    );

    await Promise.all(timeDistances.map(async (timeDistance, index) => {

        currentRoundId = await oracleHubInterface.getRoundIdByByteShift(
            phaseId,
            index
        );

        debug("currentRoundId", currentRoundId);

        await chainlinkInterface.setRoundData(
            currentRoundId,
            currentTime.add(Bn(timeDistance))
        );

        const test = await oracleHubInterface._getRoundTimestamp(
            tokenAddress,
            phaseId,
            index
        );
            debug("test",test);
            debug("index", index);
    }));


    const timeDistanceOne = new BN(84000);
    const timeDistanceTwo = new BN(89000);
    const timeDistanceThree = new BN(93000);

    let timedistances = [];

    timedistances[0] = (new BN(currentTime)).add(timeDistanceOne);
    timedistances[1] = (new BN(currentTime)).add(timeDistanceTwo);
    timedistances[2] = (new BN(currentTime)).add(timeDistanceThree);

    let currentRoundId;


    await chainlinkETH.setGlobalAggregatorRoundId(aggregatorRoundMax);

    for (i = 1; i <= aggregatorRoundMax; i++){

        currentRoundId = await router.getRoundIdByByteShift(
            phaseId,
            i
        );

        await chainlinkUSDC.setRoundData(
            currentRoundId,
            timedistances[i-1]
        );

        await chainlinkETH.setRoundData(
            currentRoundId,
            timedistances[i-1]
        );

    }

    await router.recalibrate(chainlinkUSDC.address);
    await router.recalibrate(chainlinkETH.address);

}
*/

setLastUpdateGlobal = async(_oracles) => {

    for (index = 0; index < _oracles.length; index++) {

        const currentStamp = await _oracles[index].getTimeStamp();

        await _oracles[index].setLastUpdateGlobal(
            currentStamp
        );
    }
}

closeToBn = (resultBN, expected, precision) => {    // example for future referrence compare 10 to 11 within 100% margin of error  -> use toWei(10), 11 , "1"
                                                    // compare 10 to 11 within 10% margin of error  -> use toWei(10), 11 , "0.1" etc....

    //if both numbers are 0, say they are equal. Do not divide by 0
    if(expected == 0 && resultBN.eq(new BN("0"))) return true;

    precision = new BN(toWei(precision));
    expected = new BN(toWei(expected));

    //console.log(bn1.toString());
    //console.log(bn2.toString());
    const ratioE18 = resultBN.mul(new BN("1000000000000000000")).div(expected);

    const upperBound = (new BN(web3.utils.toWei("1"))).add(precision);
    const lowerBound = (new BN(web3.utils.toWei("1"))).sub(precision);

    if( upperBound.cmp(ratioE18) < 0 ){
        console.error("Expected " + resultBN.toString() + " close to " + expected.toString());
        return false;
    }

    if( lowerBound.cmp(ratioE18) > 0 ){
        console.error("Expected " + resultBN.toString() + " close to " + expected.toString());
        return false;
    }
    return true;

};

comparingCloseNumbers = (resultAinBN, resultBinBN, precision) => {

    let ratio;

    if(resultAinBN < resultBinBN) {

        ratio = resultAinBN / resultBinBN;
    }
    else {
        ratio = resultBinBN / resultAinBN;
    }

    debug("ratio", ratio.toString());

    let inverseRatio = Math.abs(ratio - 1);

    debug("inverseRatio", inverseRatio.toString());

    return inverseRatio < precision;
}

advanceBlock = () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                id: new Date().getTime()
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                const newBlockHash = web3.eth.getBlock("latest").hash;

                return resolve(newBlockHash);
            }
        );
    });
};

takeSnapshot = () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_snapshot",
                id: new Date().getTime()
            },
            (err, snapshotId) => {
                if (err) {
                    return reject(err);
                }
                return resolve(snapshotId);
            }
        );
    });
};

revertToSnapShot = id => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_revert",
                params: [id],
                id: new Date().getTime()
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            }
        );
    });
};

advanceTimeAndBlock = async time => {
    await advanceTime(time);
    await advanceBlock();
    return Promise.resolve(web3.eth.getBlock("latest"));
};

const itShouldThrow = (reason, fun, expectedMessage) => {
    it(reason, async () => {
        let error = false;
        try {
            await Promise.resolve(fun()).catch((e) => {
                error = e;
            });
        } catch (e) {
            error = e;
        }

        // No error was returned or raised - make the test fail plain and simple.
        if (!error) {
            assert.ok(false, 'expected to throw, did not');
        }

        // No exception message was provided, we'll only test against the important VM ones.
        if (expectedMessage === undefined) {
            assert.match(
                error.message,
                /invalid JUMP|invalid opcode|out of gas|The contract code couldn't be stored, please check your gas amount/,
            );
        // An expected exception message was passed - match it.
        } else if (error.message.length > 0) {
            // Get the error message from require method within the contract
            const errorReason = error.message.match('Reason given: (.*)\\.');
            // If there's no message error provided, check for default errors
            if (errorReason === null) {
                assert.ok(
                    error.message.indexOf(expectedMessage) >= 0,
                    'threw the wrong exception type',
                );
            } else {
                assert.equal(
                    expectedMessage,
                    errorReason[1],
                    'threw the wrong exception type',
                );
            }
        // In case that nothing matches!
        } else {
            assert.ok(false, `something went wrong with asserts. Given error ${error}`);
        }
    });
};

getEvents = async (eventName, instance) => {
    return await instance.getPastEvents(eventName, {
        fromBlock: 0,
        toBlock: "latest",
    });
};

getLastEvent = async (eventName, instance) => {
    const events = await getEvents(eventName, instance);
    return events.pop().returnValues;
};

getFewLastEvents = async (eventName, instance, eventCount) => {
    const events = await getEvents(eventName, instance);
    return events
        .slice(events.length - eventCount, events.length)
        .map((event) => event.returnValues);
};

simpleLendingTest = async (
    numTokens,
    user1,
    user2,
    userDeposits,
    userCollateralize,
    UserBorrows,
    OracleBeforePrices,
    OracleAfterPrices,
    mulFactor,
    tokenFactors,
    poolFactors,
    maxDepositValueToken,
    shouldFail,
    debugMessages = false
) => {
    //Initialize tokens and oracles
    let tokens = [];
    let tokenAddresses = [];
    let oracles = [];
    let oracleAddresses = [];

    for (let i = 0; i < numTokens; i++) {

        //initialize all tokens
        let tok = await Token.new(
            {
                from : user1
            }
        );

        //Transfer tokens between user1 and user2
        await tok.transfer(
            user2,
            "500000000000000000000000000000000",  //half of total supply
            {
                from : user1
            }
        );

        tokens.push(tok);
        tokenAddresses.push(tok.address);

        //initialize oracles with OracleBeforePrices
        let orac = await USDEquivalent.new(OracleBeforePrices[i], 18, tok.address);

        oracles.push(orac);
        oracleAddresses.push(orac.address);
    }

    let lending = await Lending.new(
        user1,
        DUMMY_ADDRESS1,
        tokenAddresses,
        [ZERO_ADDRESS,ZERO_ADDRESS],
        [ZERO_ADDRESS,ZERO_ADDRESS],
        oracleAddresses,
        mulFactor,
        poolFactors,
        maxDepositValueToken

    );

    for (let i = 0; i < numTokens; i++) {
        //approve lending with token for user1 and user2
        await tokens[i].approve(
            lending.address,
            "500000000000000000000000000000000",
            {
                from: user1
            }
        );

        await tokens[i].approve(
            lending.address,
            "500000000000000000000000000000000",
            {
                from: user2
            }
        );
        //do each user deposit for each user/token
        await lending.depositTokens(
            tokens[i].address,
            userDeposits[i],
            {
                from : user2
            }
        );

        await advanceTimeAndBlock(1);

        if(userCollateralize[i]){
            await lending.collateralizeDeposit(
                tokens[i].address,
                {
                    from : user2
                }
            );
        }

        await advanceTimeAndBlock(1);
    }

    //do each user borrow for each user/token
    for (let i = 0; i < numTokens; i++) {

        if(debugMessages){
            await debugLendingData(
                lending,
                tokens[i],
                user2,
                "Before Borrow token" + i.toString()
            );
        }

        await advanceTimeAndBlock(1);

        await lending.borrow(
            tokens[i].address,
            UserBorrows[i],
            {
                from : user2
            }
        );

        if(debugMessages){
            await debugLendingData(
                lending,
                tokens[i],
                user2,
                "After Borrow token" + i.toString()
            );
        }
    };

    //change oracles prices to OracleAfterPrices
    for (let i = 0; i < numTokens; i++) {
        await oracles[i].setValue(
            OracleAfterPrices[i]
        )
    };

    //Attempt liquidation
    //Have if else for shouldfail to do either catchrevert or regular call

    if (shouldFail) {

        await advanceTimeAndBlock(1);

        await catchRevert(
            lending.liquidatePartiallyFromTokens(
                user2,
                toWei("0.5"),
                {
                    from : user1
                }
            )
        );
    }
        else
    {

        await advanceTimeAndBlock(1);
        await lending.liquidatePartiallyFromTokens(
            user2,
            toWei("0.5"),
            {
                from : user1
            }
        );
    }
}

const setUpLending = async(owner, user) => {

    wToken = await Token.new();

    token1 = await Token.new(
        {
            from : user
        }
    );

    token2 = await Token.new(
        {
            from : user
        }
    );

    oracle1 = await USDEquivalent.new(
        FIFTY_ETH,
        token1.address
    );

    lending = await Lending.new(
        owner,
        DUMMY_ADDRESS1,
        [true, true],
        [token1.address, token2.address],
        [ZERO_ADDRESS],
        [ZERO_ADDRESS],
        [oracle1.address, DUMMY_ADDRESS1],
        [50],
        [toWei("0.97")],
        [HUGE_AMOUNT],
        [toWei("1")]
    );

    await token1.approve(
        lending.address,
        HUGE_AMOUNT,
        {
            from : owner
        }
    );

    await token1.approve(
        lending.address,
        HUGE_AMOUNT,
        {
            from : user
        }
    );

    await token2.approve(
        lending.address,
        HUGE_AMOUNT,
        {
            from : owner
        }
    );

    await token2.approve(
        lending.address,
        HUGE_AMOUNT,
        {
            from : user
        }
    );
};

module.exports = {
    advanceTime,
    advanceBlock,
    itShouldThrow,
    advanceTimeAndBlock,
    takeSnapshot,
    revertToSnapShot,
    getBigGas,
    getEvents,
    getLastEvent,
    getFewLastEvents,
    setupHeartbeatForTests,
    Bn,
    closeToBn,
    pow8,
    pow6,
    debug,
    Bi,
    getBlockInfo
};
