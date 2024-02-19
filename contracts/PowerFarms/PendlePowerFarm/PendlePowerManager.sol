// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author René Hochmuth
 * @author Christoph Krpoun
 * @author Vitally Marinchenko
 */

import "./PendlePowerFarm.sol";
import "../../OwnableMaster.sol";
import "../PowerFarmNFTs/MinterReserver.sol";

contract PendlePowerManager is OwnableMaster, PendlePowerFarm, MinterReserver {

    /**
     * @dev Standard receive functions forwarding
     * directly send ETH to the master address.
     */
    receive()
        external
        payable
    {
        emit ETHReceived(
            msg.value,
            msg.sender
        );
    }

    constructor(
        address _wiseLendingAddress,
        address _pendleChilTokenAddress,
        address _pendleRouter,
        address _entryAsset,
        address _pendleSy,
        address _underlyingMarket,
        address _routerStatic,
        address _dexAddress,
        uint256 _collateralFactor,
        address _powerFarmNFTs
    )
        OwnableMaster(
            msg.sender
        )
        MinterReserver(
            _powerFarmNFTs
        )
        PendlePowerFarmDeclarations(
            _wiseLendingAddress,
            _pendleChilTokenAddress,
            _pendleRouter,
            _entryAsset,
            _pendleSy,
            _underlyingMarket,
            _routerStatic,
            _dexAddress,
            _collateralFactor
        )
    {
    }

    function changeMinDeposit(
        uint256 _newMinDeposit
    )
        external
        onlyMaster
    {
        minDepositEthAmount = _newMinDeposit;

        emit MinDepositChange(
            _newMinDeposit,
            block.timestamp
        );
    }

    /**
     * @dev External function deactivating the power farm by
     * disableing the openPosition function. Allowing user
     * to manualy payback and withdraw.
     */
    function shutDownFarm(
        bool _state
    )
        external
        onlyMaster
    {
        isShutdown = _state;

        emit FarmStatus(
            _state,
            block.timestamp
        );
    }

    function enterFarm(
        bool _isAave,
        uint256 _amount,
        uint256 _leverage,
        uint256 _allowedSpread
    )
        external
        isActive
        updatePools
        returns (uint256)
    {
        uint256 wiseLendingNFT = _getWiseLendingNFT();

        _safeTransferFrom(
            WETH_ADDRESS,
            msg.sender,
            address(this),
            _amount
        );

        _openPosition(
            _isAave,
            wiseLendingNFT,
            _amount,
            _leverage,
            _allowedSpread
        );

        uint256 keyId = _reserveKey(
            msg.sender,
            wiseLendingNFT
        );

        isAave[keyId] = _isAave;

        emit FarmEntry(
            keyId,
            wiseLendingNFT,
            _leverage,
            _amount,
            block.timestamp
        );

        return keyId;
    }

    function enterFarmETH(
        bool _isAave,
        uint256 _leverage,
        uint256 _allowedSpread
    )
        external
        payable
        isActive
        updatePools
        returns (uint256)
    {
        uint256 wiseLendingNFT = _getWiseLendingNFT();

        _wrapETH(
            msg.value
        );

        _openPosition(
            _isAave,
            wiseLendingNFT,
            msg.value,
            _leverage,
            _allowedSpread
        );

        uint256 keyId = _reserveKey(
            msg.sender,
            wiseLendingNFT
        );

        isAave[keyId] = _isAave;

        emit FarmEntry(
            keyId,
            wiseLendingNFT,
            _leverage,
            msg.value,
            block.timestamp
        );

        return keyId;
    }

    function _getWiseLendingNFT()
        internal
        returns (uint256)
    {
        if (availableNFTCount == 0) {

            uint256 nftId = POSITION_NFT.mintPosition();

            _registrationFarm(
                nftId
            );

            POSITION_NFT.approve(
                AAVE_HUB_ADDRESS,
                nftId
            );

            return nftId;
        }

        return availableNFTs[
            availableNFTCount--
        ];
    }

    function exitFarm(
        uint256 _keyId,
        uint256 _allowedSpread,
        bool _ethBack
    )
        external
        updatePools
        onlyKeyOwner(_keyId)
    {
        uint256 wiseLendingNFT = farmingKeys[
            _keyId
        ];

        delete farmingKeys[
            _keyId
        ];

        if (reservedKeys[msg.sender] == _keyId) {
            reservedKeys[msg.sender] = 0;
        } else {
            FARMS_NFTS.burnKey(
                _keyId
            );
        }

        availableNFTs[
            ++availableNFTCount
        ] = wiseLendingNFT;

        _closingPosition(
            isAave[_keyId],
            wiseLendingNFT,
            _allowedSpread,
            _ethBack
        );

        emit FarmExit(
            _keyId,
            wiseLendingNFT,
            _allowedSpread,
            block.timestamp
        );
    }

    function manuallyPaybackShares(
        uint256 _keyId,
        uint256 _paybackShares
    )
        external
        updatePools
    {
        _manuallyPaybackShares(
            farmingKeys[_keyId],
            _paybackShares
        );

        emit ManualPaybackShares(
            _keyId,
            farmingKeys[_keyId],
            _paybackShares,
            block.timestamp
        );
    }

    function manuallyWithdrawShares(
        uint256 _keyId,
        uint256 _withdrawShares
    )
        external
        updatePools
        onlyKeyOwner(_keyId)
    {
        uint256 wiseLendingNFT = farmingKeys[
            _keyId
        ];

        _manuallyWithdrawShares(
            wiseLendingNFT,
            _withdrawShares
        );

        if (_checkDebtRatio(wiseLendingNFT) == false) {
            revert DebtRatioTooHigh();
        }

        emit ManualWithdrawShares(
            _keyId,
            wiseLendingNFT,
            _withdrawShares,
            block.timestamp
        );
    }
}
