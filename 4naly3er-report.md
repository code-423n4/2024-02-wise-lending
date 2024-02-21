**Summary**



# Vulnerability Report


## Medium Issues


||Issue|Instances|
|-|:-|:-:|
| [M-1](#M-1) | Centralization Risk and Admin privilege - A single point of failure can allow a hacked or malicious owner use critical functions in the project | 5 |
| [M-2](#M-2) | Excess funds sent via `msg.value` not refunded | 19 |
### <a name="M-1"></a>[M-1] Centralization Risk and Admin privilege - A single point of failure can allow a hacked or malicious owner use critical functions in the project

Contracts have owners with privileged rights to perform admin tasks and need to be trusted to not perform malicious updates or drain funds.

Additionally, the `owner` role has a single point of failure and `onlyOwner` can use critical a few functions.

`owner` role in the project:
Owner is not behind a multisig and changes are not behind a timelock.

Even if protocol admins/developers are not malicious there is still a chance for Owner keys to be stolen. In such a case, the attacker can cause serious damage to the project due to important functions. In such a case, users who have invested in project will suffer high financial losses.

**Impact**
Hacked owner or malicious owner can immediately use critical functions in the project.

**Recommended Mitigation Steps**

Add a time lock to critical functions. Admin-only functions that change critical parameters should emit events and have timelocks.
Events allow capturing the changed parameters so that off-chain tools/interfaces can register such changes with timelocks that allow users to evaluate them and consider if they would like to engage/exit based on how they perceive the changes as affecting the trustworthiness of the protocol or profitability of the implemented financial services.

Allow only multi-signature wallets to call the function to reduce the likelihood of an attack.

<https://twitter.com/danielvf/status/1572963475101556738?s=20&t=V1kvzfJlsx-D2hfnG0OmuQ>

Affected code:

- [contracts/DerivativeOracles/CustomOracleSetup.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/CustomOracleSetup.sol)

```solidity
# File: contracts/DerivativeOracles/CustomOracleSetup.sol

CustomOracleSetup.sol:14:     modifier onlyOwner() {

CustomOracleSetup.sol:28:         onlyOwner

CustomOracleSetup.sol:37:         onlyOwner

CustomOracleSetup.sol:47:         onlyOwner

CustomOracleSetup.sol:56:         onlyOwner
```

### <a name="M-2"></a>[M-2] Excess funds sent via `msg.value` not refunded

The code below allows the caller to provide Ether, but does not refund the amount in excess of what's required, leaving funds stranded in the contract. The condition should be changed to check for equality, or the code should refund the excess.

Affected code:

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:26:             msg.value,

PendlePowerManager.sol:156:             msg.value

PendlePowerManager.sol:162:             msg.value,

PendlePowerManager.sol:178:             msg.value,
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:130:             msg.value,
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:59:             msg.value

WiseLending.sol:411:             msg.value

WiseLending.sol:415:             msg.value

WiseLending.sol:519:             msg.value

WiseLending.sol:523:             msg.value

WiseLending.sol:530:             msg.value

WiseLending.sol:1110:                 _amount: msg.value,

WiseLending.sol:1120:         uint256 requiredAmount = msg.value;

WiseLending.sol:1122:         if (msg.value > maxPaybackAmount) {

WiseLending.sol:1125:                 refundAmount = msg.value
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:93:             msg.value

AaveHub.sol:181:             msg.value

AaveHub.sol:187:             msg.value

AaveHub.sol:517:             msg.value,
```


## Low Issues


||Issue|Instances|
|-|:-|:-:|
| [L-1](#L-1) | Unbounded loop / Array is `push()`ed but not `pop()`ed | 7 |
| [L-2](#L-2) | `approve()`/`safeApprove()` may revert if the current approval is not zero | 1 |
| [L-3](#L-3) | Use a 2-step ownership transfer pattern | 7 |
| [L-4](#L-4) | `decimals()` is not a part of the ERC-20 standard | 8 |
| [L-5](#L-5) | Division by zero not prevented | 39 |
| [L-6](#L-6) | Missing contract-existence checks before calldata forwarded to external contract | 4 |
| [L-7](#L-7) | External call recipient may consume all transaction gas | 10 |
| [L-8](#L-8) | Initializers could be front-run | 1 |
| [L-9](#L-9) | Signature use at deadlines should be allowed | 1 |
| [L-10](#L-10) | Possible rounding issue | 17 |
| [L-11](#L-11) | Loss of precision | 70 |
| [L-12](#L-12) | Use `Ownable2Step.transferOwnership` instead of `Ownable.transferOwnership` | 9 |
| [L-13](#L-13) | Upgradeable contract not initialized | 4 |
| [L-14](#L-14) | A year is not always 365 days | 3 |
### <a name="L-1"></a>[L-1] Unbounded loop / Array is `push()`ed but not `pop()`ed

Arrays without the `pop()` operation in Solidity can lead to inefficient memory management and increase the likelihood of out-of-gas errors. Consider whether this should be the case, or whether there should be a maximum, or whether old entries should be removed.

Affected code:

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:396:         poolTokenAddresses.push(

FeeManager.sol:422:         poolTokenAddresses.push(

FeeManager.sol:475:             poolTokenAddresses.pop();
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:629:         userTokenData[_nftId].push(

MainHelper.sol:735:         positionLendTokenData[_nftId].pop();

MainHelper.sol:796:         positionBorrowTokenData[_nftId].pop();
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:283:         activePendleMarkets.push(
```

### <a name="L-2"></a>[L-2] `approve()`/`safeApprove()` may revert if the current approval is not zero

- Some tokens (like the *very popular* USDT) do not work when changing the allowance from an existing non-zero allowance value (it will revert if the current approval is not zero to protect against front-running changes of approvals). These tokens must first be approved for zero and then the actual allowance can be approved.
- Furthermore, OZ's implementation of safeApprove would throw an error if an approve is attempted from a non-zero value (`"SafeERC20: approve from non-zero to non-zero allowance"`)

Set the allowance to zero immediately before each of the existing allowance calls

Affected code:

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:197:             POSITION_NFT.approve(
```

### <a name="L-3"></a>[L-3] Use a 2-step ownership transfer pattern

Recommend considering implementing a two step process where the owner or admin nominates an account and the nominated account needs to call an `acceptOwnership()` function for the transfer of ownership to fully succeed. This ensures the nominated EOA account is a valid and active account. Lack of two-step procedure for critical operations leaves them error-prone. Consider adding two step procedure on the critical functions.

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:31: contract DeclarationsFeeManager is FeeManagerEvents, OwnableMaster {
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:11: contract PositionNFTs is ERC721Enumerable, OwnableMaster {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:15: contract PendlePowerManager is OwnableMaster, PendlePowerFarm, MinterReserver {
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:24: contract PowerFarmNFTs is ERC721Enumerable, OwnableMaster {
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:33: abstract contract Declarations is OwnableMaster {
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:45: contract WiseSecurityDeclarations is OwnableMaster {
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:21: contract Declarations is OwnableMaster, AaveEvents, WrapperHelper {
```

### <a name="L-4"></a>[L-4] `decimals()` is not a part of the ERC-20 standard

The `decimals()` function is not a part of the [ERC-20 standard](https://eips.ethereum.org/EIPS/eip-20), and was added later as an [optional extension](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/IERC20Metadata.sol). As such, some valid ERC20 tokens do not support this interface, so it is unsafe to blindly cast all tokens to this interface, and then call this function.

Affected code:

- [contracts/DerivativeOracles/PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleLpOracle.sol

PendleLpOracle.sol:44:         if (FEED_ASSET.decimals() != DEFAULT_DECIMALS) {
```

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:38:         POW_USD_FEED = 10 ** USD_FEED_ASSET.decimals();

PtOracleDerivative.sol:39:         POW_ETH_USD_FEED = 10 ** ETH_FEED_ASSET.decimals();
```

- [contracts/DerivativeOracles/PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOraclePure.sol)

```solidity
# File: contracts/DerivativeOracles/PtOraclePure.sol

PtOraclePure.sol:35:         POW_FEED = 10 ** FEED_ASSET.decimals();
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:724:         _decimals = PENDLE_SY.decimals();
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:58:         ).decimals();
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:27:         ).decimals();

OracleHelper.sol:457:         return priceFeed[_tokenAddress].decimals();
```

### <a name="L-5"></a>[L-5] Division by zero not prevented

The divisions below take an input parameter which does not have any zero-value checks, which may lead to the functions reverting when zero is passed.

Affected code:

- [contracts/DerivativeOracles/PendleChildLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleChildLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleChildLpOracle.sol

PendleChildLpOracle.sol:43:             / pendleChildToken.totalSupply()
```

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:126:             / uint256(answerEthUsdFeed)
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:43:             ? _product / _pseudo + 1

MainHelper.sol:44:             : _product / _pseudo - 1;

MainHelper.sol:103:             / lendingPoolData[_poolToken].totalDepositShares - 1;

MainHelper.sol:127:         return product / totalBorrowShares + 1;

MainHelper.sol:179:             / pseudoPool

MainHelper.sol:548:             / (lendingPoolData[_poolToken].pseudoTotalPool - feeAmount);

MainHelper.sol:862:                 / baseDivider;
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:289:                     / _poleBoundRate
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:74:             / totalCollateral;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:365:             / pseudoPool

PendlePowerFarmMathLogic.sol:382:             / baseDivider;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:287:                     / lpBalanceController

PendlePowerFarmToken.sol:331:             / totalSupply();

PendlePowerFarmToken.sol:462:             / _underlyingLpAssetsCurrent;

PendlePowerFarmToken.sol:475:             / totalSupply();

PendlePowerFarmToken.sol:490:             ? product / _underlyingLpAssetsCurrent
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:177:             / borrowPoolData[_poolToken].totalBorrowShares;

WiseLending.sol:187:                 / lendingPoolData[_poolToken].totalDepositShares,
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:227:                 / _fetchTwapValue;

OracleHelper.sol:232:             / _answerUint256;

OracleHelper.sol:436:             / twapPeriodInt56

OracleHelper.sol:496:             / uint256(
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:187:                 / latestResolver(_tokenAddress)

WiseOracleHub.sol:190:                 / latestResolver(_tokenAddress)

WiseOracleHub.sol:210:                 / getETHPriceInUSD()

WiseOracleHub.sol:347:                 / latestResolver(_tokenAddress)

WiseOracleHub.sol:350:                 / latestResolver(_tokenAddress)
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:76:             / overallCollateral;

WiseSecurity.sol:492:             / overallETH;

WiseSecurity.sol:549:             / overallETH;

WiseSecurity.sol:626:                 / totalETHSupply;

WiseSecurity.sol:935:             / currentTotalBorrowShares;

WiseSecurity.sol:972:             / currentTotalLendingShares;
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:310:             / currentTotalLendingShares;

WiseSecurityHelper.sol:639:             / currentTotalBorrowShares;

WiseSecurityHelper.sol:785:         return numerator / denominator + 1;

WiseSecurityHelper.sol:1020:             / pseudoTotalPool;
```

### <a name="L-6"></a>[L-6] Missing contract-existence checks before calldata forwarded to external contract

Low-level calls return success if there is no code present at the specified address. In addition to the zero-address checks, add a check to verify that `extcodesize()` is non-zero.

Affected code:

- [contracts/TransferHub/CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/CallOptionalReturn.sol)

```solidity
# File: contracts/TransferHub/CallOptionalReturn.sol

CallOptionalReturn.sol:22:         ) = token.call(
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:78:         (bool success, ) = _tokenAggregator.call(
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:208:         ) = curvePool.call{value: 0} (

WiseSecurity.sol:225:         ) = curveMeta.call{value: 0} (
```

### <a name="L-7"></a>[L-7] External call recipient may consume all transaction gas

There is no limit specified on the amount of gas used, so the recipient can use up all of the transaction's gas, causing it to revert. Use `addr.call{gas: <amount>}("")` or [this](https://github.com/nomad-xyz/ExcessivelySafeCall) library instead.

Affected code:

- [contracts/TransferHub/CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/CallOptionalReturn.sol)

```solidity
# File: contracts/TransferHub/CallOptionalReturn.sol

CallOptionalReturn.sol:22:         ) = token.call(
```

- [contracts/TransferHub/SendValueHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/SendValueHelper.sol)

```solidity
# File: contracts/TransferHub/SendValueHelper.sol

SendValueHelper.sol:27:         ) = payable(_recipient).call{
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:676:             _data.caller,

WiseCore.sol:683:             _data.caller,
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:1267:         data.caller = msg.sender;

WiseLending.sol:1333:         data.caller = _caller;
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:78:         (bool success, ) = _tokenAggregator.call(
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:208:         ) = curvePool.call{value: 0} (

WiseSecurity.sol:225:         ) = curveMeta.call{value: 0} (
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:208:         (bool success, ) = payable(_recipient).call{
```

### <a name="L-8"></a>[L-8] Initializers could be front-run

Initializers could be front-run, allowing an attacker to either set their own values, take ownership of the contract, and in the best case forcing a re-deployment.

**Recommendations**

    Short term, ensure that the deployment scripts have robust protections against front-running attacks.
Long term, create an architecture diagram that includes the system's functions and their arguments to identify any functions that can be front-run. Additionally, document all cases in which front-running may be possible, along with the effects of front-running on the codebase.

Affected code:

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:682:     function initialize(
```

### <a name="L-9"></a>[L-9] Signature use at deadlines should be allowed

According to [EIP-2612](https://github.com/ethereum/EIPs/blob/71dc97318013bf2ac572ab63fab530ac9ef419ca/EIPS/eip-2612.md?plain=1#L58), signatures used on exactly the deadline timestamp are supposed to be allowed. While the signature may or may not be used for the exact EIP-2612 use case (transfer approvals), for consistency's sake, all deadlines should follow this semantic. If the timestamp is an expiration rather than a deadline, consider whether it makes more sense to include the expiration timestamp as a valid timestamp, as is done for deadlines.

Affected code:

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:475:         if (_getExpiry() > block.timestamp) {
```

### <a name="L-10"></a>[L-10] Possible rounding issue

Division by large numbers may result in the result being zero, due to solidity not supporting fractions. Consider requiring a minimum amount for the numerator to ensure that it is always larger than the denominator. Also, there is indication of multiplication and division without the use of parenthesis which could result in issues.

Affected code:

- [contracts/DerivativeOracles/PendleChildLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleChildLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleChildLpOracle.sol

PendleChildLpOracle.sol:43:             / pendleChildToken.totalSupply()
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:103:             / lendingPoolData[_poolToken].totalDepositShares - 1;

MainHelper.sol:127:         return product / totalBorrowShares + 1;

MainHelper.sol:548:             / (lendingPoolData[_poolToken].pseudoTotalPool - feeAmount);
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:74:             / totalCollateral;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:287:                     / lpBalanceController

PendlePowerFarmToken.sol:331:             / totalSupply();

PendlePowerFarmToken.sol:475:             / totalSupply();
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:177:             / borrowPoolData[_poolToken].totalBorrowShares;

WiseLending.sol:187:                 / lendingPoolData[_poolToken].totalDepositShares,
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:626:                 / totalETHSupply;

WiseSecurity.sol:632:                 / totalETHSupply;

WiseSecurity.sol:935:             / currentTotalBorrowShares;

WiseSecurity.sol:972:             / currentTotalLendingShares;
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:310:             / currentTotalLendingShares;

WiseSecurityHelper.sol:639:             / currentTotalBorrowShares;

WiseSecurityHelper.sol:1020:             / pseudoTotalPool;
```

### <a name="L-11"></a>[L-11] Loss of precision

Division by large numbers may result in the result being zero, due to solidity not supporting fractions. Consider requiring a minimum amount for the numerator to ensure that it is always larger than the denominator

Affected code:

- [contracts/DerivativeOracles/PendleChildLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleChildLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleChildLpOracle.sol

PendleChildLpOracle.sol:43:             / pendleChildToken.totalSupply()

PendleChildLpOracle.sol:44:             / PRECISION_FACTOR_E18;
```

- [contracts/DerivativeOracles/PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleLpOracle.sol

PendleLpOracle.sol:119:             / PRECISION_FACTOR_E18;
```

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:124:             / POW_USD_FEED

PtOracleDerivative.sol:128:             / PRECISION_FACTOR_E18;
```

- [contracts/DerivativeOracles/PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOraclePure.sol)

```solidity
# File: contracts/DerivativeOracles/PtOraclePure.sol

PtOraclePure.sol:105:             / POW_FEED

PtOraclePure.sol:107:             / PRECISION_FACTOR_E18;
```

- [contracts/FeeManager/FeeManagerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManagerHelper.sol)

```solidity
# File: contracts/FeeManager/FeeManagerHelper.sol

FeeManagerHelper.sol:255:             / PRECISION_FACTOR_E18;

FeeManagerHelper.sol:341:             / WISE_LENDING.globalPoolData(_poolToken).poolFee;
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:103:             / lendingPoolData[_poolToken].totalDepositShares - 1;

MainHelper.sol:127:         return product / totalBorrowShares + 1;

MainHelper.sol:359:             / PRECISION_FACTOR_YEAR;

MainHelper.sol:522:             / PRECISION_FACTOR_YEAR;

MainHelper.sol:526:             / PRECISION_FACTOR_E18;

MainHelper.sol:993:             / PRECISION_FACTOR_E18;

MainHelper.sol:1049:             / PRECISION_FACTOR_E18
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:301:         return (_maxPole - _minPole) / NORMALISATION_FACTOR;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:74:             / totalCollateral;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:201:                 / PRECISION_FACTOR_E18

PendlePowerFarmLeverageLogic.sol:209:             / PRECISION_FACTOR_E18;

PendlePowerFarmLeverageLogic.sol:436:                 / PRECISION_FACTOR_E18,

PendlePowerFarmLeverageLogic.sol:502:             / PRECISION_FACTOR_E18;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:241:             / PRECISION_FACTOR_E18;

PendlePowerFarmMathLogic.sol:282:             / PRECISION_FACTOR_E18;

PendlePowerFarmMathLogic.sol:322:             / PRECISION_FACTOR_E18;

PendlePowerFarmMathLogic.sol:326:             / PRECISION_FACTOR_E18;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol

PendlePowerFarmControllerHelper.sol:39:         uint128 startTime = uint128((block.timestamp / WEEK)

PendlePowerFarmControllerHelper.sol:83:             / PRECISION_FACTOR_E6;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:65:         / PRECISION_FACTOR_YEAR;

PendlePowerFarmToken.sol:288:                     / PRECISION_FACTOR_E18

PendlePowerFarmToken.sol:291:                     / PRECISION_FACTOR_E18;

PendlePowerFarmToken.sol:331:             / totalSupply();

PendlePowerFarmToken.sol:404:             / ONE_WEEK;

PendlePowerFarmToken.sol:431:             / PRECISION_FACTOR_E6;

PendlePowerFarmToken.sol:475:             / totalSupply();
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:439:         transferAmount = product / PRECISION_FACTOR_E18;

WiseCore.sol:472:         uint256 cashoutShares = product / PRECISION_FACTOR_E18 + 1;

WiseCore.sol:617:                 / PRECISION_FACTOR_E18
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:177:             / borrowPoolData[_poolToken].totalBorrowShares;

WiseLending.sol:187:                 / lendingPoolData[_poolToken].totalDepositShares,
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:325:         / PRECISION_FACTOR_YEAR;
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:122:             ) / 10 ** (_decimalsWETH - decimals(_tokenAddress));

OracleHelper.sol:128:         ) / 10 ** (_decimalsWETH - decimals(_tokenAddress));
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:112:                 / 10 ** (tokenDecimals - _decimalsETH)

WiseOracleHub.sol:136:             / 10 ** _decimalsUSD;

WiseOracleHub.sol:163:                 / 10 ** (tokenDecimals - _decimalsETH)

WiseOracleHub.sol:191:                 / 10 ** (_decimalsETH - tokenDecimals);

WiseOracleHub.sol:210:                 / getETHPriceInUSD()

WiseOracleHub.sol:351:                 / 10 ** (_decimalsETH - tokenDecimals);
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:492:             / overallETH;

WiseSecurity.sol:549:             / overallETH;

WiseSecurity.sol:626:                 / totalETHSupply;

WiseSecurity.sol:632:                 / totalETHSupply;

WiseSecurity.sol:683:                 ) / PRECISION_FACTOR_E18;

WiseSecurity.sol:688:             / PRECISION_FACTOR_E18;

WiseSecurity.sol:879:             / PRECISION_FACTOR_E18;
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:46:                 / PRECISION_FACTOR_E18;

WiseSecurityHelper.sol:94:                 ) / PRECISION_FACTOR_E18;

WiseSecurityHelper.sol:176:                 ) / PRECISION_FACTOR_E18;

WiseSecurityHelper.sol:568:             / PRECISION_FACTOR_E18

WiseSecurityHelper.sol:597:             / PRECISION_FACTOR_E18

WiseSecurityHelper.sol:598:             / ONE_YEAR;

WiseSecurityHelper.sol:747:             / PRECISION_FACTOR_E18;

WiseSecurityHelper.sol:828:             / PRECISION_FACTOR_E18

WiseSecurityHelper.sol:893:             : totalSharesUser * MAX_LIQUIDATION_50 / PRECISION_FACTOR_E18;

WiseSecurityHelper.sol:1016:             / PRECISION_FACTOR_E18;

WiseSecurityHelper.sol:1040:             / BORROW_PERCENTAGE_CAP;

WiseSecurityHelper.sol:1044:             / WISE_LENDING.lendingPoolData(_poolToken).collateralFactor;
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:323:             / PRECISION_FACTOR_E9;
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:660:             / PRECISION_FACTOR_E18
```

### <a name="L-12"></a>[L-12] Use `Ownable2Step.transferOwnership` instead of `Ownable.transferOwnership`

Use [Ownable2Step.transferOwnership](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable2Step.sol) which is safer. Use it as it is more secure due to 2-stage ownership transfer.

**Recommended Mitigation Steps**

Use <a href="https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable2Step.sol">Ownable2Step.sol</a>
  
  ```solidity
      function acceptOwnership() external {
          address sender = _msgSender();
          require(pendingOwner() == sender, "Ownable2Step: caller is not the new owner");
          _transferOwnership(sender);
      }
```

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:13: import "../OwnableMaster.sol";
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:7: import "./OwnableMaster.sol";
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:12: import "../../OwnableMaster.sol";
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:5: import "../../OwnableMaster.sol";
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:11: import "../../OwnableMaster.sol";
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:5: import "./OwnableMaster.sol";
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:12: import "../OwnableMaster.sol";
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:17: import "../OwnableMaster.sol";
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:12: import "../OwnableMaster.sol";
```

### <a name="L-13"></a>[L-13] Upgradeable contract not initialized

Upgradeable contracts are initialized via an initializer function rather than by a constructor. Leaving such a contract uninitialized may lead to it being taken over by a malicious user

Affected code:

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:23: error AlreadyInitialized();

PendlePowerFarmToken.sol:682:     function initialize(

PendlePowerFarmToken.sol:692:             revert AlreadyInitialized();
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol

PendlePowerFarmTokenFactory.sol:102:         PendlePowerFarmToken(pendlePowerFarmTokenAddress).initialize(
```

### <a name="L-14"></a>[L-14] A year is not always 365 days

On leap years, the number of days is 366, so calculations during those years will return the wrong value

Affected code:

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:53:     uint256 internal constant ONE_YEAR = 365 days;
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:300:     uint256 internal constant ONE_YEAR = 365 days;
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:210:     uint256 internal constant ONE_YEAR = 365 days;
```


## Informational Issues


||Issue|Instances|
|-|:-|:-:|
| [NC-1](#NC-1) | Return values of `approve()` not checked | 1 |
| [NC-2](#NC-2) | Replace `abi.encodeWithSignature` and `abi.encodeWithSelector` with `abi.encodeCall` which keeps the code typo/type safe | 4 |
| [NC-3](#NC-3) | For readability, add commented parameter names (`Type Location /* name */`) | 234 |
| [NC-4](#NC-4) | Use `string.concat()` or `bytes.concat()` instead of `abi.encodePacked` | 6 |
| [NC-5](#NC-5) | Constants should be in CONSTANT_CASE | 2 |
| [NC-6](#NC-6) | `constant`s should be defined rather than using magic numbers | 43 |
| [NC-7](#NC-7) | Constants in comparisons should appear on the left side | 112 |
| [NC-8](#NC-8) | Control structures do not follow the Solidity Style Guide | 57 |
| [NC-9](#NC-9) | Default Visibility for constants | 1 |
| [NC-10](#NC-10) | Consider using `delete` rather than assigning zero to clear values | 6 |
| [NC-11](#NC-11) | Consider disabling `renounceOwnership()` | 7 |
| [NC-12](#NC-12) | Functions should not be longer than 50 lines | 6 |
| [NC-13](#NC-13) | Imports could be organized more systematically | 5 |
| [NC-14](#NC-14) | Use a `modifier` instead of a `require/if` statement for a special `msg.sender` actor | 25 |
| [NC-15](#NC-15) | Consider using named mappings | 51 |
| [NC-16](#NC-16) | `address`s shouldn't be hard-coded | 7 |
| [NC-17](#NC-17) | Take advantage of Custom Error's return value property | 167 |
| [NC-18](#NC-18) | Use scientific notation (e.g. `1e18`) rather than exponentiation (e.g. `10**18`) | 16 |
| [NC-19](#NC-19) | Avoid the use of sensitive terms | 17 |
| [NC-20](#NC-20) | Consider using `uint48` for time-related variables | 78 |
| [NC-21](#NC-21) | Import declarations should import specific identifiers, rather than the whole file | 115 |
| [NC-22](#NC-22) | Use Underscores for Number Literals (add an underscore every 3 digits) | 11 |
| [NC-23](#NC-23) | Variables need not be initialized to zero | 1 |
### <a name="NC-1"></a>[NC-1] Return values of `approve()` not checked

Not all IERC20 implementations `revert()` when there's a failure in `approve()`. The function signature has a boolean return value and they indicate errors that way instead. By not checking the return value, operations that should have marked as failed, may potentially go through without actually approving anything

Affected code:

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:197:             POSITION_NFT.approve(
```

### <a name="NC-2"></a>[NC-2] Replace `abi.encodeWithSignature` and `abi.encodeWithSelector` with `abi.encodeCall` which keeps the code typo/type safe

When using `abi.encodeWithSignature`, it is possible to include a typo for the correct function signature.
When using `abi.encodeWithSignature` or `abi.encodeWithSelector`, it is also possible to provide parameters that are not of the correct type for the function.

To avoid these pitfalls, it would be best to use [`abi.encodeCall`](https://solidity-by-example.org/abi-encode/) instead.

Affected code:

- [contracts/TransferHub/ApprovalHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/ApprovalHelper.sol)

```solidity
# File: contracts/TransferHub/ApprovalHelper.sol

ApprovalHelper.sol:22:             abi.encodeWithSelector(
```

- [contracts/TransferHub/TransferHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/TransferHelper.sol)

```solidity
# File: contracts/TransferHub/TransferHelper.sol

TransferHelper.sol:22:             abi.encodeWithSelector(

TransferHelper.sol:44:             abi.encodeWithSelector(
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:79:             abi.encodeWithSignature(
```

### <a name="NC-3"></a>[NC-3] For readability, add commented parameter names (`Type Location /* name */`)

When the return statement is documented but unnamed, consider adding a little comment with the name as such: `Type Location /* name */`.

As an example:

```diff
-  ) public view returns (string memory) {
+  ) public view returns (string memory /* Giving a Name Here to Explain the Intent of the Returned Value */) {
```

Affected code:

- [contracts/DerivativeOracles/CustomOracleSetup.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/CustomOracleSetup.sol)

```solidity
# File: contracts/DerivativeOracles/CustomOracleSetup.sol

CustomOracleSetup.sol:64:         returns (uint256)
```

- [contracts/DerivativeOracles/PendleChildLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleChildLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleChildLpOracle.sol

PendleChildLpOracle.sol:38:         returns (uint256)

PendleChildLpOracle.sol:50:         returns (uint8)
```

- [contracts/DerivativeOracles/PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleLpOracle.sol

PendleLpOracle.sol:86:         returns (uint256)

PendleLpOracle.sol:128:         returns (uint256)

PendleLpOracle.sol:142:         returns (uint8)
```

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:84:         returns (uint256)

PtOracleDerivative.sol:137:         returns (uint8)
```

- [contracts/DerivativeOracles/PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOraclePure.sol)

```solidity
# File: contracts/DerivativeOracles/PtOraclePure.sol

PtOraclePure.sol:71:         returns (uint256)

PtOraclePure.sol:116:         returns (uint8)
```

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:875:         returns (uint256)

FeeManager.sol:889:         returns (address)
```

- [contracts/FeeManager/FeeManagerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManagerHelper.sol)

```solidity
# File: contracts/FeeManager/FeeManagerHelper.sol

FeeManagerHelper.sol:298:         returns (uint256)

FeeManagerHelper.sol:337:         returns (uint256)
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:24:         returns (uint256)

MainHelper.sol:40:         returns (uint256)

MainHelper.sol:62:         returns (uint256)

MainHelper.sol:85:         returns (uint256)

MainHelper.sol:99:         returns (uint256)

MainHelper.sol:120:         returns (uint256)

MainHelper.sol:143:         returns (uint256)

MainHelper.sol:168:         returns (uint256)

MainHelper.sol:209:         returns (bool)

MainHelper.sol:279:         returns (uint256)

MainHelper.sol:351:         returns (uint256)

MainHelper.sol:393:         returns (address[] memory)

MainHelper.sol:649:         returns (bytes32)

MainHelper.sol:666:         function(uint256) view returns (uint256) _getPositionTokenLength,

MainHelper.sol:667:         function(uint256, uint256) view returns (address) _getPositionTokenByIndex,

MainHelper.sol:816:         returns (bool)

MainHelper.sol:832:         returns (bool)

MainHelper.sol:897:         returns (bool)

MainHelper.sol:989:         returns (bool)
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:283:         returns (uint256)

PoolManager.sol:299:         returns (uint256)

PoolManager.sol:310:         returns (uint256)
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:63:         returns (uint256)

PositionNFTs.sol:74:         returns (uint256)

PositionNFTs.sol:85:         returns (uint256)

PositionNFTs.sol:103:         returns (uint256)

PositionNFTs.sol:114:         returns (uint256)

PositionNFTs.sol:129:         returns (address)

PositionNFTs.sol:148:         returns (uint256)

PositionNFTs.sol:167:         returns (uint256)

PositionNFTs.sol:198:         returns (bool)

PositionNFTs.sol:246:         returns (uint256[] memory)

PositionNFTs.sol:316:         returns (string memory)
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:46:         returns (uint256)

PendlePowerFarm.sol:62:         returns (uint256)
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:237:         returns (uint256)

PendlePowerFarmLeverageLogic.sol:271:         returns (uint256)

PendlePowerFarmLeverageLogic.sol:298:         returns (uint256)
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:62:         returns (uint256)

PendlePowerFarmMathLogic.sol:80:         returns (uint256)

PendlePowerFarmMathLogic.sol:141:         returns (uint256)

PendlePowerFarmMathLogic.sol:158:         returns (uint256)

PendlePowerFarmMathLogic.sol:179:         returns (uint256)

PendlePowerFarmMathLogic.sol:234:         returns (uint256)

PendlePowerFarmMathLogic.sol:250:         returns (uint256)

PendlePowerFarmMathLogic.sol:264:         returns (uint256)

PendlePowerFarmMathLogic.sol:278:         returns (uint256)

PendlePowerFarmMathLogic.sol:349:         returns (uint256)

PendlePowerFarmMathLogic.sol:394:         returns (bool)

PendlePowerFarmMathLogic.sol:409:         returns (bool)
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:105:         returns (uint256)

PendlePowerManager.sol:151:         returns (uint256)

PendlePowerManager.sol:187:         returns (uint256)
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:60:         returns (uint256)

PendlePowerFarmController.sol:176:         returns (uint256)

PendlePowerFarmController.sol:298:         returns (bool)
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol

PendlePowerFarmControllerHelper.sol:15:         returns (uint256)

PendlePowerFarmControllerHelper.sol:37:         returns (uint128)

PendlePowerFarmControllerHelper.sol:48:         returns (uint256)

PendlePowerFarmControllerHelper.sol:56:         returns (uint256)

PendlePowerFarmControllerHelper.sol:66:         returns (LockedPosition memory)

PendlePowerFarmControllerHelper.sol:79:         returns (uint256)

PendlePowerFarmControllerHelper.sol:100:         returns (uint256[] memory)

PendlePowerFarmControllerHelper.sol:110:         returns (uint128[] memory)

PendlePowerFarmControllerHelper.sol:120:         returns (address[] memory)

PendlePowerFarmControllerHelper.sol:128:         returns (uint256)

PendlePowerFarmControllerHelper.sol:149:         returns (address[] memory)

PendlePowerFarmControllerHelper.sol:163:         returns (UserReward memory)

PendlePowerFarmControllerHelper.sol:180:         returns (uint128)

PendlePowerFarmControllerHelper.sol:195:         returns (uint256)

PendlePowerFarmControllerHelper.sol:209:         returns (uint256)

PendlePowerFarmControllerHelper.sol:223:         returns (bool)

PendlePowerFarmControllerHelper.sol:248:         returns (uint256)

PendlePowerFarmControllerHelper.sol:256:         returns (uint256)
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:103:         returns (uint256)

PendlePowerFarmToken.sol:162:         returns (bool)

PendlePowerFarmToken.sol:220:         returns (uint256[] memory)

PendlePowerFarmToken.sol:308:         returns (uint256)

PendlePowerFarmToken.sol:318:         returns (uint256)

PendlePowerFarmToken.sol:328:         returns (uint256)

PendlePowerFarmToken.sol:378:         returns (UserReward memory)

PendlePowerFarmToken.sol:389:         returns (uint256)

PendlePowerFarmToken.sol:427:         returns (uint256)

PendlePowerFarmToken.sol:437:         returns (uint256)

PendlePowerFarmToken.sol:446:         returns (uint256)

PendlePowerFarmToken.sol:458:         returns (uint256)

PendlePowerFarmToken.sol:471:         returns (uint256)

PendlePowerFarmToken.sol:484:         returns (uint256)

PendlePowerFarmToken.sol:497:         returns (bool)

PendlePowerFarmToken.sol:613:         returns (uint256)

PendlePowerFarmToken.sol:652:         returns (uint256)
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol

PendlePowerFarmTokenFactory.sol:42:         returns (address)
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:65:         returns (uint256)

MinterReserver.sol:72:         returns (uint256)

MinterReserver.sol:82:         returns (uint256)

MinterReserver.sol:102:         returns (bool)

MinterReserver.sol:120:         returns (uint256)

MinterReserver.sol:143:         returns (uint256)

MinterReserver.sol:167:         returns (bytes4)
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:21:         returns (uint256);

PowerFarmNFTs.sol:99:         returns (bool)

PowerFarmNFTs.sol:114:         returns (uint256[] memory)

PowerFarmNFTs.sol:188:         returns (string memory)
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:113:         returns (uint256)

WiseCore.sol:467:         returns (uint256)

WiseCore.sol:611:         returns (uint256)
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:260:         returns (uint256)

WiseLending.sol:394:         returns (uint256)

WiseLending.sol:405:         returns (uint256)

WiseLending.sol:430:         returns (uint256)

WiseLending.sol:447:         returns (uint256)

WiseLending.sol:467:         returns (uint256)

WiseLending.sol:643:         returns (uint256)

WiseLending.sol:682:         returns (uint256)

WiseLending.sol:722:         returns (uint256)

WiseLending.sol:868:         returns (uint256)

WiseLending.sol:910:         returns (uint256)

WiseLending.sol:948:         returns (uint256)

WiseLending.sol:982:         returns (uint256)

WiseLending.sol:1024:         returns (uint256)

WiseLending.sol:1064:         returns (uint256)

WiseLending.sol:1094:         returns (uint256)

WiseLending.sol:1168:         returns (uint256)

WiseLending.sol:1211:         returns (uint256)

WiseLending.sol:1260:         returns (uint256)

WiseLending.sol:1326:         returns (uint256)

WiseLending.sol:1525:         returns (uint256)

WiseLending.sol:1560:         returns (uint256)

WiseLending.sol:1590:         returns (uint256)
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:44:         returns (uint256)

WiseLowLevelHelper.sol:54:         returns (uint256)

WiseLowLevelHelper.sol:64:         returns (uint256)

WiseLowLevelHelper.sol:74:         returns (uint256)

WiseLowLevelHelper.sol:84:         returns (uint256)

WiseLowLevelHelper.sol:94:         returns (uint256)

WiseLowLevelHelper.sol:105:         returns (uint256)

WiseLowLevelHelper.sol:116:         returns (uint256)

WiseLowLevelHelper.sol:127:         returns (uint256)

WiseLowLevelHelper.sol:139:         returns (uint256)

WiseLowLevelHelper.sol:150:         returns (address)

WiseLowLevelHelper.sol:160:         returns (uint256)

WiseLowLevelHelper.sol:171:         returns (address)

WiseLowLevelHelper.sol:181:         returns (uint256)

WiseLowLevelHelper.sol:366:         returns (bool)

WiseLowLevelHelper.sol:398:         returns (bool)
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:64:         returns (bool)

OracleHelper.sol:111:         returns (uint256)

OracleHelper.sol:136:         returns (uint256)

OracleHelper.sol:222:         returns (uint256)

OracleHelper.sol:251:         returns (uint256)

OracleHelper.sol:268:         returns (uint256)

OracleHelper.sol:380:         returns (uint256)

OracleHelper.sol:399:         returns (uint128)

OracleHelper.sol:411:         returns (int24)

OracleHelper.sol:455:         returns (uint8)

OracleHelper.sol:466:         returns (uint256)

OracleHelper.sol:524:         returns (bool)

OracleHelper.sol:561:         returns (bool)

OracleHelper.sol:597:         returns (uint256)

OracleHelper.sol:680:         returns (uint256)
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:74:         returns (uint256)

WiseOracleHub.sol:90:         returns (uint8)

WiseOracleHub.sol:102:         returns (uint256)

WiseOracleHub.sol:129:         returns (uint256)

WiseOracleHub.sol:149:         returns (uint256)

WiseOracleHub.sol:177:         returns (uint256)

WiseOracleHub.sol:204:         returns (uint256)

WiseOracleHub.sol:333:         returns (uint256)

WiseOracleHub.sol:424:         returns (uint256)
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:64:         returns (uint256)

WiseSecurity.sol:447:         returns (uint256)

WiseSecurity.sol:504:         returns (uint256)

WiseSecurity.sol:646:         returns (uint256)

WiseSecurity.sol:772:         returns (uint256)

WiseSecurity.sol:834:         returns (uint256)

WiseSecurity.sol:913:         returns (uint256)

WiseSecurity.sol:950:         returns (uint256)

WiseSecurity.sol:1066:         returns (bool)

WiseSecurity.sol:1084:         returns (bool)

WiseSecurity.sol:1098:         returns (bool)
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:230:         returns (bool)

WiseSecurityHelper.sol:288:         returns (uint256)

WiseSecurityHelper.sol:329:         returns (uint256)

WiseSecurityHelper.sol:346:         returns (uint256)

WiseSecurityHelper.sol:475:         returns (bool)

WiseSecurityHelper.sol:536:         returns (uint256)

WiseSecurityHelper.sol:560:         returns (uint256)

WiseSecurityHelper.sol:584:         returns (uint256)

WiseSecurityHelper.sol:617:         returns (uint256)

WiseSecurityHelper.sol:657:         returns (uint256)

WiseSecurityHelper.sol:692:         returns (bool)

WiseSecurityHelper.sol:723:         returns (uint256)

WiseSecurityHelper.sol:743:         returns (uint256)

WiseSecurityHelper.sol:769:         returns (uint256)

WiseSecurityHelper.sol:812:         returns (bool)

WiseSecurityHelper.sol:912:         returns (bool)

WiseSecurityHelper.sol:928:         returns (uint256)

WiseSecurityHelper.sol:951:         returns (uint256)

WiseSecurityHelper.sol:990:         returns (uint256)

WiseSecurityHelper.sol:1004:         returns (uint256)

WiseSecurityHelper.sol:1036:         returns (uint256)
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:49:         returns (uint256)

AaveHelper.sol:62:         returns (uint256)

AaveHelper.sol:120:         returns (uint256)

AaveHelper.sol:148:         returns (uint256)

AaveHelper.sol:320:         returns (uint256)
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:108:         returns (uint256)

AaveHub.sol:130:         returns (uint256)

AaveHub.sol:161:         returns (uint256)

AaveHub.sol:178:         returns (uint256)

AaveHub.sol:210:         returns (uint256)

AaveHub.sol:244:         returns (uint256)

AaveHub.sol:289:         returns (uint256)

AaveHub.sol:320:         returns (uint256)

AaveHub.sol:365:         returns (uint256)

AaveHub.sol:399:         returns (uint256)

AaveHub.sol:441:         returns (uint256)

AaveHub.sol:488:         returns (uint256)

AaveHub.sol:564:         returns (uint256)

AaveHub.sol:640:         returns (uint256)
```

### <a name="NC-4"></a>[NC-4] Use `string.concat()` or `bytes.concat()` instead of `abi.encodePacked`

Solidity version 0.8.4 introduces `bytes.concat()` (vs `abi.encodePacked(<bytes>,<bytes>)`)

Solidity version 0.8.12 introduces `string.concat()` (vs `abi.encodePacked(<str>,<str>), which catches concatenation errors (in the event of a `bytes` data mixed in the concatenation)`)

Affected code:

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:652:             abi.encodePacked(
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:330:             abi.encodePacked(
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol

PendlePowerFarmTokenFactory.sol:24:                 abi.encodePacked(

PendlePowerFarmTokenFactory.sol:66:             abi.encodePacked(
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:202:             abi.encodePacked(
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:48:                         abi.encodePacked(
```

### <a name="NC-5"></a>[NC-5] Constants should be in CONSTANT_CASE

For `constant` variable names, each word should use all capital letters, with underscores separating each word (CONSTANT_CASE)

Affected code:

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:97:     uint8 internal constant _decimalsUSD = 8;

Declarations.sol:100:     uint8 internal constant _decimalsETH = 18;
```

### <a name="NC-6"></a>[NC-6] `constant`s should be defined rather than using magic numbers

Even [assembly](https://github.com/code-423n4/2022-05-opensea-seaport/blob/9d7ce4d08bf3c3010304a0476a785c70c0e90ae7/contracts/lib/TokenTransferrer.sol#L35-L39) can benefit from using readable constants instead of hex/numeric literals

Affected code:

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:38:         POW_USD_FEED = 10 ** USD_FEED_ASSET.decimals();

PtOracleDerivative.sol:39:         POW_ETH_USD_FEED = 10 ** ETH_FEED_ASSET.decimals();
```

- [contracts/DerivativeOracles/PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOraclePure.sol)

```solidity
# File: contracts/DerivativeOracles/PtOraclePure.sol

PtOraclePure.sol:35:         POW_FEED = 10 ** FEED_ASSET.decimals();
```

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:88:         paybackIncentive = 5 * PRECISION_FACTOR_E16;

DeclarationsFeeManager.sol:93:         incentiveUSD[incentiveOwnerA] = 98000 * PRECISION_FACTOR_E18;

DeclarationsFeeManager.sol:94:         incentiveUSD[incentiveOwnerB] = 106500 * PRECISION_FACTOR_E18;
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:212:             poolFee: 20 * PRECISION_FACTOR_E16

PoolManager.sol:285:         return PRECISION_FACTOR_E18 / 2

PoolManager.sol:286:             + (PRECISION_FACTOR_E36 / 4

PoolManager.sol:312:         return (_maxPole + _minPole) / 2;
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:357:             j /= 10;

PositionNFTs.sol:370:                     48 + (j % 10)

PositionNFTs.sol:373:             j /= 10;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:258:             minDepositEthAmount = 3 ether;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:188:         uint256 reverseAllowedSpread = 2

PendlePowerFarmLeverageLogic.sol:423:         uint256 reverseAllowedSpread = 2

PendlePowerFarmLeverageLogic.sol:475:                         guessMin: netPtFromSwap - 100,

PendlePowerFarmLeverageLogic.sol:476:                         guessMax: netPtFromSwap + 100,

PendlePowerFarmLeverageLogic.sol:478:                         maxIteration: 50,
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:122:         exchangeIncentive = 50000;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:730:         mintFee = 3000;
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:229:             j /= 10;

PowerFarmNFTs.sol:242:                     48 + j % 10

PowerFarmNFTs.sol:245:             j /= 10;
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:171:         / 10;
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:112:     uint256 internal ALLOWED_DIFFERENCE = 10250;
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:122:             ) / 10 ** (_decimalsWETH - decimals(_tokenAddress));

OracleHelper.sol:128:         ) / 10 ** (_decimalsWETH - decimals(_tokenAddress));

OracleHelper.sol:402:             10 ** _tokenDecimals[_tokenAddress]

OracleHelper.sol:414:             2
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:111:                 / 10 ** decimals(_tokenAddress)

WiseOracleHub.sol:112:                 / 10 ** (tokenDecimals - _decimalsETH)

WiseOracleHub.sol:116:                 / 10 ** decimals(_tokenAddress);

WiseOracleHub.sol:136:             / 10 ** _decimalsUSD;

WiseOracleHub.sol:162:                 / 10 ** decimals(_tokenAddress)

WiseOracleHub.sol:163:                 / 10 ** (tokenDecimals - _decimalsETH)

WiseOracleHub.sol:167:                 / 10 ** decimals(_tokenAddress);

WiseOracleHub.sol:191:                 / 10 ** (_decimalsETH - tokenDecimals);

WiseOracleHub.sol:351:                 / 10 ** (_decimalsETH - tokenDecimals);
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:110:                 _baseReward: 10 * PRECISION_FACTOR_E16,

WiseSecurityDeclarations.sol:111:                 _baseRewardFarm: 3 * PRECISION_FACTOR_E16,

WiseSecurityDeclarations.sol:112:                 _newMaxFeeETH: 3 * PRECISION_FACTOR_E18,

WiseSecurityDeclarations.sol:113:                 _newMaxFeeFarmETH: 3 * PRECISION_FACTOR_E18
```

### <a name="NC-7"></a>[NC-7] Constants in comparisons should appear on the left side

Doing so will prevent [typo bugs](https://www.moserware.com/2008/01/constants-on-left-are-better-but-this.html)

Affected code:

- [contracts/DerivativeOracles/PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleLpOracle.sol

PendleLpOracle.sol:44:         if (FEED_ASSET.decimals() != DEFAULT_DECIMALS) {
```

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:45:         if (_aaveAddress == ZERO_ADDRESS) {

DeclarationsFeeManager.sol:49:         if (_wiseLendingAddress == ZERO_ADDRESS) {

DeclarationsFeeManager.sol:53:         if (_oracleHubAddress == ZERO_ADDRESS) {

DeclarationsFeeManager.sol:57:         if (_wiseSecurityAddress == ZERO_ADDRESS) {

DeclarationsFeeManager.sol:61:         if (_positionNFTAddress == ZERO_ADDRESS) {
```

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:179:         if (_proposedIncentiveMaster == ZERO_ADDRESS) {

FeeManager.sol:291:         if (amount == 0) {

FeeManager.sol:640:         if (shares == 0) {

FeeManager.sol:663:         if (totalBadDebtETH == 0) {

FeeManager.sol:746:         if (badDebtPosition[_nftId] == 0) {

FeeManager.sol:753:         if (WISE_LENDING.getTotalDepositShares(_receivingToken) == 0) {

FeeManager.sol:757:         if (WISE_LENDING.getTotalDepositShares(_paybackToken) == 0) {

FeeManager.sol:828:         if (badDebtPosition[_nftId] == 0) {

FeeManager.sol:832:         if (WISE_LENDING.getTotalDepositShares(_paybackToken) == 0) {
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:538:         if (feeAmount == 0) {

MainHelper.sol:550:         if (feeShares == 0) {

MainHelper.sol:677:         if (length == 1) {

MainHelper.sol:834:         return userLendingData[_nftId][_poolToken].shares == 0

MainHelper.sol:835:             && pureCollateralAmount[_nftId][_poolToken] == 0;

MainHelper.sol:1157:         if (_nftId == 0) {
```

- [contracts/OwnableMaster.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/OwnableMaster.sol)

```solidity
# File: contracts/OwnableMaster.sol

OwnableMaster.sol:60:         if (_master == ZERO_ADDRESS) {

OwnableMaster.sol:76:         if (_proposedOwner == ZERO_ADDRESS) {
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:174:         if (_params.poolToken == ZERO_ADDRESS) {
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:200:         if (_nftId == FEE_MANAGER_NFT) {

PositionNFTs.sol:325:         if (bytes(currentBaseURI).length == 0) {

PositionNFTs.sol:348:         if (_tokenId == 0) {

PositionNFTs.sol:355:         while (j != 0) {

PositionNFTs.sol:367:         while (j != 0) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:68:         if (totalCollateral == 0) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:257:         if (block.chainid == ETH_CHAIN_ID) {

PendlePowerFarmDeclarations.sol:277:         if (block.chainid == ETH_CHAIN_ID) {

PendlePowerFarmDeclarations.sol:285:         if (block.chainid == ARB_CHAIN_ID) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:73:         if (_flashloanToken.length == 0) {

PendlePowerFarmLeverageLogic.sol:77:         if (msg.sender != BALANCER_ADDRESS) {

PendlePowerFarmLeverageLogic.sol:174:         address tokenOut = block.chainid == 1

PendlePowerFarmLeverageLogic.sol:195:                 block.chainid == 1

PendlePowerFarmLeverageLogic.sol:239:         if (block.chainid == ETH_CHAIN_ID) {

PendlePowerFarmLeverageLogic.sol:246:         if (block.chainid == ARB_CHAIN_ID) {

PendlePowerFarmLeverageLogic.sol:427:         if (block.chainid == ARB_CHAIN_ID) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:213:         if (borrowTokenAmountAave == 0) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:189:         if (availableNFTCount == 0) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:124:         if (_pendleChildShares == 0) {

PendlePowerFarmController.sol:182:         if (childMarket == ZERO_ADDRESS) {

PendlePowerFarmController.sol:345:         if (child == ZERO_ADDRESS) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:90:         IS_ETH_MAIN = block.chainid == MAINNET_CHAIN_ID

PendlePowerFarmControllerBase.sol:240:         if (block.chainid != ARBITRUM_CHAIN_ID) {

PendlePowerFarmControllerBase.sol:265:         if (child == ZERO_ADDRESS) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol

PendlePowerFarmControllerHelper.sol:139:         if (ORACLE_HUB.priceFeed(token) == ZERO_ADDRESS) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:76:         if (msg.sender != PENDLE_POWER_FARM_CONTROLLER) {

PendlePowerFarmToken.sol:255:             if (lastIndex[i] == 0 && index > 0) {

PendlePowerFarmToken.sol:339:         if (additonalAssets == 0) {

PendlePowerFarmToken.sol:391:         if (totalLpAssetsToDistribute == 0) {

PendlePowerFarmToken.sol:489:         return product % _underlyingLpAssetsCurrent == 0

PendlePowerFarmToken.sol:508:         if (_amount == 0) {

PendlePowerFarmToken.sol:514:         if (msg.sender == PENDLE_POWER_FARM_CONTROLLER) {

PendlePowerFarmToken.sol:539:         if (_underlyingLpAssetAmount == 0) {

PendlePowerFarmToken.sol:548:         if (shares == 0) {

PendlePowerFarmToken.sol:559:         if (feeShares == 0) {

PendlePowerFarmToken.sol:615:         if (_shares == 0) {

PendlePowerFarmToken.sol:635:         if (msg.sender == PENDLE_POWER_FARM_CONTROLLER) {

PendlePowerFarmToken.sol:654:         if (_underlyingLpAssetAmount == 0) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol

PendlePowerFarmTokenFactory.sol:44:         if (msg.sender != PENDLE_POWER_FARM_CONTROLLER) {
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:122:         if (_keyId == 0) {
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:57:         if (farmContract == ZERO_ADDRESS) {

PowerFarmNFTs.sol:197:         if (bytes(currentBaseURI).length == 0) {

PowerFarmNFTs.sol:220:         if (_tokenId == 0) {

PowerFarmNFTs.sol:227:         while (j != 0) {

PowerFarmNFTs.sol:239:         while (j != 0) {
```

- [contracts/TransferHub/CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/CallOptionalReturn.sol)

```solidity
# File: contracts/TransferHub/CallOptionalReturn.sol

CallOptionalReturn.sol:26:         bool results = returndata.length == 0 || abi.decode(
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:278:         if (_caller == AAVE_HUB_ADDRESS) {

WiseCore.sol:588:         if (userShares == 0) {
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:53:         if (msg.sender == WETH_ADDRESS) {
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:119:         if (_wiseOracleHub == ZERO_ADDRESS) {

WiseLendingDeclaration.sol:123:         if (_nftContract == ZERO_ADDRESS) {

WiseLendingDeclaration.sol:261:         if (msg.sender != AAVE_HUB_ADDRESS) {
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:453:         if (_value == 0) {
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:72:         IS_ARBITRUM_CHAIN = block.chainid == ARBITRUM_CHAIN_ID;
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:74:         if (size == 0) {

OracleHelper.sol:311:         if (_tokenAddress == ZERO_ADDRESS) {

OracleHelper.sol:331:         if (_pool == ZERO_ADDRESS) {

OracleHelper.sol:350:         if (priceFeed[_tokenAddress] == ZERO_FEED) {

OracleHelper.sol:439:         if (tickCumulativesDelta < 0 && (tickCumulativesDelta % twapPeriodInt56 != 0)) {

OracleHelper.sol:537:         if (answer == 1) {

OracleHelper.sol:566:         if (heartBeat[_tokenAddress] == 0) {
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:151:         if (_tokenAddress == WETH_ADDRESS) {

WiseOracleHub.sol:335:         if (_tokenAddress == WETH_ADDRESS) {

WiseOracleHub.sol:455:         if (length == 0) {
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:70:         if (overallCollateral == 0) {

WiseSecurity.sol:170:         if (curveMetaPool == ZERO_ADDRESS) {

WiseSecurity.sol:201:         if (curvePool == ZERO_ADDRESS) {

WiseSecurity.sol:218:         if (curveMeta == ZERO_ADDRESS) {

WiseSecurity.sol:267:         if (WISE_LENDING.getPositionBorrowTokenLength(_nftId) == 0) {

WiseSecurity.sol:453:         if (len == 0) {

WiseSecurity.sol:510:         if (len == 0) {

WiseSecurity.sol:652:         if (len == 0) {

WiseSecurity.sol:924:         if (currentTotalBorrowShares == 0) {

WiseSecurity.sol:961:         if (currentTotalLendingShares == 0) {

WiseSecurity.sol:1100:         if (minDepositEthValue == ONE_WEI) {

WiseSecurity.sol:1117:         if (_newMinDepositValue == 0) {
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:61:         if (_wiseLendingAddress == ZERO_ADDRESS) {

WiseSecurityDeclarations.sol:65:         if (_aaveHubAddress == ZERO_ADDRESS) {

WiseSecurityDeclarations.sol:106:         IS_ETH_MAINNET = block.chainid == 1;
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:210:         if (WISE_LENDING.getPositionLendingShares(_nftId, _poolToken) == 0) {

WiseSecurityHelper.sol:295:         if (lendingShares == 0) {

WiseSecurityHelper.sol:624:         if (borrowShares == 0) {

WiseSecurityHelper.sol:818:         if (borrowAmount == 0) {

WiseSecurityHelper.sol:1010:         if (pseudoTotalPool == 0) {
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:29:         if (WISE_LENDING.getTotalDepositShares(_poolToken) == 0) {
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:87:         if (msg.sender == WETH_ADDRESS) {
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:57:         if (_aaveAddress == ZERO_ADDRESS) {

Declarations.sol:61:         if (_lendingAddress == ZERO_ADDRESS) {
```

### <a name="NC-8"></a>[NC-8] Control structures do not follow the Solidity Style Guide

See the [control structures](https://docs.soliditylang.org/en/latest/style-guide.html#control-structures) section of the Solidity Style Guide

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:8: import "../InterfaceHub/IFeeManager.sol";
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:316:             uint256 difference = amountContract - (

MainHelper.sol:320:             uint256 allowedDifference = _getAllowedDifference(

MainHelper.sol:328:                     allowedDifference

MainHelper.sol:336:                 difference

MainHelper.sol:346:     function _getAllowedDifference(

MainHelper.sol:353:         uint256 timeDifference = block.timestamp

MainHelper.sol:356:         return timeDifference
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:125:     function setVerifiedIsolationPool(

PoolManager.sol:132:         verifiedIsolationPool[_isolationPool] = _state;
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:150:         if (isApprovedForAll(
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:9:     IFlashLoanRecipient
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:198:         uint256 difference = balance

PendlePowerFarmController.sol:205:             difference

PendlePowerFarmController.sol:208:         return difference;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:210:     modifier syncSupply(

PendlePowerFarmControllerBase.sol:220:     modifier onlyChildContract(

PendlePowerFarmControllerBase.sol:230:     modifier onlyArbitrum()
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:81:     modifier syncSupply()

PendlePowerFarmToken.sol:120:         uint256 timeDifference = block.timestamp

PendlePowerFarmToken.sol:123:         uint256 maximum = timeDifference

PendlePowerFarmToken.sol:274:             uint256 indexDiff = index

PendlePowerFarmToken.sol:284:                 ? indexDiff

PendlePowerFarmToken.sol:289:                 : indexDiff
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:32:     modifier onlyKeyOwner(
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:116:         IFarmContract farm = IFarmContract(
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:501:         uint256 shareDifference = cashoutShares

WiseCore.sol:514:             shareDifference

WiseCore.sol:520:             shareDifference
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:67:     modifier healthStateCheck(

WiseLending.sol:97:     modifier syncPool(

WiseLending.sol:262:         uint256 timeDifference = block.timestamp

WiseLending.sol:265:         return timeDifference
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:11: import "./InterfaceHub/IFeeManagerLight.sol";

WiseLendingDeclaration.sol:154:         FEE_MANAGER = IFeeManagerLight(

WiseLendingDeclaration.sol:177:     IFeeManagerLight internal FEE_MANAGER;

WiseLendingDeclaration.sol:288:     mapping(address => bool) public verifiedIsolationPool;
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:112:     uint256 internal ALLOWED_DIFFERENCE = 10250;
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:163:             uint256 relativeDifference = _getRelativeDifference(

OracleHelper.sol:168:             _compareDifference(

OracleHelper.sol:169:                 relativeDifference

OracleHelper.sol:216:     function _getRelativeDifference(

OracleHelper.sol:235:     function _compareDifference(

OracleHelper.sol:236:         uint256 _relativeDifference

OracleHelper.sol:621:         uint256 currentDiff;

OracleHelper.sol:632:             currentDiff = latestTimestamp

OracleHelper.sol:640:                 currentBiggest = currentDiff;

OracleHelper.sol:643:                 currentSecondBiggest = currentDiff;
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:424:             uint256 diff = totalBorrow

WiseSecurity.sol:428:                 diff

WiseSecurity.sol:433:                 diff
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:9: import "../InterfaceHub/IFeeManager.sol";

WiseSecurityDeclarations.sol:28: error NonVerifiedPool();

WiseSecurityDeclarations.sol:94:         FEE_MANAGER = IFeeManager(

WiseSecurityDeclarations.sol:191:     IFeeManager public immutable FEE_MANAGER;
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:973:         if (POSITION_NFTS.isOwner(
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:14:     modifier validToken(
```

### <a name="NC-9"></a>[NC-9] Default Visibility for constants

Some constants are using the default visibility. For readability, consider explicitly declaring them as `internal`.

Affected code:

- [contracts/DerivativeOracles/PendleChildLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleChildLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleChildLpOracle.sol

PendleChildLpOracle.sol:18:     uint8 constant DECIMALS_PRECISION = 18;
```

### <a name="NC-10"></a>[NC-10] Consider using `delete` rather than assigning zero to clear values

The `delete` keyword more closely matches the semantics of what is being done, and draws more attention to the changing of state, which may lead to a more thorough audit of its associated logic

Affected code:

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:228:             reservedKeys[msg.sender] = 0;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:256:                 rewardsOutsideArray[i] = 0;

PendlePowerFarmToken.sol:267:                 rewardsOutsideArray[i] = 0;
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:418:         secondsAgo[1] = 0;
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:600:         i = 0;

WiseSecurity.sol:732:         i = 0;
```

### <a name="NC-11"></a>[NC-11] Consider disabling `renounceOwnership()`

If the plan for your project does not include eventually giving up all ownership control, consider overwriting OpenZeppelin's `Ownable`'s `renounceOwnership()` function in order to disable it.

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:31: contract DeclarationsFeeManager is FeeManagerEvents, OwnableMaster {
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:11: contract PositionNFTs is ERC721Enumerable, OwnableMaster {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:15: contract PendlePowerManager is OwnableMaster, PendlePowerFarm, MinterReserver {
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:24: contract PowerFarmNFTs is ERC721Enumerable, OwnableMaster {
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:33: abstract contract Declarations is OwnableMaster {
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:45: contract WiseSecurityDeclarations is OwnableMaster {
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:21: contract Declarations is OwnableMaster, AaveEvents, WrapperHelper {
```

### <a name="NC-12"></a>[NC-12] Functions should not be longer than 50 lines

Overly complex code can make understanding functionality more difficult, try to further modularize your code to ensure readability 

Affected code:

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:666:         function(uint256) view returns (uint256) _getPositionTokenLength,

MainHelper.sol:667:         function(uint256, uint256) view returns (address) _getPositionTokenByIndex,

MainHelper.sol:668:         function(uint256, address) internal _deleteLastPositionData,
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:53:     function exchangeRewardsForCompoundingWithIncentive(
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol

PendlePowerFarmControllerHelper.sol:95:     function pendleChildCompoundInfoReservedForCompound(
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:45:         if (_checkFunctionExistence(address(tokenAggregator)) == false) {
```

### <a name="NC-13"></a>[NC-13] Imports could be organized more systematically

The contract's interface should be imported first, followed by each of the interfaces it uses, followed by all other files. The examples below do not follow this layout.

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:6: import "../InterfaceHub/IERC20.sol";
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:5: import "../../InterfaceHub/IERC20.sol";
```

- [contracts/TransferHub/CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/CallOptionalReturn.sol)

```solidity
# File: contracts/TransferHub/CallOptionalReturn.sol

CallOptionalReturn.sol:5: import "../InterfaceHub/IERC20.sol";
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:5: import "../InterfaceHub/IERC20.sol";
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:5: import "../InterfaceHub/IERC20.sol";
```

### <a name="NC-14"></a>[NC-14] Use a `modifier` instead of a `require/if` statement for a special `msg.sender` actor

If a function is supposed to be access-controlled, a `modifier` should be used instead of a `require/if` statement for more readability.

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:195:         if (msg.sender == incentiveMaster) {

DeclarationsFeeManager.sol:206:         if (msg.sender == address(WISE_SECURITY)) {

DeclarationsFeeManager.sol:217:         if (msg.sender == address(WISE_LENDING)) {
```

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:197:         if (msg.sender != proposedIncentiveMaster) {

FeeManager.sol:320:         if (msg.sender != incentiveOwnerA) {

FeeManager.sol:357:         if (msg.sender != incentiveOwnerB) {
```

- [contracts/OwnableMaster.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/OwnableMaster.sol)

```solidity
# File: contracts/OwnableMaster.sol

OwnableMaster.sol:25:         if (msg.sender == master) {

OwnableMaster.sol:41:         if (msg.sender == proposedMaster) {
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:221:         if (reserved[msg.sender] == _nftId) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:77:         if (msg.sender != BALANCER_ADDRESS) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:227:         if (reservedKeys[msg.sender] == _keyId) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:251:         if (msg.sender != pendleChildAddress[_pendleMarket]) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:76:         if (msg.sender != PENDLE_POWER_FARM_CONTROLLER) {

PendlePowerFarmToken.sol:514:         if (msg.sender == PENDLE_POWER_FARM_CONTROLLER) {

PendlePowerFarmToken.sol:619:         if (_shares > balanceOf(msg.sender)) {

PendlePowerFarmToken.sol:635:         if (msg.sender == PENDLE_POWER_FARM_CONTROLLER) {

PendlePowerFarmToken.sol:663:         if (shares > balanceOf(msg.sender)) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol

PendlePowerFarmTokenFactory.sol:44:         if (msg.sender != PENDLE_POWER_FARM_CONTROLLER) {
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:53:         if (msg.sender == WETH_ADDRESS) {
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:261:         if (msg.sender != AAVE_HUB_ADDRESS) {
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:18:         if (msg.sender == address(FEE_MANAGER)) {
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:35:         if (msg.sender == address(WISE_LENDING)) {

WiseSecurity.sol:1014:         if (securityWorker[msg.sender] == false) {
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:70:         if (POSITION_NFT.isOwner(_nftId, msg.sender) == false) {
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:87:         if (msg.sender == WETH_ADDRESS) {
```

### <a name="NC-15"></a>[NC-15] Consider using named mappings

Consider moving to solidity version 0.8.18 or later, and using [named mappings](https://ethereum.stackexchange.com/questions/51629/how-to-name-the-arguments-in-mapping/145555#145555) to make it easier to understand the purpose of each mapping

Affected code:

- [contracts/DerivativeOracles/CustomOracleSetup.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/CustomOracleSetup.sol)

```solidity
# File: contracts/DerivativeOracles/CustomOracleSetup.sol

CustomOracleSetup.sol:12:     mapping(uint80 => uint256) public timeStampByRoundId;
```

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:140:     mapping(uint256 => uint256) public badDebtPosition;

DeclarationsFeeManager.sol:143:     mapping(address => uint256) public feeTokens;

DeclarationsFeeManager.sol:146:     mapping(address => uint256) public incentiveUSD;

DeclarationsFeeManager.sol:149:     mapping(address => bool) public poolTokenAdded;

DeclarationsFeeManager.sol:152:     mapping(address => bool) public isAaveToken;

DeclarationsFeeManager.sol:155:     mapping(address => address) public underlyingToken;

DeclarationsFeeManager.sol:158:     mapping(address => mapping(address => bool)) public allowedTokens;

DeclarationsFeeManager.sol:161:     mapping(address => mapping(address => uint256)) public gatheredIncentiveToken;
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:388:         mapping(uint256 => address[]) storage _userTokenData,

MainHelper.sol:613:         mapping(bytes32 => bool) storage hashMap,

MainHelper.sol:614:         mapping(uint256 => address[]) storage userTokenData
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:20:     mapping(address => uint256) public reserved;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:106:     mapping(uint256 => bool) public isAave;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:58:     mapping(address => address) public pendleChildAddress;

PendlePowerFarmControllerBase.sol:59:     mapping(address => CompoundStruct) pendleChildCompoundInfo;
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:24:     mapping(uint256 => uint256) public farmingKeys;

MinterReserver.sol:27:     mapping(address => uint256) public reservedKeys;

MinterReserver.sol:30:     mapping(uint256 => uint256) public availableNFTs;
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:267:     mapping(address => uint256) internal bufferIncrease;

WiseLendingDeclaration.sol:268:     mapping(address => uint256) public maxDepositValueToken;

WiseLendingDeclaration.sol:270:     mapping(uint256 => address[]) public positionLendTokenData;

WiseLendingDeclaration.sol:271:     mapping(uint256 => address[]) public positionBorrowTokenData;

WiseLendingDeclaration.sol:273:     mapping(uint256 => mapping(address => uint256)) public userBorrowShares;

WiseLendingDeclaration.sol:274:     mapping(uint256 => mapping(address => uint256)) public pureCollateralAmount;

WiseLendingDeclaration.sol:275:     mapping(uint256 => mapping(address => LendingEntry)) public userLendingData;

WiseLendingDeclaration.sol:278:     mapping(address => BorrowRatesEntry) public borrowRatesData;

WiseLendingDeclaration.sol:279:     mapping(address => AlgorithmEntry) public algorithmData;

WiseLendingDeclaration.sol:280:     mapping(address => GlobalPoolEntry) public globalPoolData;

WiseLendingDeclaration.sol:281:     mapping(address => LendingPoolEntry) public lendingPoolData;

WiseLendingDeclaration.sol:282:     mapping(address => BorrowPoolEntry) public borrowPoolData;

WiseLendingDeclaration.sol:283:     mapping(address => TimestampsPoolEntry) public timestampsPoolData;

WiseLendingDeclaration.sol:286:     mapping(uint256 => bool) public positionLocked;

WiseLendingDeclaration.sol:287:     mapping(address => bool) internal parametersLocked;

WiseLendingDeclaration.sol:288:     mapping(address => bool) public verifiedIsolationPool;

WiseLendingDeclaration.sol:291:     mapping(bytes32 => bool) internal hashMapPositionBorrow;

WiseLendingDeclaration.sol:292:     mapping(bytes32 => bool) internal hashMapPositionLending;
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:372:         mapping(uint256 => mapping(address => uint256)) storage userMapping,

WiseLowLevelHelper.sol:383:         mapping(uint256 => mapping(address => uint256)) storage userMapping,
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:139:     mapping(address => uint8) _tokenDecimals;

Declarations.sol:142:     mapping(address => IPriceFeed) public priceFeed;

Declarations.sol:145:     mapping(address => uint256) public heartBeat;

Declarations.sol:148:     mapping(address => IAggregator) public tokenAggregatorFromTokenAddress;

Declarations.sol:151:     mapping(address => address[]) public underlyingFeedTokens;

Declarations.sol:154:     mapping(address => UniTwapPoolInfo) public uniTwapPoolInfo;

Declarations.sol:157:     mapping(address => DerivativePartnerInfo) public derivativePartnerTwap;
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:238:     mapping(address => bool) public wasBlacklisted;

WiseSecurityDeclarations.sol:241:     mapping(address => CurveSwapStructData) public curveSwapInfoData;

WiseSecurityDeclarations.sol:244:     mapping(address => CurveSwapStructToken) public curveSwapInfoToken;

WiseSecurityDeclarations.sol:247:     mapping(address => bool) public securityWorker;
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:41:     mapping(address => address) public aaveTokenAddress;
```

### <a name="NC-16"></a>[NC-16] `address`s shouldn't be hard-coded

It is often better to declare `address`es as `immutable`, and assign them via constructor arguments. This allows the code to remain the same across deployments on different networks, and avoids recompilation when addresses need to change.

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:90:         incentiveOwnerA = 0xf69A0e276664997357BF987df83f32a1a3F80944;

DeclarationsFeeManager.sol:91:         incentiveOwnerB = 0x8f741ea9C9ba34B5B8Afc08891bDf53faf4B3FE7;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:85:     address internal constant BALANCER_ADDRESS = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;

PendlePowerFarmDeclarations.sol:91:     address internal constant ST_ETH_ADDRESS = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:74:     address internal constant ARB_REWARDS_ADDRESS = 0x23a102e78D1FF1645a3666691495174764a5FCAF;

PendlePowerFarmControllerBase.sol:75:     address internal constant ARB_TOKEN_ADDRESS = 0x912CE59144191C1204E64559FE8253a0e49E6548;
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:79:     address public constant SEQUENCER_ADDRESS = 0xFdB631F5EE196F0ed6FAa767959853A9F217697D;
```

### <a name="NC-17"></a>[NC-17] Take advantage of Custom Error's return value property

An important feature of Custom Error is that values such as address, tokenID, msg.value can be written inside the () sign, this kind of approach provides a serious advantage in debugging and examining the revert details of dapps such as tenderly.

Affected code:

- [contracts/DerivativeOracles/PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleLpOracle.sol

PendleLpOracle.sol:45:             revert InvalidDecimals();

PendleLpOracle.sol:105:             revert CardinalityNotSatisfied();

PendleLpOracle.sol:109:             revert OldestObservationNotSatisfied();
```

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:110:             revert CardinalityNotSatisfied();

PtOracleDerivative.sol:114:             revert OldestObservationNotSatisfied();
```

- [contracts/DerivativeOracles/PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOraclePure.sol)

```solidity
# File: contracts/DerivativeOracles/PtOraclePure.sol

PtOraclePure.sol:91:             revert CardinalityNotSatisfied();

PtOraclePure.sol:95:             revert OldestObservationNotSatisfied();
```

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:46:             revert NoValue();

DeclarationsFeeManager.sol:50:             revert NoValue();

DeclarationsFeeManager.sol:54:             revert NoValue();

DeclarationsFeeManager.sol:58:             revert NoValue();

DeclarationsFeeManager.sol:62:             revert NoValue();

DeclarationsFeeManager.sol:199:         revert NotIncentiveMaster();

DeclarationsFeeManager.sol:210:         revert NotWiseLiquidation();

DeclarationsFeeManager.sol:221:         revert NotWiseLending();
```

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:180:             revert ZeroAddress();

FeeManager.sol:198:             revert NotAllowed();

FeeManager.sol:292:             revert NoIncentive();

FeeManager.sol:321:             revert NotAllowed();

FeeManager.sol:325:             revert NotAllowed();

FeeManager.sol:329:             revert NotAllowed();

FeeManager.sol:358:             revert NotAllowed();

FeeManager.sol:362:             revert NotAllowed();

FeeManager.sol:366:             revert NotAllowed();

FeeManager.sol:419:             revert PoolAlreadyAdded();

FeeManager.sol:450:             revert PoolNotPresent();

FeeManager.sol:486:         revert PoolNotPresent();

FeeManager.sol:698:             revert ExistingBadDebt();

FeeManager.sol:702:             revert NotAllowed();

FeeManager.sol:754:             revert PoolNotActive();

FeeManager.sol:758:             revert PoolNotActive();

FeeManager.sol:833:             revert PoolNotActive();
```

- [contracts/FeeManager/FeeManagerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManagerHelper.sol)

```solidity
# File: contracts/FeeManager/FeeManagerHelper.sol

FeeManagerHelper.sol:390:             revert TooLowValue();

FeeManagerHelper.sol:394:             revert TooHighValue();
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:224:             revert InvalidAction();

MainHelper.sol:245:             revert NotPowerFarm();

MainHelper.sol:254:             revert InvalidCaller();

MainHelper.sol:266:             revert LiquidatorIsInPowerFarm();

MainHelper.sol:270:             revert InvalidLiquidator();

MainHelper.sol:634:             revert TooManyTokens();
```

- [contracts/OwnableMaster.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/OwnableMaster.sol)

```solidity
# File: contracts/OwnableMaster.sol

OwnableMaster.sol:29:         revert NotMaster();

OwnableMaster.sol:45:         revert NotProposed();

OwnableMaster.sol:61:             revert NoValue();

OwnableMaster.sol:77:             revert NoValue();
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:37:             revert InvalidAction();

PoolManager.sol:175:             revert InvalidAddress();
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:49:             revert NotPermitted();

PositionNFTs.sol:155:             revert NotPermitted();
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:183:             revert LeverageTooHigh();

PendlePowerFarm.sol:192:             revert AmountTooSmall();
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:242:             revert CollateralFactorTooHigh();

PendlePowerFarmDeclarations.sol:364:             revert Deactivated();
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:68:             revert AccessDenied();

PendlePowerFarmLeverageLogic.sol:74:             revert InvalidParam();

PendlePowerFarmLeverageLogic.sol:78:             revert NotBalancerVault();

PendlePowerFarmLeverageLogic.sol:212:             revert TooMuchValueLost();

PendlePowerFarmLeverageLogic.sol:261:         revert WrongChainId();

PendlePowerFarmLeverageLogic.sol:505:             revert TooMuchValueLost();

PendlePowerFarmLeverageLogic.sol:521:             revert DebtRatioTooHigh();

PendlePowerFarmLeverageLogic.sol:572:             revert DebtRatioTooLow();
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:40:             revert AccessDenied();

PendlePowerFarmMathLogic.sol:44:             revert AccessDenied();

PendlePowerFarmMathLogic.sol:48:             revert AccessDenied();
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:292:             revert DebtRatioTooHigh();
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:72:             revert NotEnoughCompound();

PendlePowerFarmController.sol:125:             revert ZeroShares();

PendlePowerFarmController.sol:183:             revert WrongAddress();

PendlePowerFarmController.sol:195:             revert NothingToSkim();

PendlePowerFarmController.sol:221:             revert AlreadySet();

PendlePowerFarmController.sol:346:             revert WrongAddress();

PendlePowerFarmController.sol:385:             revert LockTimeTooShort();

PendlePowerFarmController.sol:476:             revert NotExpired();

PendlePowerFarmController.sol:620:             revert InvalidLength();

PendlePowerFarmController.sol:636:             revert InvalidWeightSum();
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:241:             revert NotArbitrum();

PendlePowerFarmControllerBase.sol:252:             revert NotAllowed();

PendlePowerFarmControllerBase.sol:266:             revert WrongAddress();
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol

PendlePowerFarmControllerHelper.sol:29:         revert NotFound();

PendlePowerFarmControllerHelper.sol:86:             revert ValueTooSmall();

PendlePowerFarmControllerHelper.sol:140:             revert WrongAddress();
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:77:             revert NotController();

PendlePowerFarmToken.sol:108:             revert InvalidSharePrice();

PendlePowerFarmToken.sol:128:             revert InvalidSharePriceGrowth();

PendlePowerFarmToken.sol:509:             revert ZeroAmount();

PendlePowerFarmToken.sol:540:             revert ZeroAmount();

PendlePowerFarmToken.sol:549:             revert NotEnoughLpAssetsTransferred();

PendlePowerFarmToken.sol:560:             revert ZeroFee();

PendlePowerFarmToken.sol:564:             revert TooMuchFee();

PendlePowerFarmToken.sol:599:             revert FeeTooHigh();

PendlePowerFarmToken.sol:616:             revert ZeroAmount();

PendlePowerFarmToken.sol:620:             revert InsufficientShares();

PendlePowerFarmToken.sol:655:             revert ZeroAmount();

PendlePowerFarmToken.sol:664:             revert NotEnoughShares();

PendlePowerFarmToken.sol:692:             revert AlreadyInitialized();

PendlePowerFarmToken.sol:700:             revert MarketExpired();
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol

PendlePowerFarmTokenFactory.sol:45:             revert DeployForbidden();
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:85:             revert AlreadyReserved();

MinterReserver.sol:123:             revert InvalidKey();
```

- [contracts/TransferHub/CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/CallOptionalReturn.sol)

```solidity
# File: contracts/TransferHub/CallOptionalReturn.sol

CallOptionalReturn.sol:32:             revert();
```

- [contracts/TransferHub/SendValueHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/SendValueHelper.sol)

```solidity
# File: contracts/TransferHub/SendValueHelper.sol

SendValueHelper.sol:19:             revert AmountTooSmall();

SendValueHelper.sol:34:             revert SendValueFailed();
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:208:         revert PositionLocked();

WiseCore.sol:247:             revert DeadOracle();

WiseCore.sol:286:         revert InvalidAction();

WiseCore.sol:307:             revert InvalidAction();
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:120:             revert NoValue();

WiseLendingDeclaration.sol:124:             revert NoValue();

WiseLendingDeclaration.sol:147:             revert InvalidAction();

WiseLendingDeclaration.sol:262:             revert InvalidCaller();
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:22:         revert InvalidCaller();

WiseLowLevelHelper.sol:33:             revert InvalidAction();

WiseLowLevelHelper.sol:355:             revert InvalidAction();

WiseLowLevelHelper.sol:359:             revert InvalidAction();

WiseLowLevelHelper.sol:454:             revert ValueIsZero();

WiseLowLevelHelper.sol:465:             revert ValueNotZero();
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:20:             revert OracleAlreadySet();

OracleHelper.sol:42:             revert AggregatorAlreadySet();

OracleHelper.sol:46:             revert FunctionDoesntExist();

OracleHelper.sol:54:             revert AggregatorNotNecessary();

OracleHelper.sol:98:             revert OracleIsDead();

OracleHelper.sol:242:             revert OraclesDeviate();

OracleHelper.sol:271:             revert OracleIsDead();

OracleHelper.sol:312:             revert ZeroAddressNotAllowed();

OracleHelper.sol:316:             revert TokenAddressMismatch();

OracleHelper.sol:332:             revert PoolDoesNotExist();

OracleHelper.sol:336:             revert PoolAddressMismatch();

OracleHelper.sol:351:             revert ChainLinkOracleNotSet();

OracleHelper.sol:366:             revert TwapOracleAlreadySet();

OracleHelper.sol:567:             revert HeartBeatNotSet();
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:77:             revert OracleIsDead();
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:39:         revert NotWiseLendingSecurity();

WiseSecurity.sol:249:                 revert OpenBorrowPosition();

WiseSecurity.sol:287:                 revert OpenBorrowPosition();

WiseSecurity.sol:344:             revert ChainlinkDead();

WiseSecurity.sol:370:                 revert OpenBorrowPosition();

WiseSecurity.sol:1015:             revert NotAllowedEntity();

WiseSecurity.sol:1105:             revert DepositAmountTooSmall();

WiseSecurity.sol:1118:             revert NoValue();
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:62:             revert NoValue();

WiseSecurityDeclarations.sol:66:             revert NoValue();

WiseSecurityDeclarations.sol:127:             revert BaseRewardTooHigh();

WiseSecurityDeclarations.sol:131:             revert BaseRewardTooLow();

WiseSecurityDeclarations.sol:137:             revert BaseRewardFarmTooHigh();

WiseSecurityDeclarations.sol:141:             revert BaseRewardFarmTooLow();

WiseSecurityDeclarations.sol:155:             revert MaxFeeEthTooHigh();

WiseSecurityDeclarations.sol:159:             revert MaxFeeEthTooLow();

WiseSecurityDeclarations.sol:173:             revert MaxFeeFarmEthTooHigh();

WiseSecurityDeclarations.sol:177:             revert MaxFeeFarmEthTooLow();
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:679:             revert NotAllowedToBorrow();

WiseSecurityHelper.sol:708:             revert PositionLockedWiseSecurity();

WiseSecurityHelper.sol:802:             revert ResultsInBadDebt();

WiseSecurityHelper.sol:850:             revert NotAllowedWiseSecurity();

WiseSecurityHelper.sol:867:             revert LiquidationDenied();

WiseSecurityHelper.sol:899:         revert TooManyShares();

WiseSecurityHelper.sol:977:             revert NotOwner();

WiseSecurityHelper.sol:1087:             revert TokenBlackListed();

WiseSecurityHelper.sol:1103:             revert SecuritySwapFailed();
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:30:             revert InvalidToken();

AaveHelper.sol:39:             revert InvalidAction();

AaveHelper.sol:43:             revert InvalidAction();

AaveHelper.sol:71:             revert InvalidAction();

AaveHelper.sol:203:             revert InvalidValue();

AaveHelper.sol:215:             revert FailedInnerCall();
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:671:             revert AlreadySet();
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:58:             revert NoValue();

Declarations.sol:62:             revert NoValue();

Declarations.sol:112:             revert AlreadySet();
```

### <a name="NC-18"></a>[NC-18] Use scientific notation (e.g. `1e18`) rather than exponentiation (e.g. `10**18`)

While this won't save gas in the recent solidity versions, this is shorter and more readable (this is especially true in calculations).

Affected code:

- [contracts/DerivativeOracles/PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleLpOracle.sol

PendleLpOracle.sol:67:     uint256 internal constant POW_FEED_DECIMALS = 10 ** 18;
```

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:38:         POW_USD_FEED = 10 ** USD_FEED_ASSET.decimals();

PtOracleDerivative.sol:39:         POW_ETH_USD_FEED = 10 ** ETH_FEED_ASSET.decimals();
```

- [contracts/DerivativeOracles/PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOraclePure.sol)

```solidity
# File: contracts/DerivativeOracles/PtOraclePure.sol

PtOraclePure.sol:35:         POW_FEED = 10 ** FEED_ASSET.decimals();
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:122:             ) / 10 ** (_decimalsWETH - decimals(_tokenAddress));

OracleHelper.sol:128:         ) / 10 ** (_decimalsWETH - decimals(_tokenAddress));

OracleHelper.sol:402:             10 ** _tokenDecimals[_tokenAddress]
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:111:                 / 10 ** decimals(_tokenAddress)

WiseOracleHub.sol:112:                 / 10 ** (tokenDecimals - _decimalsETH)

WiseOracleHub.sol:116:                 / 10 ** decimals(_tokenAddress);

WiseOracleHub.sol:136:             / 10 ** _decimalsUSD;

WiseOracleHub.sol:162:                 / 10 ** decimals(_tokenAddress)

WiseOracleHub.sol:163:                 / 10 ** (tokenDecimals - _decimalsETH)

WiseOracleHub.sol:167:                 / 10 ** decimals(_tokenAddress);

WiseOracleHub.sol:191:                 / 10 ** (_decimalsETH - tokenDecimals);

WiseOracleHub.sol:351:                 / 10 ** (_decimalsETH - tokenDecimals);
```

### <a name="NC-19"></a>[NC-19] Avoid the use of sensitive terms

Use [alternative variants](https://www.zdnet.com/article/mysql-drops-master-slave-and-blacklist-whitelist-terminology/), e.g. allowlist/denylist instead of whitelist/blacklist

Affected code:

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:246:         if (_checkBlacklisted(_poolToken) == true) {

WiseSecurity.sol:284:         if (_checkBlacklisted(_poolToken) == true) {

WiseSecurity.sol:367:         if (_checkBlacklisted(_poolToken) == true) {

WiseSecurity.sol:675:             if (wasBlacklisted[token] == true) {

WiseSecurity.sol:695:     function positionBlackListToken(

WiseSecurity.sol:716:             if (_checkBlacklisted(token) == true) {

WiseSecurity.sol:741:             if (_checkBlacklisted(token) == true) {

WiseSecurity.sol:980:     function setBlacklistToken(

WiseSecurity.sol:987:         wasBlacklisted[_tokenAddress] = _state;
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:21: error TokenBlackListed();

WiseSecurityDeclarations.sol:33: error Blacklisted();

WiseSecurityDeclarations.sol:238:     mapping(address => bool) public wasBlacklisted;
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:470:     function _checkBlacklisted(

WiseSecurityHelper.sol:477:         return wasBlacklisted[_poolToken] == true;

WiseSecurityHelper.sol:1067:             wasBlacklisted[

WiseSecurityHelper.sol:1086:         if (_checkBlacklisted(_poolToken) == true) {

WiseSecurityHelper.sol:1087:             revert TokenBlackListed();
```

### <a name="NC-20"></a>[NC-20] Consider using `uint48` for time-related variables

While `uint32` ends in 2106 and could cause some issues in this distant future, higher types than `uint48` (like `uint256`) aren't necessary for time-related variables.

Affected code:

- [contracts/DerivativeOracles/CustomOracleSetup.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/CustomOracleSetup.sol)

```solidity
# File: contracts/DerivativeOracles/CustomOracleSetup.sol

CustomOracleSetup.sol:12:     mapping(uint80 => uint256) public timeStampByRoundId;

CustomOracleSetup.sol:34:         uint256 _time

CustomOracleSetup.sol:44:         uint256 _updateTime
```

- [contracts/FeeManager/FeeManagerEvents.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManagerEvents.sol)

```solidity
# File: contracts/FeeManager/FeeManagerEvents.sol

FeeManagerEvents.sol:8:         uint256 timestamp

FeeManagerEvents.sol:13:         uint256 timestamp

FeeManagerEvents.sol:18:         uint256 timestamp

FeeManagerEvents.sol:23:         uint256 timestamp

FeeManagerEvents.sol:28:         uint256 timestamp

FeeManagerEvents.sol:33:         uint256 timestamp

FeeManagerEvents.sol:38:         uint256 timestamp

FeeManagerEvents.sol:44:         uint256 timestamp

FeeManagerEvents.sol:51:         uint256 timestamp

FeeManagerEvents.sol:55:         uint256 timestamp

FeeManagerEvents.sol:60:         uint256 timestamp

FeeManagerEvents.sol:65:         uint256 timestamp

FeeManagerEvents.sol:70:         uint256 timestamp

FeeManagerEvents.sol:75:         uint256 timestamp

FeeManagerEvents.sol:80:         uint256 timestamp

FeeManagerEvents.sol:86:         uint256 timestamp

FeeManagerEvents.sol:92:         uint256 timestamp

FeeManagerEvents.sol:98:         uint256 timestamp

FeeManagerEvents.sol:104:         uint256 timestamp

FeeManagerEvents.sol:110:         uint256 indexed timestamp

FeeManagerEvents.sol:117:         uint256 indexed timestamp

FeeManagerEvents.sol:126:         uint256 timestamp

FeeManagerEvents.sol:134:         uint256 timestampp
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:353:         uint256 timeDifference = block.timestamp

MainHelper.sol:501:         uint256 currentTime = block.timestamp;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:113:         uint256 timestamp

PendlePowerFarmDeclarations.sol:120:         uint256 timestamp

PendlePowerFarmDeclarations.sol:125:         uint256 timestamp

PendlePowerFarmDeclarations.sol:132:         uint256 timestamp

PendlePowerFarmDeclarations.sol:139:         uint256 timestamp

PendlePowerFarmDeclarations.sol:144:         uint256 timestamp

PendlePowerFarmDeclarations.sol:154:         uint256 timestamp
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:376:         uint256 currentExpiry = _getExpiry();

PendlePowerFarmController.sol:378:         uint128 expiry = _sameExpiry

PendlePowerFarmController.sol:379:             ? uint128(currentExpiry)

PendlePowerFarmController.sol:384:         if (uint256(expiry) < currentExpiry) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:181:         uint128 _expiry,

PendlePowerFarmControllerBase.sol:185:         uint256 _timestamp

PendlePowerFarmControllerBase.sol:191:         uint256 _timestamp

PendlePowerFarmControllerBase.sol:202:         uint256 _timestamp

PendlePowerFarmControllerBase.sol:207:         uint256 _timestamp
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol

PendlePowerFarmControllerHelper.sol:39:         uint128 startTime = uint128((block.timestamp / WEEK)
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:61:     uint256 private INITIAL_TIME_STAMP;

PendlePowerFarmToken.sol:120:         uint256 timeDifference = block.timestamp

PendlePowerFarmToken.sol:123:         uint256 maximum = timeDifference
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:262:         uint256 timeDifference = block.timestamp
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:41:         uint256 timestamp

WiseLendingDeclaration.sol:49:         uint256 timestamp

WiseLendingDeclaration.sol:58:         uint256 timestamp

WiseLendingDeclaration.sol:67:         uint256 timestamp

WiseLendingDeclaration.sol:75:         uint256 timestamp

WiseLendingDeclaration.sol:84:         uint256 timestamp

WiseLendingDeclaration.sol:93:         uint256 timestamp

WiseLendingDeclaration.sol:102:         uint256 timestamp

WiseLendingDeclaration.sol:233:         uint256 timeStamp;

WiseLendingDeclaration.sol:234:         uint256 timeStampScaling;

WiseLendingDeclaration.sol:235:         uint256 initialTimeStamp;
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:316:         uint256 _time

WiseLowLevelHelper.sol:325:         uint256 _time
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:109:     uint32 internal constant TWAP_PERIOD = 30 * SECONDS_IN_MINUTE;
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:541:         uint256 timeSinceUp = block.timestamp

OracleHelper.sol:574:         uint256 upd = _getRoundTimestamp(

OracleHelper.sol:603:         uint256 latestTimestamp = _getRoundTimestamp(

OracleHelper.sol:627:             uint256 currentTimestamp = _getRoundTimestamp(

OracleHelper.sol:686:             uint256 timestamp
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:49:         uint256 indexed timestamp
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:590:         uint256 timeInterval = _interval

WiseSecurityHelper.sol:594:         uint256 rate = timeInterval
```

- [contracts/WrapperHub/AaveEvents.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveEvents.sol)

```solidity
# File: contracts/WrapperHub/AaveEvents.sol

AaveEvents.sol:10:         uint256 timestamp

AaveEvents.sol:15:         uint256 timestamp

AaveEvents.sol:20:         uint256 timestamp

AaveEvents.sol:25:         uint256 timestamp

AaveEvents.sol:30:         uint256 timestamp

AaveEvents.sol:35:         uint256 timestamp

AaveEvents.sol:40:         uint256 timestamp
```

### <a name="NC-21"></a>[NC-21] Import declarations should import specific identifiers, rather than the whole file

Using import declarations of the form `import {<identifier_name>} from "some/file.sol"` avoids polluting the symbol namespace making flattened files smaller, and speeds up compilation

Affected code:

- [contracts/DerivativeOracles/PendleChildLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleChildLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleChildLpOracle.sol

PendleChildLpOracle.sol:3: import "./CustomOracleSetup.sol";

PendleChildLpOracle.sol:5: import "../InterfaceHub/IPendle.sol";

PendleChildLpOracle.sol:6: import "../InterfaceHub/IPriceFeed.sol";
```

- [contracts/DerivativeOracles/PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleLpOracle.sol

PendleLpOracle.sol:16: import "../InterfaceHub/IPendle.sol";

PendleLpOracle.sol:17: import "../InterfaceHub/IPriceFeed.sol";

PendleLpOracle.sol:18: import "../InterfaceHub/IOraclePendle.sol";
```

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:16: import "../InterfaceHub/IPriceFeed.sol";

PtOracleDerivative.sol:17: import "../InterfaceHub/IOraclePendle.sol";
```

- [contracts/DerivativeOracles/PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOraclePure.sol)

```solidity
# File: contracts/DerivativeOracles/PtOraclePure.sol

PtOraclePure.sol:16: import "../InterfaceHub/IPriceFeed.sol";

PtOraclePure.sol:17: import "../InterfaceHub/IOraclePendle.sol";
```

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:5: import "../InterfaceHub/IAave.sol";

DeclarationsFeeManager.sol:6: import "../InterfaceHub/IERC20.sol";

DeclarationsFeeManager.sol:7: import "../InterfaceHub/IWiseLending.sol";

DeclarationsFeeManager.sol:8: import "../InterfaceHub/IFeeManager.sol";

DeclarationsFeeManager.sol:9: import "../InterfaceHub/IWiseSecurity.sol";

DeclarationsFeeManager.sol:10: import "../InterfaceHub/IPositionNFTs.sol";

DeclarationsFeeManager.sol:11: import "../InterfaceHub/IWiseOracleHub.sol";

DeclarationsFeeManager.sol:13: import "../OwnableMaster.sol";

DeclarationsFeeManager.sol:14: import "./FeeManagerEvents.sol";
```

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:11: import "./FeeManagerHelper.sol";
```

- [contracts/FeeManager/FeeManagerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManagerHelper.sol)

```solidity
# File: contracts/FeeManager/FeeManagerHelper.sol

FeeManagerHelper.sol:5: import "./DeclarationsFeeManager.sol";

FeeManagerHelper.sol:6: import "../TransferHub/TransferHelper.sol";
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:5: import "./WiseLowLevelHelper.sol";
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:5: import "./WiseCore.sol";

PoolManager.sol:6: import "./Babylonian.sol";
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:5: import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

PositionNFTs.sol:7: import "./OwnableMaster.sol";
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:5: import "./PendlePowerFarmLeverageLogic.sol";
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:5: import "../../InterfaceHub/IERC20.sol";

PendlePowerFarmDeclarations.sol:6: import "../../InterfaceHub/IAave.sol";

PendlePowerFarmDeclarations.sol:7: import "../../InterfaceHub/IPendle.sol";

PendlePowerFarmDeclarations.sol:8: import "../../InterfaceHub/IAaveHub.sol";

PendlePowerFarmDeclarations.sol:9: import "../../InterfaceHub/IWiseLending.sol";

PendlePowerFarmDeclarations.sol:10: import "../../InterfaceHub/IStETH.sol";

PendlePowerFarmDeclarations.sol:11: import "../../InterfaceHub/IWiseSecurity.sol";

PendlePowerFarmDeclarations.sol:12: import "../../InterfaceHub/IPositionNFTs.sol";

PendlePowerFarmDeclarations.sol:13: import "../../InterfaceHub/IWiseOracleHub.sol";

PendlePowerFarmDeclarations.sol:14: import "../../InterfaceHub/IBalancerFlashloan.sol";

PendlePowerFarmDeclarations.sol:15: import "../../InterfaceHub/ICurve.sol";

PendlePowerFarmDeclarations.sol:16: import "../../InterfaceHub/IUniswapV3.sol";

PendlePowerFarmDeclarations.sol:18: import "../../TransferHub/WrapperHelper.sol";

PendlePowerFarmDeclarations.sol:19: import "../../TransferHub/TransferHelper.sol";

PendlePowerFarmDeclarations.sol:20: import "../../TransferHub/ApprovalHelper.sol";

PendlePowerFarmDeclarations.sol:21: import "../../TransferHub/SendValueHelper.sol";
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:5: import "./PendlePowerFarmMathLogic.sol";
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:5: import "./PendlePowerFarmDeclarations.sol";
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:11: import "./PendlePowerFarm.sol";

PendlePowerManager.sol:12: import "../../OwnableMaster.sol";

PendlePowerManager.sol:13: import "../PowerFarmNFTs/MinterReserver.sol";
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:5: import "./PendlePowerFarmTokenFactory.sol";

PendlePowerFarmController.sol:6: import "./PendlePowerFarmControllerHelper.sol";
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:5: import "../../OwnableMaster.sol";

PendlePowerFarmControllerBase.sol:7: import "../../TransferHub/TransferHelper.sol";

PendlePowerFarmControllerBase.sol:8: import "../../TransferHub/ApprovalHelper.sol";

PendlePowerFarmControllerBase.sol:10: import "../../InterfaceHub/IPendle.sol";

PendlePowerFarmControllerBase.sol:11: import "../../InterfaceHub/IArbRewardsClaimer.sol";

PendlePowerFarmControllerBase.sol:12: import "../../InterfaceHub/IWiseOracleHub.sol";

PendlePowerFarmControllerBase.sol:13: import "../../InterfaceHub/IPendlePowerFarmToken.sol";

PendlePowerFarmControllerBase.sol:14: import "../../InterfaceHub/IPendlePowerFarmTokenFactory.sol";
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol

PendlePowerFarmControllerHelper.sol:5: import "./PendlePowerFarmControllerBase.sol";
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:5: import "./SimpleERC20Clone.sol";

PendlePowerFarmToken.sol:7: import "../../InterfaceHub/IPendle.sol";

PendlePowerFarmToken.sol:8: import "../../InterfaceHub/IPendleController.sol";

PendlePowerFarmToken.sol:10: import "../../TransferHub/TransferHelper.sol";
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol

PendlePowerFarmTokenFactory.sol:5: import "./PendlePowerFarmToken.sol";
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:5: import "../../InterfaceHub/IPowerFarmsNFTs.sol";
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:11: import "../../OwnableMaster.sol";

PowerFarmNFTs.sol:12: import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
```

- [contracts/TransferHub/ApprovalHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/ApprovalHelper.sol)

```solidity
# File: contracts/TransferHub/ApprovalHelper.sol

ApprovalHelper.sol:5: import "./CallOptionalReturn.sol";
```

- [contracts/TransferHub/CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/CallOptionalReturn.sol)

```solidity
# File: contracts/TransferHub/CallOptionalReturn.sol

CallOptionalReturn.sol:5: import "../InterfaceHub/IERC20.sol";
```

- [contracts/TransferHub/TransferHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/TransferHelper.sol)

```solidity
# File: contracts/TransferHub/TransferHelper.sol

TransferHelper.sol:5: import "./CallOptionalReturn.sol";
```

- [contracts/TransferHub/WrapperHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/WrapperHelper.sol)

```solidity
# File: contracts/TransferHub/WrapperHelper.sol

WrapperHelper.sol:5: import "../InterfaceHub/IWETH.sol";
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:5: import "./MainHelper.sol";

WiseCore.sol:6: import "./TransferHub/TransferHelper.sol";
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:11: import "./PoolManager.sol";
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:5: import "./OwnableMaster.sol";

WiseLendingDeclaration.sol:7: import "./InterfaceHub/IAaveHubLite.sol";

WiseLendingDeclaration.sol:8: import "./InterfaceHub/IPositionNFTs.sol";

WiseLendingDeclaration.sol:9: import "./InterfaceHub/IWiseSecurity.sol";

WiseLendingDeclaration.sol:10: import "./InterfaceHub/IWiseOracleHub.sol";

WiseLendingDeclaration.sol:11: import "./InterfaceHub/IFeeManagerLight.sol";

WiseLendingDeclaration.sol:13: import "./TransferHub/WrapperHelper.sol";

WiseLendingDeclaration.sol:14: import "./TransferHub/SendValueHelper.sol";
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:5: import "./WiseLendingDeclaration.sol";
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:5: import "../InterfaceHub/IERC20.sol";

Declarations.sol:6: import "../InterfaceHub/IPriceFeed.sol";

Declarations.sol:7: import "../InterfaceHub/IAggregator.sol";

Declarations.sol:9: import "./Libraries/IUniswapV3Factory.sol";

Declarations.sol:10: import "./Libraries/OracleLibrary.sol";

Declarations.sol:12: import "../OwnableMaster.sol";
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:5: import "./Declarations.sol";
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:11: import "./OracleHelper.sol";
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:11: import "./WiseSecurityHelper.sol";

WiseSecurity.sol:12: import "../TransferHub/ApprovalHelper.sol";
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:5: import "../InterfaceHub/IERC20.sol";

WiseSecurityDeclarations.sol:6: import "../InterfaceHub/ICurve.sol";

WiseSecurityDeclarations.sol:7: import "../InterfaceHub/IPositionNFTs.sol";

WiseSecurityDeclarations.sol:8: import "../InterfaceHub/IWiseOracleHub.sol";

WiseSecurityDeclarations.sol:9: import "../InterfaceHub/IFeeManager.sol";

WiseSecurityDeclarations.sol:10: import "../InterfaceHub/IWiseLending.sol";

WiseSecurityDeclarations.sol:11: import "../InterfaceHub/IWiseLiquidation.sol";

WiseSecurityDeclarations.sol:16: import "../FeeManager/FeeManager.sol";

WiseSecurityDeclarations.sol:17: import "../OwnableMaster.sol";
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:5: import "./WiseSecurityDeclarations.sol";
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:5: import "./Declarations.sol";
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:11: import "./AaveHelper.sol";

AaveHub.sol:12: import "../TransferHub/TransferHelper.sol";

AaveHub.sol:13: import "../TransferHub/ApprovalHelper.sol";
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:5: import "./AaveEvents.sol";

Declarations.sol:7: import "../InterfaceHub/IAave.sol";

Declarations.sol:8: import "../InterfaceHub/IWiseLending.sol";

Declarations.sol:9: import "../InterfaceHub/IWiseSecurity.sol";

Declarations.sol:10: import "../InterfaceHub/IPositionNFTs.sol";

Declarations.sol:12: import "../OwnableMaster.sol";

Declarations.sol:13: import "../TransferHub/WrapperHelper.sol";
```

### <a name="NC-22"></a>[NC-22] Use Underscores for Number Literals (add an underscore every 3 digits)


Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:93:         incentiveUSD[incentiveOwnerA] = 98000 * PRECISION_FACTOR_E18;

DeclarationsFeeManager.sol:94:         incentiveUSD[incentiveOwnerB] = 106500 * PRECISION_FACTOR_E18;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:103:     uint256 internal constant ARB_CHAIN_ID = 42161;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:54:     uint256 internal constant ARBITRUM_CHAIN_ID = 42161;

PendlePowerFarmControllerBase.sol:122:         exchangeIncentive = 50000;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:54:     uint256 private constant MAX_MINT_FEE = 10000;

PendlePowerFarmToken.sol:730:         mintFee = 3000;
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:307:     uint256 internal constant NORMALISATION_FACTOR = 4838400;
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:112:     uint256 internal ALLOWED_DIFFERENCE = 10250;

Declarations.sol:121:     uint256 internal constant GRACE_PEROID = 3600;

Declarations.sol:134:     uint256 internal constant ARBITRUM_CHAIN_ID = 42161;
```

### <a name="NC-23"></a>[NC-23] Variables need not be initialized to zero

The default value for variables is zero, so initializing them to zero is superfluous.

Affected code:

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:71:         for (uint256 i = 0; i < _underlyingAssets.length; i++) {
```


# Gas Report


## Gas Optimizations


||Issue|Instances|Estimated Gas Savings|
|-|:-|:-:|:-:|
| [GAS-1](#GAS-1) | Use EIP-1167 minimal proxies for 10x cheaper contract instantiation | 4 | -
| [GAS-2](#GAS-2) | Using `private` rather than `public` for constants, saves gas | 3 | -
| [GAS-3](#GAS-3) | Unchecking arithmetics operations that can't underflow/overflow | 69 | -
| [GAS-4](#GAS-4) | `a = a + b` is more gas effective than `a += b` for state variables (excluding arrays and mappings) | 41 | 779
| [GAS-5](#GAS-5) | Comparing to a Boolean constant | 109 | 327
| [GAS-6](#GAS-6) | Using bools for storage incurs overhead | 27 | 461700
| [GAS-7](#GAS-7) | Cache array length outside of loop | 1 | 3
| [GAS-8](#GAS-8) | Avoid contract existence checks by using low level calls | 6 | -
| [GAS-9](#GAS-9) | Empty blocks should be removed or emit something | 5 | -
| [GAS-10](#GAS-10) | `++i` costs less gas compared to `i++` or `i += 1` (same for `--i` vs `i--` or `i -= 1`) | 10 | 50
| [GAS-11](#GAS-11) | Use shift right/left instead of division/multiplication if possible | 3 | 66
| [GAS-12](#GAS-12) | `>=` costs less gas than `>` | 81 | 243
| [GAS-13](#GAS-13) | `uint256` to `bool` `mapping`: Utilizing Bitmaps to dramatically save on Gas | 2 | 120000
| [GAS-14](#GAS-14) | Increments/decrements can be unchecked in for-loops | 1 | 25
| [GAS-15](#GAS-15) | WETH address definition can be use directly | 7 | -

Total: **369 instances** over **15 issues** with an estimated **583193 Gas Saved**

Gas totals use the lower-bound of ranges and count 1 iteration of each for-loop. All values above are runtime, not deployment.

### <a name="GAS-1"></a>[GAS-1] Use EIP-1167 minimal proxies for 10x cheaper contract instantiation

When new contracts have to be instantiated frequently, it's [much cheaper](https://github.com/porter-finance/v1-core/issues/15) for it to be done via [minimal proxies](https://eips.ethereum.org/EIPS/eip-1167). The only downside is that they rely on `delegatecall()` calls for every function, which adds an overhead of ~800 gas, but this is multiple orders of magnitude less than the amount saved during deployment

Affected code:

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:360:         bytes memory bstr = new bytes(
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:27:         PENDLE_POWER_FARM_TOKEN_FACTORY = new PendlePowerFarmTokenFactory(
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:232:         bytes memory bstr = new bytes(
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:81:         FeeManager feeManagerContract = new FeeManager(
```

### <a name="GAS-2"></a>[GAS-2] Using `private` rather than `public` for constants, saves gas

If needed, the values can be read from the verified contract source code, or if there are multiple values there can be a single getter function that [returns a tuple](https://github.com/code-423n4/2022-08-frax/blob/90f55a9ce4e25bceed3a74290b854341d8de6afa/src/contracts/FraxlendPair.sol#L156-L178) of the values of all currently-public constants. Saves **3406-3606 gas** in deployment gas due to the compiler not having to create non-payable getter functions for deployment calldata, not having to store the bytes of the value outside of where it's used, and not adding another entry to the method ID table

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:172:     uint256 public constant INCENTIVE_PORTION = 5 * PRECISION_FACTOR_E15;
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:79:     address public constant SEQUENCER_ADDRESS = 0xFdB631F5EE196F0ed6FAa767959853A9F217697D;
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:185:     uint256 public constant BORROW_PERCENTAGE_CAP = 95 * PRECISION_FACTOR_E16;
```

### <a name="GAS-3"></a>[GAS-3] Unchecking arithmetics operations that can't underflow/overflow

Solidity version 0.8+ comes with implicit overflow and underflow checks on unsigned integers. When an overflow or an underflow isn't possible (as an example, when a comparison is made before the arithmetic operation), some gas can be saved by using an `unchecked` block: <https://docs.soliditylang.org/en/v0.8.10/control-structures.html#checked-or-unchecked-arithmetic>

Consider wrapping with an `unchecked` block where it's certain that there cannot be an underflow

**25 gas saved** per instance

Affected code:

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:446:         uint256 lastEntry = len - 1;
```

- [contracts/FeeManager/FeeManagerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManagerHelper.sol)

```solidity
# File: contracts/FeeManager/FeeManagerHelper.sol

FeeManagerHelper.sol:110:         totalBadDebtETH -= _amount;

FeeManagerHelper.sol:172:                 - currentCollateralBareETH;

FeeManagerHelper.sol:180:                 ? _increaseTotalBadDebt(newBadDebt - currentBadDebt)

FeeManagerHelper.sol:181:                 : _decreaseTotalBadDebt(currentBadDebt - newBadDebt);

FeeManagerHelper.sol:214:         feeTokens[_feeToken] -= _amount;

FeeManagerHelper.sol:322:         return _amount - reduceAmount;

FeeManagerHelper.sol:354:             incentiveUSD[_incentiveOwner] -= usdEquivalent;
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:44:             : _product / _pseudo - 1;

MainHelper.sol:103:             / lendingPoolData[_poolToken].totalDepositShares - 1;

MainHelper.sol:177:         return PRECISION_FACTOR_E18 - (PRECISION_FACTOR_E18

MainHelper.sol:316:             uint256 difference = amountContract - (

MainHelper.sol:354:             - timestampsPoolData[_poolToken].timeStamp;

MainHelper.sol:548:             / (lendingPoolData[_poolToken].pseudoTotalPool - feeAmount);

MainHelper.sol:602:         userLendingData[_nftId][_poolToken].shares -= _shares;

MainHelper.sol:687:         uint256 endPosition = length - 1;

MainHelper.sol:899:         return block.timestamp - timestampsPoolData[_poolToken].timeStampScaling >= THREE_HOURS;

MainHelper.sol:1132:             ? borrowRatesData[_poolToken].pole - delta
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:301:         return (_maxPole - _minPole) / NORMALISATION_FACTOR;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:198:                 _flashAmount: leveragedAmount - _initialAmount,
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:190:             - _allowedSpread;

PendlePowerFarmLeverageLogic.sol:375:                 - _totalDebtBalancer

PendlePowerFarmLeverageLogic.sol:403:                 - _totalDebtBalancer

PendlePowerFarmLeverageLogic.sol:425:             - _allowedSpread;

PendlePowerFarmLeverageLogic.sol:475:                         guessMin: netPtFromSwap - 100,
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:314:             - _initialAmount;

PendlePowerFarmMathLogic.sol:331:             ? leveragedPositivAPY - leveragedNegativeAPY

PendlePowerFarmMathLogic.sol:332:             : leveragedNegativeAPY - leveragedPositivAPY;

PendlePowerFarmMathLogic.sol:363:         uint256 newUtilization = PRECISION_FACTOR_E18 - (PRECISION_FACTOR_E18
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:83:         childInfo.reservedForCompound[index] -= _rewardAmount;

PendlePowerFarmController.sol:199:             - totalAssets

PendlePowerFarmController.sol:418:             reservedPendleForLocking -= _amount;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:121:             - INITIAL_TIME_STAMP;

PendlePowerFarmToken.sol:275:                 - lastIndex[i];

PendlePowerFarmToken.sol:344:         totalLpAssetsToDistribute -= additonalAssets;

PendlePowerFarmToken.sol:557:             - reducedShares;

PendlePowerFarmToken.sol:628:         underlyingLpAssetsCurrent -= tokenAmount;

PendlePowerFarmToken.sol:672:         underlyingLpAssetsCurrent -= _underlyingLpAssetAmount;
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:502:             - totalPoolInShares;
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:263:             - timestampsPoolData[_poolToken].initialTimeStamp;

WiseLending.sol:1126:                     - maxPaybackAmount;

WiseLending.sol:1130:                 - refundAmount;
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:239:         globalPoolData[_poolToken].totalPool -= _amount;

WiseLowLevelHelper.sol:257:         lendingPoolData[_poolToken].totalDepositShares -= _amount;

WiseLowLevelHelper.sol:275:         borrowPoolData[_poolToken].pseudoTotalBorrowAmount -= _amount;

WiseLowLevelHelper.sol:293:         borrowPoolData[_poolToken].totalBorrowShares -= _amount;

WiseLowLevelHelper.sol:311:         lendingPoolData[_poolToken].pseudoTotalPool -= _amount;

WiseLowLevelHelper.sol:347:         globalPoolData[_poolToken].totalBareToken -= _amount;

WiseLowLevelHelper.sol:379:         userMapping[_nftId][_poolToken] -= _amount;
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:122:             ) / 10 ** (_decimalsWETH - decimals(_tokenAddress));

OracleHelper.sol:128:         ) / 10 ** (_decimalsWETH - decimals(_tokenAddress));

OracleHelper.sol:432:             - tickCumulatives[0];

OracleHelper.sol:542:             - startedAt;

OracleHelper.sol:582:                 : block.timestamp - upd;

OracleHelper.sol:629:                 latestRoundId - i

OracleHelper.sol:633:                 - currentTimestamp;
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:112:                 / 10 ** (tokenDecimals - _decimalsETH)

WiseOracleHub.sol:163:                 / 10 ** (tokenDecimals - _decimalsETH)

WiseOracleHub.sol:191:                 / 10 ** (_decimalsETH - tokenDecimals);

WiseOracleHub.sol:351:                 / 10 ** (_decimalsETH - tokenDecimals);
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:425:                 - bareCollateral;

WiseSecurity.sol:625:             netAPY = (ethValueGain - ethValueDebt)

WiseSecurity.sol:631:         netAPY = (ethValueDebt - ethValueGain)

WiseSecurity.sol:812:         withdrawAmount = withdrawAmount - _solelyWithdrawAmount;

WiseSecurity.sol:848:             tokenAmount = tokenAmount - _poolWithdrawAmount;

WiseSecurity.sol:882:             - _overallETHBorrow(
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:592:             - WISE_LENDING.getTimeStamp(_poolToken);
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:193:             - balanceBefore;

AaveHelper.sol:233:                 _ethSent - _maxPaybackAmount
```

### <a name="GAS-4"></a>[GAS-4] `a = a + b` is more gas effective than `a += b` for state variables (excluding arrays and mappings)

This saves **16 gas per instance.**

Affected code:

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:220:         incentiveUSD[incentiveOwnerA] += _value;

FeeManager.sol:238:         incentiveUSD[incentiveOwnerB] += _value;
```

- [contracts/FeeManager/FeeManagerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManagerHelper.sol)

```solidity
# File: contracts/FeeManager/FeeManagerHelper.sol

FeeManagerHelper.sol:94:         totalBadDebtETH += _amount;

FeeManagerHelper.sol:201:         feeTokens[_feeToken] += _amount;

FeeManagerHelper.sol:304:             reduceAmount += _gatherIncentives(

FeeManagerHelper.sol:314:             reduceAmount += _gatherIncentives(

FeeManagerHelper.sol:358:                 [_underlyingToken] += incentiveAmount;

FeeManagerHelper.sol:374:             [_underlyingToken] += incentiveAmount;
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:587:         userLendingData[_nftId][_poolToken].shares += _shares;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:140:         reservedPendleForLocking += tokenAmountSend;

PendlePowerFarmController.sol:512:             childInfo.reservedForCompound[i] += _amounts[i];

PendlePowerFarmController.sol:630:                 weightSum += _weights[i];
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:343:         underlyingLpAssetsCurrent += additonalAssets;

PendlePowerFarmToken.sol:512:         totalLpAssetsToDistribute += _amount;

PendlePowerFarmToken.sol:577:         underlyingLpAssetsCurrent += _underlyingLpAssetAmount;
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:230:         globalPoolData[_poolToken].totalPool += _amount;

WiseLowLevelHelper.sol:248:         lendingPoolData[_poolToken].totalDepositShares += _amount;

WiseLowLevelHelper.sol:266:         borrowPoolData[_poolToken].pseudoTotalBorrowAmount += _amount;

WiseLowLevelHelper.sol:284:         borrowPoolData[_poolToken].totalBorrowShares += _amount;

WiseLowLevelHelper.sol:302:         lendingPoolData[_poolToken].pseudoTotalPool += _amount;

WiseLowLevelHelper.sol:338:         globalPoolData[_poolToken].totalBareToken += _amount;

WiseLowLevelHelper.sol:390:         userMapping[_nftId][_poolToken] += _amount;
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:481:             weightedRate += ethValue

WiseSecurity.sol:484:             overallETH += ethValue;

WiseSecurity.sol:538:             weightedRate += ethValue

WiseSecurity.sol:541:             overallETH += ethValue;

WiseSecurity.sol:592:             ethValueDebt += ethValue

WiseSecurity.sol:614:             totalETHSupply += ethValue;

WiseSecurity.sol:615:             ethValueGain += ethValue

WiseSecurity.sol:679:             buffer += WISE_LENDING.lendingPoolData(token).collateralFactor
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:44:             weightedTotal += amount

WiseSecurityHelper.sol:48:             unweightedAmount += amount;

WiseSecurityHelper.sol:90:             weightedTotal += WISE_LENDING.lendingPoolData(tokenAddress).collateralFactor

WiseSecurityHelper.sol:128:             amount += getFullCollateralETH(

WiseSecurityHelper.sol:171:             weightedTotal += WISE_LENDING.lendingPoolData(tokenAddress).collateralFactor

WiseSecurityHelper.sol:214:         ethCollateral += getETHCollateral(

WiseSecurityHelper.sol:267:         ethCollateral += getETHCollateralUpdated(

WiseSecurityHelper.sol:374:             buffer += getETHBorrow(

WiseSecurityHelper.sol:415:             buffer += getETHBorrow(

WiseSecurityHelper.sol:455:             buffer += getETHBorrow(

WiseSecurityHelper.sol:512:             buffer += _getETHBorrowUpdated(
```

### <a name="GAS-5"></a>[GAS-5] Comparing to a Boolean constant

Comparing to a constant (`true` or `false`) is a bit more expensive than directly checking the returned boolean value.

Consider using `if(directValue)` instead of `if(directValue == true)` and `if(!directValue)` instead of `if(directValue == false)`

Affected code:

- [contracts/DerivativeOracles/PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PendleLpOracle.sol)

```solidity
# File: contracts/DerivativeOracles/PendleLpOracle.sol

PendleLpOracle.sol:104:         if (increaseCardinalityRequired == true) {

PendleLpOracle.sol:108:         if (oldestObservationSatisfied == false) {
```

- [contracts/DerivativeOracles/PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOracleDerivative.sol)

```solidity
# File: contracts/DerivativeOracles/PtOracleDerivative.sol

PtOracleDerivative.sol:109:         if (increaseCardinalityRequired == true) {

PtOracleDerivative.sol:113:         if (oldestObservationSatisfied == false) {
```

- [contracts/DerivativeOracles/PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/DerivativeOracles/PtOraclePure.sol)

```solidity
# File: contracts/DerivativeOracles/PtOraclePure.sol

PtOraclePure.sol:90:         if (increaseCardinalityRequired == true) {

PtOraclePure.sol:94:         if (oldestObservationSatisfied == false) {
```

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:261:             if (isAaveToken[tokenAddress] == true) {

FeeManager.sol:418:         if (poolTokenAdded[_poolToken] == true) {

FeeManager.sol:449:         if (poolTokenAdded[_poolToken] == false) {

FeeManager.sol:473:         if (found == true) {

FeeManager.sol:650:         if (isAaveToken[_poolToken] == true) {

FeeManager.sol:701:         if (allowedTokens[caller][_feeToken] == false) {
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:42:         return _maxSharePrice == true

MainHelper.sol:223:         if (verifiedIsolationPool[_poolAddress] == false) {

MainHelper.sol:244:         if (positionLocked[_nftId] == false) {

MainHelper.sol:265:         if (positionLocked[_nftIdLiquidator] == true) {

MainHelper.sol:623:         if (hashMap[hashData] == true) {

MainHelper.sol:712:             isLending == true

MainHelper.sol:929:         _resonanceOutcome(_poolToken, totalShares) == true

MainHelper.sol:1161:         if (_checkLendingDataEmpty(_nftId, _poolToken) == false) {
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:36:         if (parametersLocked[_poolToken] == true) {
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:131:         if (_exists(tokenId) == false) {

PositionNFTs.sol:153:             ) == false

PositionNFTs.sol:319:             _exists(_tokenId) == true,
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:115:         if (isAave[_nftId] == true) {

PendlePowerFarm.sol:191:         if (_notBelowMinDepositAmount(leveragedAmount) == false) {

PendlePowerFarm.sol:226:         uint256 borrowShares = _isAave == false

PendlePowerFarm.sol:234:         uint256 borrowTokenAmount = _isAave == false
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:363:         if (isShutdown == true) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:67:         if (allowEnter == false) {

PendlePowerFarmLeverageLogic.sol:215:         if (_ethBack == true) {

PendlePowerFarmLeverageLogic.sol:333:         if (_isAave == true) {

PendlePowerFarmLeverageLogic.sol:520:         if (_checkDebtRatio(_nftId) == false) {

PendlePowerFarmLeverageLogic.sol:538:         if (_isAave == true) {

PendlePowerFarmLeverageLogic.sol:571:         if (_checkDebtRatio(_nftId) == true) {

PendlePowerFarmLeverageLogic.sol:575:         address paybackToken = isAave[_nftId] == true
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:39:         if (sendingProgress == true) {

PendlePowerFarmMathLogic.sol:43:         if (WISE_LENDING.sendingProgress() == true) {

PendlePowerFarmMathLogic.sol:47:         if (AAVE_HUB.sendingProgressAaveHub() == true) {

PendlePowerFarmMathLogic.sol:330:         uint256 netAPY = isPositive == true
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:291:         if (_checkDebtRatio(wiseLendingNFT) == false) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:304:         if (_compareHashes(_pendleMarket, rewardTokens) == true) {

PendlePowerFarmController.sol:396:             if (_fromInside == false) {

PendlePowerFarmController.sol:413:         if (_fromInside == false) {

PendlePowerFarmController.sol:456:         if (IS_ETH_MAIN == false) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:154:         if (_overWritten == true) {

PendlePowerFarmToken.sol:699:         if (PENDLE_MARKET.isExpired() == true) {
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:51:             ) == true
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:191:             _exists(_tokenId) == true,
```

- [contracts/TransferHub/CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/CallOptionalReturn.sol)

```solidity
# File: contracts/TransferHub/CallOptionalReturn.sol

CallOptionalReturn.sol:31:         if (success == false) {
```

- [contracts/TransferHub/SendValueHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/SendValueHelper.sol)

```solidity
# File: contracts/TransferHub/SendValueHelper.sol

SendValueHelper.sol:33:         if (success == false) {
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:76:         if (_onBehalf == true) {

WiseCore.sol:200:         if (_byPassCase(_caller) == true) {

WiseCore.sol:204:         if (positionLocked[_nftId] == false) {

WiseCore.sol:246:         if (WISE_ORACLE.chainLinkIsDead(_poolToken) == true) {

WiseCore.sol:282:         if (POSITION_NFT.isOwner(_nftId, _caller) == true) {

WiseCore.sol:306:         if (state == true) {

WiseCore.sol:397:         if (_onBehalf == true) {

WiseCore.sol:592:         if (userLendingData[_nftId][_receiveTokens].unCollateralized == true) {
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:87:         if (powerFarmCheck == true) {

WiseLending.sol:290:         if (_aboveThreshold(_poolToken) == true) {

WiseLending.sol:1527:         if (_onBehalf == false) {
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:354:         if (sendingProgress == true) {

WiseLowLevelHelper.sol:358:         if (_sendingProgressAaveHub() == true) {

WiseLowLevelHelper.sol:400:         if (verifiedIsolationPool[_sender] == true) {
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:45:         if (_checkFunctionExistence(address(tokenAggregator)) == false) {

OracleHelper.sol:117:         if (uniTwapPoolInfoStruct.isUniPool == true) {

OracleHelper.sol:270:         if (_chainLinkIsDead(ETH_USD_PLACEHOLDER) == true) {

OracleHelper.sol:526:         if (IS_ARBITRUM_CHAIN == false) {
```

- [contracts/WiseOracleHub/WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/WiseOracleHub.sol)

```solidity
# File: contracts/WiseOracleHub/WiseOracleHub.sol

WiseOracleHub.sol:76:         if (chainLinkIsDead(_tokenAddress) == true) {

WiseOracleHub.sol:451:         if (sequencerIsDead() == true) {

WiseOracleHub.sol:475:             if (state == true) {
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:246:         if (_checkBlacklisted(_poolToken) == true) {

WiseSecurity.sol:255:         if (WISE_LENDING.verifiedIsolationPool(_caller) == true) {

WiseSecurity.sol:259:         if (WISE_LENDING.positionLocked(_nftId) == true) {

WiseSecurity.sol:263:         if (_isUncollateralized(_nftId, _poolToken) == true) {

WiseSecurity.sol:284:         if (_checkBlacklisted(_poolToken) == true) {

WiseSecurity.sol:293:         if (WISE_LENDING.verifiedIsolationPool(_caller) == true) {

WiseSecurity.sol:297:         if (WISE_LENDING.positionLocked(_nftId) == true) {

WiseSecurity.sol:323:         if (WISE_LENDING.verifiedIsolationPool(_caller) == true) {

WiseSecurity.sol:327:         if (WISE_LENDING.positionLocked(_nftId) == true) {

WiseSecurity.sol:343:         if (checkHeartbeat(_poolAddress) == false) {

WiseSecurity.sol:367:         if (_checkBlacklisted(_poolToken) == true) {

WiseSecurity.sol:671:             if (checkHeartbeat(token) == false) {

WiseSecurity.sol:675:             if (wasBlacklisted[token] == true) {

WiseSecurity.sol:716:             if (_checkBlacklisted(token) == true) {

WiseSecurity.sol:741:             if (_checkBlacklisted(token) == true) {

WiseSecurity.sol:792:         if (_isUncollateralized(_nftId, _poolToken) == true) {

WiseSecurity.sol:842:         if (_isUncollateralized(_nftId, _poolToken) == false) {

WiseSecurity.sol:1014:         if (securityWorker[msg.sender] == false) {
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:146:         uint256 maxFee = IS_ETH_MAINNET == true

WiseSecurityDeclarations.sol:150:         uint256 minFee = IS_ETH_MAINNET == true

WiseSecurityDeclarations.sol:164:         uint256 maxFeeFarm = IS_ETH_MAINNET == true

WiseSecurityDeclarations.sol:168:         uint256 minFeeFarm = IS_ETH_MAINNET == true
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:206:         if (_isUncollateralized(_nftId, _poolToken) == true) {

WiseSecurityHelper.sol:263:         if (_isUncollateralized(_nftId, _poolToken) == true) {

WiseSecurityHelper.sol:477:         return wasBlacklisted[_poolToken] == true;

WiseSecurityHelper.sol:678:         if (WISE_LENDING.borrowPoolData(_poolAddress).allowBorrow == false) {

WiseSecurityHelper.sol:694:         return WISE_ORACLE.chainLinkIsDead(_poolToken) == false;

WiseSecurityHelper.sol:707:         if (WISE_LENDING.positionLocked(_nftId) == true) {

WiseSecurityHelper.sol:801:         if (_getState(_nftId, _powerFarm) == true) {

WiseSecurityHelper.sol:822:         uint256 overallCollateral = _powerFarm == true

WiseSecurityHelper.sol:976:         ) == false) {

WiseSecurityHelper.sol:1086:         if (_checkBlacklisted(_poolToken) == true) {

WiseSecurityHelper.sol:1102:         if (_success == false) {
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:38:         if (sendingProgressAaveHub == true) {

AaveHelper.sol:42:         if (WISE_LENDING.sendingProgress() == true) {

AaveHelper.sol:70:         if (POSITION_NFT.isOwner(_nftId, msg.sender) == false) {

AaveHelper.sol:214:         if (success == false) {
```

### <a name="GAS-6"></a>[GAS-6] Using bools for storage incurs overhead

Use uint256(1) and uint256(2) for true/false to avoid a Gwarmaccess (100 gas), and to avoid SSTORE (20000 gas) when changing from ‘false' to ‘true', after having been ‘true' in the past. See [source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/58f635312aa21f947cae5f8578638a85aa2519f5/contracts/security/ReentrancyGuard.sol#L23-L27).

Affected code:

- [contracts/FeeManager/DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/DeclarationsFeeManager.sol)

```solidity
# File: contracts/FeeManager/DeclarationsFeeManager.sol

DeclarationsFeeManager.sol:149:     mapping(address => bool) public poolTokenAdded;

DeclarationsFeeManager.sol:152:     mapping(address => bool) public isAaveToken;

DeclarationsFeeManager.sol:158:     mapping(address => mapping(address => bool)) public allowedTokens;
```

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:447:         bool found;
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:13:         bool allowBorrow;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:42:     bool public isShutdown;

PendlePowerFarmDeclarations.sol:45:     bool public allowEnter;

PendlePowerFarmDeclarations.sol:106:     mapping(uint256 => bool) public isAave;
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:328:         bool isPositive = leveragedPositivAPY >= leveragedNegativeAPY;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol

PendlePowerFarmControllerBase.sol:63:     bool immutable IS_ETH_MAIN;
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:281:             bool scaleNecessary = totalLpAssetsCurrent < lpBalanceController;
```

- [contracts/TransferHub/SendValueHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/SendValueHelper.sol)

```solidity
# File: contracts/TransferHub/SendValueHelper.sol

SendValueHelper.sol:10:     bool public sendingProgress;
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:186:     bool internal powerFarmCheck;

WiseLendingDeclaration.sol:193:         bool unCollateralized;

WiseLendingDeclaration.sol:206:         bool increasePole;

WiseLendingDeclaration.sol:226:         bool allowBorrow;

WiseLendingDeclaration.sol:286:     mapping(uint256 => bool) public positionLocked;

WiseLendingDeclaration.sol:287:     mapping(address => bool) internal parametersLocked;

WiseLendingDeclaration.sol:288:     mapping(address => bool) public verifiedIsolationPool;

WiseLendingDeclaration.sol:291:     mapping(bytes32 => bool) internal hashMapPositionBorrow;

WiseLendingDeclaration.sol:292:     mapping(bytes32 => bool) internal hashMapPositionLending;
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:36:         bool isUniPool;

Declarations.sol:133:     bool internal immutable IS_ARBITRUM_CHAIN;
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:222:     bool immutable IS_ETH_MAINNET;

WiseSecurityDeclarations.sol:238:     mapping(address => bool) public wasBlacklisted;

WiseSecurityDeclarations.sol:247:     mapping(address => bool) public securityWorker;
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:25:     bool public sendingProgressAaveHub;
```

### <a name="GAS-7"></a>[GAS-7] Cache array length outside of loop

If not cached, the solidity compiler will always read the length of the array during each iteration. That is, if it is a storage array, this is an extra sload operation (100 additional extra gas for each iteration except for the first) and if it is a memory array, this is an extra mload operation (3 additional gas for each iteration except for the first).

Affected code:

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:71:         for (uint256 i = 0; i < _underlyingAssets.length; i++) {
```

### <a name="GAS-8"></a>[GAS-8] Avoid contract existence checks by using low level calls

Prior to 0.8.10 the compiler inserted extra code, including `EXTCODESIZE` (**100 gas**), to check for contract existence for external function calls. In more recent solidity versions, the compiler will not insert these checks if the external call has a return value. Similar behavior can be achieved in earlier versions by using low-level calls, since low level calls never check for contract existence

Affected code:

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:281:         return IERC20(_tokenAddress).balanceOf(
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:186:         uint256 balance = IPendleMarket(_pendleMarket).balanceOf(
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:310:         return PENDLE_MARKET.balanceOf(
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:177:         uint256 balanceBefore = token.balanceOf(

AaveHelper.sol:188:         uint256 balanceAfter = token.balanceOf(
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:626:             IERC20(tokenToSend).balanceOf(address(this))
```

### <a name="GAS-9"></a>[GAS-9] Empty blocks should be removed or emit something

The code should be refactored such that they no longer exist, or the block should do something useful, such as emitting an event or reverting. If the contract is meant to be extended, the contract should be `abstract` and the function signatures be added without any default implementation. If the block is an empty `if`-statement block to avoid doing subsequent checks in the else-if/else conditions, the else-if/else conditions should be nested under the negation of the if-statement, because they involve different classes of checks, which may lead to the introduction of errors when the code is later modified (`if (x) {...} else if (y) {...} else {...}` => `if (!x) { if (y) {...} else {...} }`). Empty `receive()`/`fallback() payable` functions that are not used, can be removed to save deployment gas.

Affected code:

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:43:     {}
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:49:     {}
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:126:     {}
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:52:     {}
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:37:     {}
```

### <a name="GAS-10"></a>[GAS-10] `++i` costs less gas compared to `i++` or `i += 1` (same for `--i` vs `i--` or `i -= 1`)

Pre-increments and pre-decrements are cheaper.

For a `uint256 i` variable, the following is true with the Optimizer enabled at 10k:

**Increment:**

- `i += 1` is the most expensive form
- `i++` costs 6 gas less than `i += 1`
- `++i` costs 5 gas less than `i++` (11 gas less than `i += 1`)

**Decrement:**

- `i -= 1` is the most expensive form
- `i--` costs 11 gas less than `i -= 1`
- `--i` costs 5 gas less than `i--` (16 gas less than `i -= 1`)

Note that post-increments (or post-decrements) return the old value before incrementing or decrementing, hence the name *post-increment*:

```solidity
uint i = 1;  
uint j = 2;
require(j == i++, "This will be false as i is incremented after the comparison");
```
  
However, pre-increments (or pre-decrements) return the new value:
  
```solidity
uint i = 1;  
uint j = 2;
require(j == ++i, "This will be true as i is incremented before the comparison");
```

In the pre-increment case, the compiler has to create a temporary variable (when used) for returning `1` instead of `2`.

Consider using pre-increments and pre-decrements where they are relevant (meaning: not where post-increments/decrements logic are relevant).

*Saves 5 gas per instance*

Affected code:

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:178:             totalReserved--;

PositionNFTs.sol:356:             length++;

PositionNFTs.sol:368:             bstr[--k] = bytes1(
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol

PendlePowerManager.sol:206:             availableNFTCount--
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:135:         totalMinted++;

MinterReserver.sol:136:         totalReserved--;
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:228:             length++;

PowerFarmNFTs.sol:240:             bstr[--k] = bytes1(
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:440:             tick--;
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:71:         for (uint256 i = 0; i < _underlyingAssets.length; i++) {
```

### <a name="GAS-11"></a>[GAS-11] Use shift right/left instead of division/multiplication if possible

While the `DIV` / `MUL` opcode uses 5 gas, the `SHR` / `SHL` opcode only uses 3 gas. Furthermore, beware that Solidity's division operation also includes a division-by-0 prevention which is bypassed using shifting. Eventually, overflow checks are never performed for shift operations as they are done for arithmetic operations. Instead, the result is always truncated, so the calculation can be unchecked in Solidity version `0.8+`
- Use `>> 1` instead of `/ 2`
- Use `>> 2` instead of `/ 4`
- Use `<< 3` instead of `* 8`
- ...
- Use `>> 5` instead of `/ 2^5 == / 32`
- Use `<< 6` instead of `* 2^6 == * 64`

TL;DR:
- Shifting left by N is like multiplying by 2^N (Each bits to the left is an increased power of 2)
- Shifting right by N is like dividing by 2^N (Each bits to the right is a decreased power of 2)

*Saves around 2 gas + 20 for unchecked per instance*

Affected code:

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:285:         return PRECISION_FACTOR_E18 / 2

PoolManager.sol:286:             + (PRECISION_FACTOR_E36 / 4

PoolManager.sol:312:         return (_maxPole + _minPole) / 2;
```

### <a name="GAS-12"></a>[GAS-12] `>=` costs less gas than `>`

The compiler uses opcodes `GT` and `ISZERO` for solidity code that uses `>`, but only requires `LT` for `>=`, [which saves **3 gas**](https://gist.github.com/IllIllI000/3dc79d25acccfa16dee4e83ffdc6ffde)

Affected code:

- [contracts/FeeManager/FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManager.sol)

```solidity
# File: contracts/FeeManager/FeeManager.sol

FeeManager.sol:697:         if (totalBadDebtETH > 0) {
```

- [contracts/FeeManager/FeeManagerHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/FeeManager/FeeManagerHelper.sol)

```solidity
# File: contracts/FeeManager/FeeManagerHelper.sol

FeeManagerHelper.sol:179:             newBadDebt > currentBadDebt

FeeManagerHelper.sol:302:         if (incentiveUSD[incentiveOwnerA] > 0) {

FeeManagerHelper.sol:312:         if (incentiveUSD[incentiveOwnerB] > 0) {

FeeManagerHelper.sol:393:         if (_value > PRECISION_FACTOR_E18) {
```

- [contracts/MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/MainHelper.sol)

```solidity
# File: contracts/MainHelper.sol

MainHelper.sol:324:             if (difference > allowedDifference) {

MainHelper.sol:633:         if (userTokenData[_nftId].length > MAX_TOTAL_TOKEN_NUMBER) {

MainHelper.sol:772:         if (userBorrowShares[_nftId][_poolToken] > 0) {

MainHelper.sol:1105:         uint256 setValue = sum > borrowData.maxPole

MainHelper.sol:1131:         uint256 sub = borrowRatesData[_poolToken].pole > delta
```

- [contracts/PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PoolManager.sol)

```solidity
# File: contracts/PoolManager.sol

PoolManager.sol:108:         if (_maximumDeposit > 0) {

PoolManager.sol:112:         if (_collateralFactor > 0) {

PoolManager.sol:268:         if (fetchBalance > 0) {
```

- [contracts/PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PositionNFTs.sol)

```solidity
# File: contracts/PositionNFTs.sol

PositionNFTs.sol:48:         if (feeManager > ZERO_ADDRESS) {

PositionNFTs.sol:87:         if (reserved[_user] > 0) {

PositionNFTs.sol:173:         if (nftId > 0) {

PositionNFTs.sol:258:         if (reservedId > 0) {

PositionNFTs.sol:279:         if (reservedId > 0) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol

PendlePowerFarm.sol:182:         if (_leverage > MAX_LEVERAGE) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:241:         if (_collateralFactor > PRECISION_FACTOR_E18) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol

PendlePowerFarmLeverageLogic.sol:107:         if (initialAmount > 0) {
```

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol

PendlePowerFarmMathLogic.sol:103:         if (positionBorrowShares > 0) {

PendlePowerFarmMathLogic.sol:122:         if (positionBorrowSharesAave > 0) {

PendlePowerFarmMathLogic.sol:186:         if (borrowShares > 0) {

PendlePowerFarmMathLogic.sol:198:         if (borrowSharesAave > 0) {

PendlePowerFarmMathLogic.sol:206:         if (borrowShares > 0) {

PendlePowerFarmMathLogic.sol:359:         if (totalPool > pseudoPool) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol

PendlePowerFarmController.sol:220:         if (pendleChildAddress[_pendleMarket] > ZERO_ADDRESS) {

PendlePowerFarmController.sol:388:         if (_amount > 0) {

PendlePowerFarmController.sol:417:         if (_amount > 0) {

PendlePowerFarmController.sol:475:         if (_getExpiry() > block.timestamp) {

PendlePowerFarmController.sol:635:         if (weightSum > PRECISION_FACTOR_E18) {
```

- [contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol

PendlePowerFarmToken.sol:127:         if (_sharePriceNow > maximum) {

PendlePowerFarmToken.sol:205:             if (rewardsOutsideArray[i] > 0) {

PendlePowerFarmToken.sol:242:             if (userReward.accrued > 0) {

PendlePowerFarmToken.sol:255:             if (lastIndex[i] == 0 && index > 0) {

PendlePowerFarmToken.sol:409:         if (additonalAssets > totalLpAssetsToDistribute) {

PendlePowerFarmToken.sol:598:         if (_newFee > MAX_MINT_FEE) {

PendlePowerFarmToken.sol:619:         if (_shares > balanceOf(msg.sender)) {

PendlePowerFarmToken.sol:663:         if (shares > balanceOf(msg.sender)) {
```

- [contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol

MinterReserver.sol:84:         if (reservedKeys[_userAddress] > 0) {
```

- [contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)

```solidity
# File: contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol

PowerFarmNFTs.sol:130:         if (reservedId > 0) {

PowerFarmNFTs.sol:151:         if (reservedId > 0) {
```

- [contracts/TransferHub/CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/CallOptionalReturn.sol)

```solidity
# File: contracts/TransferHub/CallOptionalReturn.sol

CallOptionalReturn.sol:37:             && token.code.length > 0;
```

- [contracts/WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseCore.sol)

```solidity
# File: contracts/WiseCore.sol

WiseCore.sol:552:         if (pureCollateralAmount[_nftId][_receiveTokens] > 0) {

WiseCore.sol:564:         if (pureCollateral > 0 && userShares > 0) {

WiseCore.sol:572:         if (potentialPureExtraCashout > 0 && potentialPureExtraCashout <= pureCollateral) {
```

- [contracts/WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLending.sol)

```solidity
# File: contracts/WiseLending.sol

WiseLending.sol:1122:         if (msg.value > maxPaybackAmount) {

WiseLending.sol:1147:         if (refundAmount > 0) {
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:146:         if (address(WISE_SECURITY) > ZERO_ADDRESS) {
```

- [contracts/WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLowLevelHelper.sol)

```solidity
# File: contracts/WiseLowLevelHelper.sol

WiseLowLevelHelper.sol:32:         if (_parameterValue > _parameterLimit) {

WiseLowLevelHelper.sol:464:         if (_value > 0) {
```

- [contracts/WiseOracleHub/OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/OracleHelper.sol)

```solidity
# File: contracts/WiseOracleHub/OracleHelper.sol

OracleHelper.sol:19:         if (priceFeed[_tokenAddress] > ZERO_FEED) {

OracleHelper.sol:41:         if (tokenAggregatorFromTokenAddress[_tokenAddress] > ZERO_AGGREGATOR) {

OracleHelper.sol:53:         if (uniTwapPoolInfoStruct.oracle > ZERO_ADDRESS) {

OracleHelper.sol:97:         if (_answer > maxAnswer || _answer < minAnswer) {

OracleHelper.sol:144:         if (uniTwapPoolInfoStruct.oracle > ZERO_ADDRESS) {

OracleHelper.sol:154:         if (tokenAggregatorFromTokenAddress[_tokenAddress] > ZERO_AGGREGATOR) {

OracleHelper.sol:161:         if (fetchTwapValue > 0) {

OracleHelper.sol:224:         if (_answerUint256 > _fetchTwapValue) {

OracleHelper.sol:241:         if (_relativeDifference > ALLOWED_DIFFERENCE) {

OracleHelper.sol:365:         if (uniTwapPoolInfo[_tokenAddress].oracle > ZERO_ADDRESS) {

OracleHelper.sol:584:             return upd > heartBeat[_tokenAddress];

OracleHelper.sol:642:             } else if (currentDiff > currentSecondBiggest) {
```

- [contracts/WiseSecurity/WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurity.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurity.sol

WiseSecurity.sol:248:             if (overallETHBorrowBare(_nftId) > 0) {

WiseSecurity.sol:286:             if (overallETHBorrowBare(_nftId) > 0) {

WiseSecurity.sol:369:             if (overallETHBorrowBare(_nftId) > 0) {

WiseSecurity.sol:788:         if (expectedMaxAmount > maxAmountPool) {

WiseSecurity.sol:804:         if (possibelWithdraw > expectedMaxAmount) {

WiseSecurity.sol:814:         if (withdrawAmount > maxAmountPool) {

WiseSecurity.sol:856:         if (tokenAmount > maxSolelyAmount) {

WiseSecurity.sol:896:         if (tokenAmount > maxPoolAmount) {
```

- [contracts/WiseSecurity/WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityDeclarations.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityDeclarations.sol

WiseSecurityDeclarations.sol:126:         if (_baseReward > LIQUIDATION_INCENTIVE_MAX) {

WiseSecurityDeclarations.sol:136:         if (_baseRewardFarm > LIQUIDATION_INCENTIVE_POWERFARM_MAX) {

WiseSecurityDeclarations.sol:154:         if (_newMaxFeeETH > maxFee) {

WiseSecurityDeclarations.sol:172:         if (_newMaxFeeFarmETH > maxFeeFarm) {
```

- [contracts/WiseSecurity/WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseSecurity/WiseSecurityHelper.sol)

```solidity
# File: contracts/WiseSecurity/WiseSecurityHelper.sol

WiseSecurityHelper.sol:849:         if (overallETHCollateralsWeighted(_nftId) > 0) {
```

- [contracts/WrapperHub/AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHelper.sol)

```solidity
# File: contracts/WrapperHub/AaveHelper.sol

AaveHelper.sol:230:         if (_ethSent > _maxPaybackAmount) {
```

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:537:         if (ethRefundAmount > 0) {

AaveHub.sol:670:         if (aaveTokenAddress[_underlyingAsset] > ZERO_ADDRESS) {
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:111:         if (address(WISE_SECURITY) > ZERO_ADDRESS) {
```

### <a name="GAS-13"></a>[GAS-13] `uint256` to `bool` `mapping`: Utilizing Bitmaps to dramatically save on Gas

https://soliditydeveloper.com/bitmaps

https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/BitMaps.sol

- [BitMaps.sol#L5-L16](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/BitMaps.sol#L5-L16):

```solidity
/**
 * @dev Library for managing uint256 to bool mapping in a compact and efficient way, provided the keys are sequential.
 * Largely inspired by Uniswap's https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol[merkle-distributor].
 *
 * BitMaps pack 256 booleans across each bit of a single 256-bit slot of `uint256` type.
 * Hence booleans corresponding to 256 _sequential_ indices would only consume a single slot,
 * unlike the regular `bool` which would consume an entire slot for a single value.
 *
 * This results in gas savings in two ways:
 *
 * - Setting a zero value to non-zero only once every 256 times
 * - Accessing the same warm slot for every 256 _sequential_ indices
 */
```

Affected code:

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:106:     mapping(uint256 => bool) public isAave;
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:286:     mapping(uint256 => bool) public positionLocked;
```

### <a name="GAS-14"></a>[GAS-14] Increments/decrements can be unchecked in for-loops

In Solidity 0.8+, there's a default overflow check on unsigned integers. It's possible to uncheck this in for-loops and save some gas at each iteration, but at the cost of some code readability, as this uncheck cannot be made inline.

[ethereum/solidity#10695](https://github.com/ethereum/solidity/issues/10695)

The change would be:

```diff
- for (uint256 i; i < numIterations; i++) {
+ for (uint256 i; i < numIterations;) {
 // ...  
+   unchecked { ++i; }
}  
```

These save around **25 gas saved** per instance.

The same can be applied with decrements (which should use `break` when `i == 0`).

The risk of overflow is non-existent for `uint256`.

Affected code:

- [contracts/WrapperHub/AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/AaveHub.sol)

```solidity
# File: contracts/WrapperHub/AaveHub.sol

AaveHub.sol:71:         for (uint256 i = 0; i < _underlyingAssets.length; i++) {
```

### <a name="GAS-15"></a>[GAS-15] WETH address definition can be use directly

WETH is a wrap Ether contract with a specific address in the Ethereum network, giving the option to define it may cause false recognition, it is healthier to define it directly.

    Advantages of defining a specific contract directly:
    
    It saves gas,
    Prevents incorrect argument definition,
    Prevents execution on a different chain and re-signature issues,
    WETH Address : 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

Affected code:

- [contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol)

```solidity
# File: contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol

PendlePowerFarmDeclarations.sol:81:     address internal immutable WETH_ADDRESS;

PendlePowerFarmDeclarations.sol:89:     address immutable AAVE_WETH_ADDRESS;
```

- [contracts/TransferHub/WrapperHelper.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/TransferHub/WrapperHelper.sol)

```solidity
# File: contracts/TransferHub/WrapperHelper.sol

WrapperHelper.sol:9:     IWETH internal immutable WETH;
```

- [contracts/WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseLendingDeclaration.sol)

```solidity
# File: contracts/WiseLendingDeclaration.sol

WiseLendingDeclaration.sol:165:     address public immutable WETH_ADDRESS;
```

- [contracts/WiseOracleHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WiseOracleHub/Declarations.sol)

```solidity
# File: contracts/WiseOracleHub/Declarations.sol

Declarations.sol:76:     address public immutable WETH_ADDRESS;

Declarations.sol:85:     uint8 internal immutable _decimalsWETH;
```

- [contracts/WrapperHub/Declarations.sol](https://github.com/code-423n4/2024-02-wise-lendingcontracts/WrapperHub/Declarations.sol)

```solidity
# File: contracts/WrapperHub/Declarations.sol

Declarations.sol:34:     address immutable public WETH_ADDRESS;
```

