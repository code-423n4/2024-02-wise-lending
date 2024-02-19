// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../../InterfaceHub/IPowerFarmsNFTs.sol";

error InvalidKey();
error AlreadyReserved();

contract MinterReserver {

    IPowerFarmsNFTs immutable FARMS_NFTS;

    // Tracks increment of keys
    uint256 public totalMinted;

    // Tracks reserved counter
    uint256 public totalReserved;

    // Tracks amount of reusable NFTs
    uint256 public availableNFTCount;

    // Maps access to wiseLendingNFT through farmNFT
    mapping(uint256 => uint256) public farmingKeys;

    // Tracks reserved NFTs mapped to address
    mapping(address => uint256) public reservedKeys;

    // Tracks reusable wiseLendingNFTs after burn
    mapping(uint256 => uint256) public availableNFTs;

    modifier onlyKeyOwner(
        uint256 _keyId
    ) {
        _onlyKeyOwner(
            _keyId
        );
        _;
    }

    function _onlyKeyOwner(
        uint256 _keyId
    )
        private
        view
    {
        require(
            isOwner(
                _keyId,
                msg.sender
            ) == true
        );
    }

    constructor(
        address _powerFarmNFTs
    ) {
        FARMS_NFTS = IPowerFarmsNFTs(
            _powerFarmNFTs
        );
    }

    function _incrementReserved()
        internal
        returns (uint256)
    {
        return ++totalReserved;
    }

    function _getNextReserveKey()
        internal
        returns (uint256)
    {
        return totalMinted + _incrementReserved();
    }

    function _reserveKey(
        address _userAddress,
        uint256 _wiseLendingNFT
    )
        internal
        returns (uint256)
    {
        if (reservedKeys[_userAddress] > 0) {
            revert AlreadyReserved();
        }

        uint256 keyId = _getNextReserveKey();

        reservedKeys[_userAddress] = keyId;
        farmingKeys[keyId] = _wiseLendingNFT;

        return keyId;
    }

    function isOwner(
        uint256 _keyId,
        address _owner
    )
        public
        view
        returns (bool)
    {
        if (reservedKeys[_owner] == _keyId) {
            return true;
        }

        if (FARMS_NFTS.ownerOf(_keyId) == _owner) {
            return true;
        }

        return false;
    }

    function _mintKeyForUser(
        uint256 _keyId,
        address _userAddress
    )
        internal
        returns (uint256)
    {
        if (_keyId == 0) {
            revert InvalidKey();
        }

        delete reservedKeys[
            _userAddress
        ];

        FARMS_NFTS.mintKey(
            _userAddress,
            _keyId
        );

        totalMinted++;
        totalReserved--;

        return _keyId;
    }

    function mintReserved()
        external
        returns (uint256)
    {
        return _mintKeyForUser(
            reservedKeys[
                msg.sender
            ],
            msg.sender
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
