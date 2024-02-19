# ✨ So you want to run an audit

This `README.md` contains a set of checklists for our audit collaboration.

Your audit will use two repos:
- **an _audit_ repo** (this one), which is used for scoping your audit and for providing information to wardens
- **a _findings_ repo**, where issues are submitted (shared with you after the audit)

Ultimately, when we launch the audit, this repo will be made public and will contain the smart contracts to be reviewed and all the information needed for audit participants. The findings repo will be made public after the audit report is published and your team has mitigated the identified issues.

Some of the checklists in this doc are for **C4 (🐺)** and some of them are for **you as the audit sponsor (⭐️)**.

---

# Audit setup

## 🐺 C4: Set up repos
- [ ] Create a new private repo named `YYYY-MM-sponsorname` using this repo as a template.
- [ ] Rename this repo to reflect audit date (if applicable)
- [ ] Rename auditt H1 below
- [ ] Update pot sizes
- [ ] Fill in start and end times in audit bullets below
- [ ] Add link to submission form in audit details below
- [ ] Add the information from the scoping form to the "Scoping Details" section at the bottom of this readme.
- [ ] Add matching info to the Code4rena site
- [ ] Add sponsor to this private repo with 'maintain' level access.
- [ ] Send the sponsor contact the url for this repo to follow the instructions below and add contracts here.
- [ ] Delete this checklist.

# Repo setup

## ⭐️ Sponsor: Add code to this repo

- [ ] Create a PR to this repo with the below changes:
- [ ] Provide a self-contained repository with working commands that will build (at least) all in-scope contracts, and commands that will run tests producing gas reports for the relevant contracts.
- [ ] Make sure your code is thoroughly commented using the [NatSpec format](https://docs.soliditylang.org/en/v0.5.10/natspec-format.html#natspec-format).
- [ ] Please have final versions of contracts and documentation added/updated in this repo **no less than 48 business hours prior to audit start time.**
- [ ] Be prepared for a 🚨code freeze🚨 for the duration of the audit — important because it establishes a level playing field. We want to ensure everyone's looking at the same code, no matter when they look during the audit. (Note: this includes your own repo, since a PR can leak alpha to our wardens!)


---

## ⭐️ Sponsor: Edit this `README.md` file

- [ ] Modify the contents of this `README.md` file. Describe how your code is supposed to work with links to any relevent documentation and any other criteria/details that the C4 Wardens should keep in mind when reviewing. (Here are two well-constructed examples: [Ajna Protocol](https://github.com/code-423n4/2023-05-ajna) and [Maia DAO Ecosystem](https://github.com/code-423n4/2023-05-maia))
- [ ] Review the Gas award pool amount. This can be adjusted up or down, based on your preference - just flag it for Code4rena staff so we can update the pool totals across all comms channels.
- [ ] Optional / nice to have: pre-record a high-level overview of your protocol (not just specific smart contract functions). This saves wardens a lot of time wading through documentation.
- [ ] [This checklist in Notion](https://code4rena.notion.site/Key-info-for-Code4rena-sponsors-f60764c4c4574bbf8e7a6dbd72cc49b4#0cafa01e6201462e9f78677a39e09746) provides some best practices for Code4rena audits.

## ⭐️ Sponsor: Final touches
- [ ] Review and confirm the details in the section titled "Scoping details" and alert Code4rena staff of any changes.
- [ ] Review and confirm the list of in-scope files in the `scope.txt` file in this directory.  Any files not listed as "in scope" will be considered out of scope for the purposes of judging, even if the file will be part of the deployed contracts.
- [ ] Check that images and other files used in this README have been uploaded to the repo as a file and then linked in the README using absolute path (e.g. `https://github.com/code-423n4/yourrepo-url/filepath.png`)
- [ ] Ensure that *all* links and image/file paths in this README use absolute paths, not relative paths
- [ ] Check that all README information is in markdown format (HTML does not render on Code4rena.com)
- [ ] Remove any part of this template that's not relevant to the final version of the README (e.g. instructions in brackets and italic)
- [ ] Delete this checklist and all text above the line below when you're ready.

---

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

❗️❗️ **Please note:** if ANY valid High severity issues are found, the Total Prize Pool increases to $200,000 USDC.  The HM award will increase to $154,565.  All other awards will be capped at the amounts listed above.

## Automated Findings / Publicly Known Issues

The 4naly3er report can be found [here](https://github.com/code-423n4/2024-02-wise-lending/blob/main/4naly3er-report.md).

Automated findings output for the audit can be found [here](https://github.com/code-423n4/2024-02-wise-lending/blob/main/bot-report.md) within 24 hours of audit opening.

_Note for C4 wardens: Anything included in this `Automated Findings / Publicly Known Issues` section is considered a publicly known issue and is ineligible for awards._

[ ⭐️ SPONSORS: Are there any known issues or risks deemed acceptable that shouldn't lead to a valid finding? If so, list them here. ]


# Overview

## Links

- **Previous audits: Hats finance and Omniscia**
- **Documentation: https://wisesoft.gitbook.io/wise**
- **Website: https://wiselending.com/**
- **Twitter: https://twitter.com/Wise_Lending**
- **Discord: https://discord.gg/TjeqXnTkSk**

# Scope

## In Scope:

Breakdown by folder:

```
|-- FeeManager
|-- MainHelper.sol
|-- OwnableMaster.sol
|-- PoolManager.sol
|-- PositionNFTs.sol
|-- WiseCore.sol
|-- WiseLending.sol
|-- WiseLendingDeclaration.sol
|-- WiseLowLevelHelper.sol
├── DerivativeOracles
│   ├── CustomOracleSetup.sol
│   ├── PendleChildLpOracle.sol
│   ├── PendleLpOracle.sol
│   ├── PtOracleDerivative.sol
│   └── PtOraclePure.sol
├── FeeManager
│   ├── DeclarationsFeeManager.sol
│   ├── FeeManager.sol
│   ├── FeeManagerEvents.sol
│   └── FeeManagerHelper.sol
├── PowerFarms
│   ├── PendlePowerFarm
│   │   ├── PendlePowerFarm.sol
│   │   ├── PendlePowerFarmDeclarations.sol
│   │   ├── PendlePowerFarmLeverageLogic.sol
│   │   ├── PendlePowerFarmMathLogic.sol
│   │   └── PendlePowerManager.sol
│   ├── PendlePowerFarmController
│   │   ├── PendlePowerFarmController.sol
│   │   ├── PendlePowerFarmControllerBase.sol
│   │   ├── PendlePowerFarmControllerHelper.sol
│   │   ├── PendlePowerFarmTokenFactory.sol
│   │   └── PendlePowerFarmToken.sol
│   └── PowerFarmNFTs
│       ├── MinterReserver.sol
│       └── PowerFarmNFTs.sol
├── TransferHub
│   ├── ApprovalHelper.sol
│   ├── CallOptionalReturn.sol
│   ├── SendValueHelper.sol
│   ├── TransferHelper.sol
│   └── WrapperHelper.sol
├── WiseOracleHub
│   ├── Declarations.sol
│   ├── OracleHelper.sol
│   └── WiseOracleHub.sol
├── WiseSecurity
│   ├── WiseSecurity.sol
│   ├── WiseSecurityDeclarations.sol
│   └── WiseSecurityHelper.sol
└── WrapperHub
    ├── AaveEvents.sol
    ├── AaveHelper.sol
    ├── AaveHub.sol
    └── Declarations.sol
```

## Out of scope:

- Any findings in our previous audit by Omniscia are OOS: https://app.wiselending.com/omni-audit-v1.pdf

- Any submissions and issuse related to Hats finance bug bounty are OOS: https://app.hats.finance/audit-competitions/wise-lending-0xa2ca45d6e249641e595d50d1d9c69c9e3cd22573/submissions

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

## Additional Notes:
- No specific ERC compatibility in mind
- No support for fees on transfer (hello USDT)


*List any files/contracts that are out of scope for this audit.*

- All files/contracts which are not included in the above breakdown are OOS.

# Additional Context

- For general infos one visit our gitbook: https://wisesoft.gitbook.io/wise

- We us a dynamic way to set the borrow rate curve depending on the total lending share amount and its change over time. A theoretical basics are explained in the LASA white paper: https://github.com/wise-foundation/liquidnfts-audit-scope/blob/master/LASA-Paper.pdf

- There is one master role which will be managed by a timelock contract in the future. This role maintains the system and sets all adjustable parameters. Additionally, there is the extra role of the securityWorker which can perform a security lock. This role can be only be assigned by the master.


- [ ] Please list specific ERC20 that your protocol is anticipated to interact with. Could be "any" (literally anything, fee on transfer tokens, ERC777 tokens and so forth) or a list of tokens you envision using on launch.
- [ ] Please list specific ERC721 that your protocol is anticipated to interact with.
- [ ] Which blockchains will this code be deployed to, and are considered in scope for this audit?
- [ ] Please list all trusted roles (e.g. operators, slashers, pausers, etc.), the privileges they hold, and any conditions under which privilege escalation is expected/allowable
- [ ] In the event of a DOS, could you outline a minimum duration after which you would consider a finding to be valid? This question is asked in the context of most systems' capacity to handle DoS attacks gracefully for a certain period.
- [ ] Is any part of your implementation intended to conform to any EIP's? If yes, please list the contracts in this format:
  - `Contract1`: Should comply with `ERC/EIPX`
  - `Contract2`: Should comply with `ERC/EIPY`


## Scoping Details
[ ⭐️ SPONSORS: please confirm/edit the information below. ]

```
- If you have a public code repo, please share it here:
- How many contracts are in scope?: 13
- Total SLoC for these contracts?: 6500
- How many external imports are there?:
- How many separate interfaces and struct definitions are there for the contracts within scope?: interface 35, structs 10
- Does most of your code generally use composition or inheritance?:  Inheritance
- How many external calls?: 3
@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol,
@pendle/core-v2/contracts/oracles/PendleLpOracleLib.sol, rest is all internal (relative to our contracts folder)

- What is the overall line coverage percentage provided by your tests?: 35
- Is this an upgrade of an existing system?: False
- Check all that apply (e.g. timelock, NFT, AMM, ERC20, rollups, etc.): Timelock function,  Uses L2,  NFT,  Multi-Chain,  ERC-20 Token, Non ERC-20 Token
- Is there a need to understand a separate part of the codebase / get context in order to audit this part of the protocol?: True - Curve protocol, Pendle Finance
- Please describe required context: Curve protocol, Pendle Finance
- Does it use an oracle?:  Chainlink
- Describe any novel or unique curve logic or mathematical models your code uses: https://github.com/wise-foundation/liquidnfts-audit-scope/blob/master/LASA-Paper.pdf
- Is this either a fork of or an alternate implementation of another project?: N/A
- Does it use a side-chain?:
- Describe any specific areas you would like addressed:
```

# Tests

*Provide every step required to build the project from a fresh git clone, as well as steps to run the tests with a gas report.*

*Note: Many wardens run Slither as a first pass for testing.  Please document any known errors with no workaround.*
