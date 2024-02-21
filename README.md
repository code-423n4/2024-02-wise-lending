# Wise Lending audit details
- Total Prize Pool: $140,000 in USDC
  - HM awards: $94,465 in USDC
  - Analysis awards: $5,725 in USDC
  - QA awards: $2,862 in USDC
  - Bot Race awards: $8,586 in USDC
  - Gas awards: $2,862 in USDC
  - Judge awards: $15,000 in USDC
  - Lookout awards: $10,000 in USDC
  - Scout awards: $500 in USDC
- Join [C4 Discord](https://discord.gg/code4rena) to register
- Submit findings [using the C4 form](https://code4rena.com/contests/2024-02-wise-lending/submit)
- [Read our guidelines for more details](https://docs.code4rena.com/roles/wardens)
- Starts February 21, 2024 20:00 UTC
- Ends March 11, 2024 20:00 UTC

❗️❗️ **Please note:** if ANY valid High severity issues are found, the Total Prize Pool increases to &#36;200,000 USDC.  The HM award will increase to &#36;154,565.  All other awards will be capped at the amounts listed above.

## Automated Findings / Publicly Known Issues

The 4naly3er report can be found [here](https://github.com/code-423n4/2024-02-wise-lending/blob/main/4naly3er-report.md).

Automated findings output for the audit can be found [here](https://github.com/code-423n4/2024-02-wise-lending/blob/main/bot-report.md) within 24 hours of audit opening.

_Note for C4 wardens: Anything included in this `Automated Findings / Publicly Known Issues` section is considered a publicly known issue and is ineligible for awards._


# Overview

## Links

- **Previous audits:** https://app.wiselending.com/omni-audit-v1.pdf, https://app.hats.finance/audit-competitions/wise-lending-0xa2ca45d6e249641e595d50d1d9c69c9e3cd22573/submissions
- **Documentation:** https://wisesoft.gitbook.io/wise
- **Website:** https://wiselending.com/
- **Twitter:** https://twitter.com/Wise_Lending
- **Discord:** https://discord.gg/TjeqXnTkSk

# Scoping details

## Files in scope

| File                                                        | SLOC |
|-------------------------------------------------------------|------|
| [WiseLending.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseLending.sol)                         | 511  |
| [WiseSecurity.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseSecurity/WiseSecurity.sol) | 428  |
| [MainHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/MainHelper.sol)                           | 401  |
| [WiseSecurityHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseSecurity/WiseSecurityHelper.sol) | 347  |
| [PendlePowerFarmToken.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol) | 333  |
| [FeeManager.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/FeeManager/FeeManager.sol)     | 304  |
| [PendlePowerFarmLeverageLogic.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmLeverageLogic.sol) | 258  |
| [OracleHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseOracleHub/OracleHelper.sol) | 250  |
| [PendlePowerFarmController.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmController.sol) | 247  |
| [WiseCore.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseCore.sol)                               | 242  |
| [WiseLendingDeclaration.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseLendingDeclaration.sol)   | 213  |
| [WiseOracleHub.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseOracleHub/WiseOracleHub.sol) | 180  |
| [AaveHub.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WrapperHub/AaveHub.sol)           | 173  |
| [WiseLowLevelHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseLowLevelHelper.sol)           | 168  |
| [PendlePowerFarmDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmDeclarations.sol) | 160  |
| [PendlePowerFarmController/PendlePowerFarmControllerBase.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerBase.sol) | 145  |
| [AaveHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WrapperHub/AaveHelper.sol)     | 144  |
| [PositionNFTs.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PositionNFTs.sol)                       | 143  |
| [WiseSecurityDeclarations.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseSecurity/WiseSecurityDeclarations.sol) | 142  |
| [PoolManager.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PoolManager.sol)                         | 141  |
| [FeeManagerHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/FeeManager/FeeManagerHelper.sol) | 129  |
| [PendlePowerFarmMathLogic.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarm/PendlePowerFarmMathLogic.sol) | 123  |
| [DeclarationsFeeManager.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/FeeManager/DeclarationsFeeManager.sol) | 117  |
| [PendlePowerManager.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarm/PendlePowerManager.sol)         | 103  |
| [PendlePowerFarmControllerHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmControllerHelper.sol) | 96   |
| [PendlePowerFarm.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarm/PendlePowerFarm.sol)               | 89   |
| [PowerFarmNFTs.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol)          | 84   |
| [MinterReserver.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PowerFarmNFTs/MinterReserver.sol)         | 70   |
| [PendleLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/DerivativeOracles/PendleLpOracle.sol)                    | 66   |
| [Declarations.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WiseOracleHub/Declarations.sol)                           | 66   |
| [PtOracleDerivative.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/DerivativeOracles/PtOracleDerivative.sol)                | 62   |
| [Declarations.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WrapperHub/Declarations.sol)                              | 56   |
| [PtOraclePure.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/DerivativeOracles/PtOraclePure.sol)                      | 54   |
| [OwnableMaster.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/OwnableMaster.sol)                     | 52   |
| [PendlePowerFarmTokenFactory.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol) | 49   |
| [PendleChildLpOracle.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/DerivativeOracles/PendleChildLpOracle.sol)               | 42   |
| [FeeManagerEvents.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/FeeManager/FeeManagerEvents.sol) | 39   |
| [CustomOracleSetup.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/DerivativeOracles/CustomOracleSetup.sol)                | 29   |
| [SendValueHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/TransferHub/SendValueHelper.sol)                         | 17   |
| [WrapperHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/TransferHub/WrapperHelper.sol)                           | 14   |
| [CallOptionalReturn.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/TransferHub/CallOptionalReturn.sol)                      | 12   |
| [TransferHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/TransferHub/TransferHelper.sol)                           | 10   |
| [AaveEvents.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/WrapperHub/AaveEvents.sol)     | 10   |
| [ApprovalHelper.sol](https://github.com/code-423n4/2024-02-wise-lending/blob/main/contracts/TransferHub/ApprovalHelper.sol)                        | 7    |
| **SUM:**                                                    | **6326** |



## Known issues:

- The difference between indexed rewards for the PendlePowerFarmController and actual rewards is to be ignored and does not count as a bug.

- The difference in rewards caused by a potential change in rewardTokenAddresses by pendleMarket itself is to be ignored and does not count as a bug.

- For the PendlePowerFarmToken contract distribution of compounding rewards in the edge case of no interaction in a week in one lump is to be ignored and does not count as a bug.

- (Part 1) One entity could force the current stepping direction by using flash loans and dumping a huge amount into the pool with a transaction triggering the algorithm (after three hours). In the same transaction, the entity could withdraw the amount and finish paying back the flash loan. The entity could repeat this every three hours, manipulating the stepping direction.Now, we changed it in a way that the algorithm runs before the user adds or withdraws tokens, which influences the shares. Thus, the attacker needs to put the tokens inside the pool one block before the update block AND needs to be the last transaction in that block to be sure to add the right token amount. Following a flash loan is not possible anymore because the user can't pay back the loan in the same transaction. The tokens need to stay at least one block inside the pool.This closes the attack vector, but there may still be a possible scenario. If the attacker has a lot of tokens, they can add the tokens before the update but need to time this (the last person in one block before the update). Then they can withdraw the tokens in the next block and also force the stepping to hold its direction. When the attacker wants to repeat this, they need to keep these tokens fluid every three hours; otherwise, their attack gets automatically reverted in the next update round because they removed the token amount after the last update, resulting in a reduction of shares. So the downsides for the attacker are:
    - The user needs to own tokens for the attack. 
    - Tokens are needed every three hours to keep up the attack (can't really do something else with them). Depending on the other entities, they need to put even more tokens to keep the attack up (other users can     withdraw).
    - The attacker needs to do this for all pools separately!

- (Part 2) Even when an attacker is doing this, we can set the pool params so that the curve is a static one (like Aave) when we set the _upperBoundMaxRate and _lowerBoundMaxRate rates very close. Or we can just reset them.
Even though the attacker can't drain any funds with this attack and loses money over time, the only benefit for this entity is to annoy us. In summary, we are aware of this attack, but with all these arguments, we don't see it as a problem. This is because:
  - The attacker can't drain any funds. Loses money to keep it up.
  - Only affects the slope of the utilization curve. The reaction to it is still in the hands of the users.
  - We can reset the curve or even set it constant in a sense that is not affected anymore by the stepping of the pole.

- In case of liquidation is rounded against the liquidator when it comes to evaluating the amount of tokens they payback related to the borrowshares they payoff, which means any additional value from that effect gets transferred to all other borrowers. This is intended since the other way around would mean you syphon value out of other non participating users (not participating in the liquidation event) instead.

- In all kind of interactions with the protocol, we round against the user and not against the pool, except for liquidation transfer amount. This is intentional. The reason for this is to cancel potential roundings which could be receptured by the liquidator. Because we round the shares against the liquidatee and lending shareprice is always greater or equal one, this will not extract value from the pool.

- Since shareprice is limited massively this value extraction can be neglected since it only becomes relevant when the value of 1 share becomes in order of magnitude of of the total amounts of shares. The total amount of value extractable is also limited by the collateralamount itself. This is intended since the other option is to extract value from users who are not participating in the exchange.

- Also excluded are external view functions which are not used for statechanges in the relevant contracts/files. E.g maximumBorrowToken...

- Potential token or aToken stuck in the feeManger.sol is a known issue and therefore OOS.

- The ghostshares with the magnitude of 10^3 aquire interest over time which is lost to the system since they capture a tiny part of the interest but can be neglected because of the exponential difference in orders of magnitude compared to a normally used pool and is therfor known and not part of the audit aswell.

- Also excluded are centralizing effects of any kind relating to the behaviour of entities. E.g master can submit a malicious pool etc.

- If any rounding errors in the incentives for paying back badDebt exist this is excluded aswell since this does not interact with any user funds since this is taken from admin fees.

- If any rounding errors exist in the pendlePowerFarm token which dont create a way to extract value which is not planned is excluded aswell. This also includes compounding as an exclusion since it is related to incentives.

- If you query borrowdata for lasa before it might change the stepping direction or reset it the extrernal view function may differ in calculation for the actual borrowrate taken for the current time period until the next time syncPool is triggered. This is necessary to prevent flashloan meddeling with the algorithm and is known and not considered a bug.

- The attack from very well capitalized entity to block deposits or paybacks (normal or aaveHub) for other users is known and judged by us as impractical. Thus we declare it OOS.

- If Aave freezes pools where we use the underlying as a pool new aTokens can't be minted and thus open borrow positions can't pay it back. If Aave unfreezes the pool the functionality is restored. This can be mitigated in the future by wrapping the aTokens into new tokens which also accept the underlying. Then after adding that to a pool this is mitigated. So the risk is known and not considered a bug and can be migrated after launch while its still not frozen.

- Users can deposit dust into other peoples nfts which can increase the gasprice for using that nft for borrowing or withdrawing having an open borrow position. We have a function to set minDepositAmount to mitigate that if we see people are doing that. (Attacker loses money themselves (gas) by doing that and after mindepositAmount that amount aswell)

- In case of withdrawing an uncollateralized asset if you happen to be above 95% debtratio anyway it will still fail (only then). Being above 95% basically means you are in liquidation mode and are therfore incentivized to to use your uncollateralized as collateral instead of removing it to save money and avoid liquidation. Therfore this is not seen as a bug by us.

- If heartbeat of one of the lending or borrow tokens is dead and user has open borrow position user cant withdraw or borrow during that time period however since they can always payback either the current dead borrow token in full and thus remove it or payback all tokens they can still acess their funds and thus this is not counted as a bug and is marked as known.

- If a user has a currently heartbeat dead token he cant be liquidated but since borrowing or depositing a deadtoken will revert you cannot use that fact to make your self not liquidatable and thus not exploitable. This is not considered a bug since we consider an offline feed more dangerous (see blizz finance ust incident). As soon as the feed returns liquidation is possible again.

- Also excluded are secondary centralization effects e.g bugs in other used projects like uniswapV3 etc. The twap check for the oracle can result in momentary denial of service of withdrawing with an open borrow position or borrowing itself. This is intended for a discrepancy between both used oracles. No funds are locked since people can always payback and then withdraw even with no functioning oracle.

- Also excluded are centralizing effects of any kind relating to the behaviour of entities. E.g master can submit a malicious pool, revokeMaster() etc.

- Also the redundant curveSecurityCheck() for borrow tokens is known and not and issue, because all derivate tokens used for wiselending are deployed with _allowBorrow == false. This includes e.g. pendle PT, pendle LPs, Curve or any upcoming. For example after the exypiration day no new Pendle LP can be minted which is irrelevant because these pools are deployed with _allowBorrow == false.
In the future we will remove the reduntand curveSecurityCheck for borrow tokens.

- We bounded the borrowShare price from below by 5 * 10^17. Every interaction like payback and borrow are decreasing the borrowShare price (rounding against user but for the pool) but this is usually captured by intrest from open borrow position. Nevertheless, it is possible to force the sharePrice to this lower bound by looping borrows and/or paybacks. This could result in a DOS for the whole pool but this would requiere looping more than approx 10 ** 14 transaction for a "fresh" pool and therefore considerd impractical and thus OOS.

- PowerFarms are only planned to have 1 collateral. Any "bugs" related to having more collaterals for powerFarms are out of scope.

- The main usecase of blacklist is a kill switch pause for all pools. You can always payback everything and access your money but everything else including uncollateralized etc. is paused for security reasons".

- Liquidations are enabled for blacklisted tokens. This is intentional.

- Bad debt accrues interest is known and intended.

- No specific ERC compatibility in mind

- No support for fees on transfer (hello USDT)

# Additional Context

- For general infos one visit our gitbook: https://wisesoft.gitbook.io/wise

- We us a dynamic way to set the borrow rate curve depending on the total lending share amount and its change over time. A theoretical basics are explained in the LASA white paper: https://github.com/wise-foundation/liquidnfts-audit-scope/blob/master/LASA-Paper.pdf

- There is one master role which will be managed by a timelock contract in the future. This role maintains the system and sets all adjustable parameters. Additionally, there is the extra role of the securityWorker which can perform a security lock. This role can be only be assigned by the master.

- The protocol will be deployed on ETH and Arbitrum. On ETH AaveHub will NOT be used.

- ERC20 in scope: WETH, WBTC, LINK, DAI, WstETH, sDAI, USDC, USDT, WISE and may others in the future. (Also corresponding Aave tokens if existing)

- Is there a need to understand a separate part of the codebase / get context in order to audit this part of the protocol?: True - Curve protocol, Pendle Finance

- Describe any novel or unique curve logic or mathematical models your code uses: https://github.com/wise-foundation/liquidnfts-audit-scope/blob/master/LASA-Paper.pdf

