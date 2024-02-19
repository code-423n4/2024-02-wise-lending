// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./AaveEvents.sol";

import "../InterfaceHub/IAave.sol";
import "../InterfaceHub/IWiseLending.sol";
import "../InterfaceHub/IWiseSecurity.sol";
import "../InterfaceHub/IPositionNFTs.sol";

import "../OwnableMaster.sol";
import "../TransferHub/WrapperHelper.sol";

error AlreadySet();
error InvalidValue();
error InvalidAction();
error FailedInnerCall();
error InvalidToken();

contract Declarations is OwnableMaster, AaveEvents, WrapperHelper {

    IAave internal immutable AAVE;

    bool public sendingProgressAaveHub;

    uint16 internal constant REF_CODE = 0;

    IWiseLending immutable public WISE_LENDING;
    IPositionNFTs immutable public POSITION_NFT;

    IWiseSecurity public WISE_SECURITY;

    address immutable public WETH_ADDRESS;
    address immutable public AAVE_ADDRESS;

    uint256 internal constant PRECISION_FACTOR_E9 = 1E9;
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;
    uint256 internal constant MAX_AMOUNT = type(uint256).max;

    mapping(address => address) public aaveTokenAddress;

    constructor(
        address _master,
        address _aaveAddress,
        address _lendingAddress
    )
        OwnableMaster(
            _master
        )
        WrapperHelper(
            IWiseLending(
                _lendingAddress
            ).WETH_ADDRESS()
        )
    {
        if (_aaveAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        if (_lendingAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        AAVE_ADDRESS = _aaveAddress;
        WISE_LENDING = IWiseLending(
            _lendingAddress
        );

        WETH_ADDRESS = WISE_LENDING.WETH_ADDRESS();

        AAVE = IAave(
            AAVE_ADDRESS
        );

        POSITION_NFT = IPositionNFTs(
            WISE_LENDING.POSITION_NFT()
        );
    }

    function _checkOwner(
        uint256 _nftId
    )
        internal
        view
    {
        WISE_SECURITY.checkOwnerPosition(
            _nftId,
            msg.sender
        );
    }

    function _checkPositionLocked(
        uint256 _nftId
    )
        internal
        view
    {
        WISE_LENDING.checkPositionLocked(
            _nftId,
            msg.sender
        );
    }

    function setWiseSecurity(
        address _securityAddress
    )
        external
        onlyMaster
    {
        if (address(WISE_SECURITY) > ZERO_ADDRESS) {
            revert AlreadySet();
        }

        WISE_SECURITY = IWiseSecurity(
            _securityAddress
        );
    }
}
