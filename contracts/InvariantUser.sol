// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import {CommonBase} from "forge-std/Base.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";

import "./Tests/TesterLending.t.sol";
import "./InterfaceHub/IPositionNFTs.sol";
import "./InterfaceHub/IWiseOracleHub.sol";
import "./InterfaceHub/IWiseSecurity.sol";
import "./../contracts/InterfaceHub/IERC20.sol";
import "forge-std/console.sol";

contract InvariantUser is CommonBase, StdCheats, StdUtils {
    TesterLending private lendingUserInstance;
    IPositionNFTs private nftHandlerInstance;
    IWiseOracleHub private wiseOracleHubInstance;
    IWiseSecurity private wiseSecurityInstance;

    uint256 public invariantBalance;
    uint256 public invariantShares;

    address public immutable WETH_ADDRESS;
    address public immutable USDC_ADDRESS;

    uint256[] public nftsUsed;

    address[] public tokens;

    struct LoopInfo {
        uint256 cashedBalance;
        uint256 boundAmount;
        uint256 shares;
        uint256 sharesReceived;
        uint256 balanceLeftToDeposit;
        uint256 amountReceived;
        uint256 sum;
        bool balanceBigger;
    }

    constructor (
        address _testerLendingAddress,
        address _wiseOracleHubAddress,
        address[] memory _tokens
    )
    {
        lendingUserInstance = TesterLending(
            payable(_testerLendingAddress)
        );

        nftHandlerInstance = IPositionNFTs(
            lendingUserInstance.POSITION_NFT()
        );

        wiseOracleHubInstance = IWiseOracleHub(
            _wiseOracleHubAddress
        );

        uint256 desiredNftLength = 4;

        for (uint256 i = 0; i < desiredNftLength; i++) {
            uint256 id = nftHandlerInstance.mintPosition();
            nftsUsed.push(id);
        }

        WETH_ADDRESS = lendingUserInstance.WETH_ADDRESS();

        USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // ETH- MAIN

        for (uint256 i = 0; i < _tokens.length; i++) {
            tokens.push(_tokens[i]);
        }

        wiseSecurityInstance = IWiseSecurity(
            lendingUserInstance.WISE_SECURITY()
        );
    }

    receive()
        external
        payable
    {}

    function depositFixAmount()
        public
    {
        lendingUserInstance.depositExactAmountETH{value:1.01 ether}(0);
    }

    function getNftLength()
        public
        view
        returns (uint256)
    {
        return nftsUsed.length;
    }

    function getTokensLength()
        public
        view
        returns (uint256)
    {
        return tokens.length;
    }

    function getTokenByIndex(
        uint256 _index
    )
        public
        view
        returns (address)
    {
        return tokens[_index];
    }

    function getNftByIndex(
        uint256 _index
    )
        public
        view
        returns (uint256)
    {
        return nftsUsed[_index];
    }

    function _getNftWithDeposit()
        internal
        view
        returns (uint256[] memory)
    {
        uint256 nftLength = nftsUsed.length;

        uint256[] memory gatherNfts = new uint256[](nftLength);

        uint256 k;

        for (uint256 i = 0; i < nftLength; i++) {
            uint256 nftId = nftsUsed[i];
            uint256 length = lendingUserInstance.getPositionLendingTokenLength(nftId);
            if (length > 0) {

                gatherNfts[k] = nftId;
                k += 1;
            }
        }

        uint256[] memory nfts = new uint256[](k);

        for (uint256 i = 0; i < k; i++) {
            nfts[i] = gatherNfts[i];
        }

        return nfts;
    }

    function _getNftBoundWithValue(
        uint256 _nftId
    )
        internal
        view
        returns (uint256)
    {
        uint256[] memory nfts = _getNftWithDeposit();
        uint256 length = nfts.length;

        if (length == 0) {
            return 0;
        }

        uint256 index = bound(
            _nftId,
            0,
            length - 1
        );

        return nfts[index];
    }

    function depositExactAmount(
        uint256 _tokenIndex,
        uint256 _amount,
        uint256 _nftId
    )
        public
    {
        _nftId = _getNftBound(
            _nftId
        );

        _tokenIndex = _getTokenIndexBound(
            _tokenIndex
        );

        _amount = _getAmountBound(
            _amount,
            _tokenIndex
        );

        address token = tokens[_tokenIndex];

        lendingUserInstance.depositExactAmount(
            _nftId,
            token,
            _amount
        );
    }

    function depositExactAmountETH(
        uint256 _amount,
        uint256 _nftId
    )
        public
    {
        _nftId = _getNftBound(
            _nftId
        );

        _amount = bound(
            _amount,
            0,
            address(this).balance
        );

        lendingUserInstance.depositExactAmountETH{value:_amount}(
            _nftId
        );
    }

    function withdrawExactAmount(
        uint256 _tokenIndex,
        uint256 _amount,
        uint256 _nftId
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        _tokenIndex = _getWithdrawTokenIndex(
            _nftId,
            false
        );

        lendingUserInstance.syncManually(
            tokens[_tokenIndex]
        );

        _amount = bound(
            _amount,
            0,
            lendingUserInstance.cashoutAmount(
                tokens[_tokenIndex],
                lendingUserInstance.getPositionLendingShares(
                    _nftId,
                    tokens[_tokenIndex]
                )
            )
        );

        address token = tokens[_tokenIndex];

        if (_amount > 0) {
            lendingUserInstance.withdrawExactAmount(
                _nftId,
                token,
                _amount
            );

        }else {
            revert();
        }
    }

    function withdrawExactAmountETH(
        uint256 _amount,
        uint256 _nftId
    )
        public
    {
        _nftId = _getNftBoundWithValueEth(
            _nftId,
            false
        );

        lendingUserInstance.syncManually(
            WETH_ADDRESS
        );

        _amount = bound(
            _amount,
            0,
            lendingUserInstance.cashoutAmount(
                WETH_ADDRESS,
                lendingUserInstance.getPositionLendingShares(
                    _nftId,
                    WETH_ADDRESS
                )
            )
        );

        if (_amount > 0) {
            lendingUserInstance.withdrawExactAmountETH(
                _nftId,
                _amount
            );

        }else {
            revert();
        }
    }

    function _getWithdrawTokenIndex(
        uint256 _nftId,
        bool _solely
    )
        internal
        view
        returns (uint256 index)
    {
        (
            ,
            uint256 overall
        ) = wiseSecurityInstance.overallETHCollateralsBoth(
            _nftId
        );

        if (overall == 0) {
            return 0;
        }

        uint256 collateralsLength = lendingUserInstance.getPositionLendingTokenLength(_nftId);
        uint256 k;

        address[] memory gatherTokensSolely = new address[](k);

        if (_solely) {
            for (uint256 i = 0; i < collateralsLength; i++) {
                address poolToken = lendingUserInstance.getPositionLendingTokenByIndex(_nftId,i);
                uint256 pureAmount = lendingUserInstance.getPureCollateralAmount(
                    _nftId,
                    poolToken
                );
                if (pureAmount > 0) {
                    k += 1;
                }
            }
            gatherTokensSolely = new address[](k);
            k = 0;
            for (uint256 i = 0; i < collateralsLength; i++) {
                address poolToken = lendingUserInstance.getPositionLendingTokenByIndex(_nftId,i);
                uint256 pureAmount = lendingUserInstance.getPureCollateralAmount(
                    _nftId,
                    poolToken
                );
                if (pureAmount > 0) {
                    gatherTokensSolely[k] = poolToken;
                    k += 1;
                }
            }
        }

        collateralsLength = _solely == true
            ? k
            : collateralsLength;

        uint256 indexer = bound(
            index,
            0,
            collateralsLength - 1
        );

        address token = _solely
            ? gatherTokensSolely[indexer]
            : lendingUserInstance.getPositionLendingTokenByIndex(
                _nftId,
                indexer
            );

        for (uint256 i = 0; i < tokens.length; i++) {
            if (token == tokens[i]) {
                return i;
            }
        }
    }

    function withdrawExactShares(
        uint256 _shares,
        uint256 _tokenIndex,
        uint256 _nftId
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        _tokenIndex = _getWithdrawTokenIndex(
            _nftId,
            false
        );

        lendingUserInstance.syncManually(
            tokens[_tokenIndex]
        );

        _shares = bound(
            _shares,
            0,
            lendingUserInstance.getPositionLendingShares(
                _nftId,
                tokens[_tokenIndex]
            )
        );

        address token = tokens[_tokenIndex];

        if (_shares > 0) {
            lendingUserInstance.withdrawExactShares(
                _nftId,
                token,
                _shares
            );

        }else {
            revert();
        }
    }

    function withdrawExactSharesETH(
        uint256 _shares,
        uint256 _nftId
    )
        public
    {
        _nftId = _getNftBoundWithValueEth(
            _nftId,
            false
        );

        lendingUserInstance.syncManually(
            WETH_ADDRESS
        );

        _shares = bound(
            _shares,
            0,
            lendingUserInstance.getPositionLendingShares(
                _nftId,
                WETH_ADDRESS
            )
        );

        if (_shares > 0) {
            lendingUserInstance.withdrawExactSharesETH(
                _nftId,
                _shares
            );

        } else {
            revert();
        }
    }

    function _getPaybackTokenIndex(
        uint256 _nftId
    )
        internal
        view
        returns (uint256 index)
    {
        if (wiseSecurityInstance.overallETHBorrow(_nftId) == 0) {
            return 0;
        }

        uint256 borrowLength = lendingUserInstance.getPositionBorrowTokenLength(_nftId);

        uint256 borrowindex = bound(
            index,
            0,
            borrowLength - 1
        );

        for (uint256 i = 0; i < tokens.length; i++) {
            if (lendingUserInstance.getPositionBorrowTokenByIndex(
                _nftId,
                borrowindex
            ) == tokens[i]) {
                return i;
            }
        }
    }

    function paybackExactAmount(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        _tokenIndex = _getPaybackTokenIndex(
            _nftId
        );

        lendingUserInstance.syncManually(
            tokens[_tokenIndex]
        );

        _amount = bound(
            _amount,
            0,
            lendingUserInstance.paybackAmount(
                tokens[_tokenIndex],
                lendingUserInstance.getPositionBorrowShares(
                    _nftId,
                    tokens[_tokenIndex]
                )
            )
        );

        address token = tokens[_tokenIndex];

        if (_amount > 0) {
            lendingUserInstance.paybackExactAmount(
                _nftId,
                token,
                _amount
            );

        } else {
            revert();
        }
    }

    function paybackExactAmountETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        lendingUserInstance.syncManually(
            WETH_ADDRESS
        );

        _amount = bound(
            _amount,
            0,
            lendingUserInstance.paybackAmount(
                WETH_ADDRESS,
                lendingUserInstance.getPositionBorrowShares(_nftId, WETH_ADDRESS)
            )
        );

        if (_amount > 0) {
            lendingUserInstance.paybackExactAmountETH{value:_amount}(
                _nftId
            );

        } else {
            revert();
        }
    }

    function paybackExactShares(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _shares
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        _tokenIndex = _getPaybackTokenIndex(
            _nftId
        );

        lendingUserInstance.syncManually(
            tokens[_tokenIndex]
        );

        _shares = bound(
            _shares,
            0,
            lendingUserInstance.getPositionBorrowShares(_nftId, tokens[_tokenIndex])
        );

        address token = tokens[_tokenIndex];

        if (_shares > 0) {
            lendingUserInstance.paybackExactShares(
                _nftId,
                token,
                _shares
            );
        } else {
            revert();
        }
    }

    function borrowExactAmount(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        _tokenIndex = _getTokenIndexBound(
            _tokenIndex
        );

        lendingUserInstance.syncManually(
            tokens[_tokenIndex]
        );

        (,uint256 ethvalue) = wiseSecurityInstance.overallETHCollateralsBoth(
            _nftId
        );

        uint256 currentAmountMax = wiseOracleHubInstance.getTokensFromETH(
            tokens[_tokenIndex],
            ethvalue
        );

        _amount = bound(
            _amount,
            0,
            currentAmountMax
        );

        address token = tokens[_tokenIndex];

        if (_amount > 0) {
            lendingUserInstance.borrowExactAmount(
                _nftId,
                token,
                _amount
            );

            return;
        }

        revert();
    }

    function _getNftWithDepositEth(
        bool _solely
    )
        internal
        view
        returns (uint256[] memory)
    {
        uint256 nftLength = nftsUsed.length;
        uint256[] memory gatherNfts = new uint256[](nftLength);

        uint256 k;

        for (uint256 i = 0; i < nftLength; i++) {
            uint256 nftId = nftsUsed[i];
            uint256 getEthAmountDirect = _solely == true
                ?   lendingUserInstance.getPureCollateralAmount(nftId, WETH_ADDRESS)
                :   wiseSecurityInstance.getPositionLendingAmount(
                        nftId,
                        WETH_ADDRESS
                    );

            if (getEthAmountDirect > 0) {
                gatherNfts[k] = nftId;
                k += 1;
            }
        }

        uint256[] memory nfts = new uint256[](k);

        for (uint256 i = 0; i < k; i++) {
            nfts[i] = gatherNfts[i];
        }

        return nfts;
    }

    function _getNftBoundWithValueEth(
        uint256 _nftId,
        bool _solely
    )
        internal
        view
        returns (uint256)
    {
        uint256[] memory nfts = _getNftWithDepositEth(
            _solely
        );

        uint256 length = nfts.length;

        if (length == 0) {
            return 0;
        }

        uint256 index = bound(
            _nftId,
            0,
            length - 1
        );

        return nfts[index];
    }

    function borrowExactAmountETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        lendingUserInstance.syncManually(
            WETH_ADDRESS
        );

        (,uint256 ethvalue) = wiseSecurityInstance.overallETHCollateralsBoth(_nftId);

        uint256 boundamount = ethvalue > lendingUserInstance.getTotalPool(WETH_ADDRESS)
            ? lendingUserInstance.getTotalPool(WETH_ADDRESS)
            : ethvalue;

        _amount = bound(
            _amount,
            0,
            boundamount
        );

        if (_amount > 0) {
            lendingUserInstance.borrowExactAmountETH(
                _nftId,
                _amount
            );

        } else {
            revert();
        }
    }

    function solelyDeposit(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        _nftId = _getNftBound(
            _nftId
        );

        _tokenIndex = _getTokenIndexBound(
            _tokenIndex
        );

        _amount = _getAmountBound(
            _amount,
            _tokenIndex
        );

        address token = tokens[_tokenIndex];

        if (_amount > 0) {

            lendingUserInstance.solelyDeposit(
                _nftId,
                token,
                _amount
            );
        }
    }

    function solelyDepositETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        _nftId = _getNftBound(
            _nftId
        );

        _amount = bound(
            _amount,
            0,
            address(this).balance
        );

        if (_amount > 0) {
            lendingUserInstance.solelyDepositETH{
                value:_amount
            }(
                _nftId
            );
        }
    }

    function solelyWithdraw(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        _tokenIndex = _getWithdrawTokenIndex(
            _nftId,
            true
        );

        lendingUserInstance.syncManually(
            tokens[_tokenIndex]
        );

        _amount = bound(
            _amount,
            0,
            lendingUserInstance.getPureCollateralAmount(
                _nftId,
                tokens[_tokenIndex
            ])
        );

        address token = tokens[_tokenIndex];

        if (_amount > 0) {
            lendingUserInstance.solelyWithdraw(
                _nftId,
                token,
                _amount
            );
        } else {
            revert();
        }
    }

    function solelyWithdrawETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        _nftId = _getNftBoundWithValueEth(
            _nftId,
            true
        );

        lendingUserInstance.syncManually(
            WETH_ADDRESS
        );

        _amount = bound(
            _amount,
            0,
            lendingUserInstance.getPureCollateralAmount(
                _nftId,
                WETH_ADDRESS
            )
        );

        if (_amount > 0) {

            lendingUserInstance.solelyWithdrawETH(
                _nftId,
                _amount
            );

        } else {
            revert();
        }
    }

    function uncollateralizeDeposit(
        uint256 _nftId,
        uint256 _tokenIndex
    )
        public
    {
        _nftId = _getNftBoundWithValue(
            _nftId
        );

        _tokenIndex = _getWithdrawTokenIndex(
            _nftId,
            false
        );

        address token = tokens[
            _tokenIndex
        ];

        if (lendingUserInstance.isUncollateralized(_nftId, token)) {
            revert();
        }

        lendingUserInstance.unCollateralizeDeposit(
            _nftId,
            token
        );
    }

    function _getAmountBound(
        uint256 _amount,
        uint256 _tokenIndex
    )
        internal
        view
        returns (uint256)
    {
        _amount = bound(
            _amount,
            0,
            IERC20(tokens[_tokenIndex]).balanceOf(
                address(this)
            )
        );

        return _amount;
    }

    function _getNftBound(
        uint256 _nftId
    )
        internal
        view
        returns (uint256)
    {
        return _nftId % nftsUsed.length + 1;
    }

    function _getTokenIndexBound(
        uint256 _tokenIndex
    )
        internal
        view
        returns (uint256)
    {
        return _tokenIndex % tokens.length;
    }

    function donate(
        uint256 _amount,
        uint256 _tokenIndex
    )
        public
    {
        _tokenIndex = _getTokenIndexBound(
            _tokenIndex
        );

        address token = tokens[_tokenIndex];

        _amount = bound(
            _amount,
            0,
            IERC20(token).balanceOf(address(this))
        );

        if (_amount > 0) {
            IERC20(token).transfer(
                address(lendingUserInstance),
                _amount
            );
        }
    }

    function _getBound(
        address _poolAddress
    )
        internal
        returns (uint256)
    {
        uint256 cashedBalance = _poolAddress == WETH_ADDRESS
            ? address(this).balance
            : IERC20(_poolAddress).balanceOf(address(this));

        lendingUserInstance.syncManually(
            _poolAddress
        );

        uint256 balanceLeftToDeposit = lendingUserInstance.maxDepositValueToken(
            _poolAddress
        )
            - lendingUserInstance.getTotalBareToken(_poolAddress)
            - lendingUserInstance.getPseudoTotalPool(_poolAddress);

        bool balanceBigger = cashedBalance > balanceLeftToDeposit;

        return balanceBigger
            ? balanceLeftToDeposit
            : cashedBalance;
    }

    event ERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes _data
    );

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
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
}
