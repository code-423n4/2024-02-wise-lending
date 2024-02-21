// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "./OwnableMaster.sol";

error NotPermitted();

contract PositionNFTs is ERC721Enumerable, OwnableMaster {

    string public baseURI;
    string public baseExtension;

    address public feeManager;
    uint256 public totalReserved;
    uint256 public immutable FEE_MANAGER_NFT;

    mapping(address => uint256) public reserved;
    mapping(address => bool) public reserveRole;

    bool public reservePublicBlocked;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI
    )
        ERC721(
            _name,
            _symbol
        )
        OwnableMaster(
            msg.sender
        )
    {
        baseURI = _baseURI;

        FEE_MANAGER_NFT = _mintPositionForUser(
            address(this)
        );
    }

    modifier onlyReserveRole() {
        if (reservePublicBlocked == true) {
            if (reserveRole[msg.sender] == false) {
                revert NotPermitted();
            }
        }
        _;
    }

    function assignReserveRole(
        address _reserverForOthers,
        bool _state
    )
        external
        onlyMaster
    {
        reserveRole[_reserverForOthers] = _state;
    }

    function blockReservePublic()
        external
        onlyMaster
    {
        reservePublicBlocked = true;
    }

    function forwardFeeManagerNFT(
        address _feeManagerContract
    )
        external
        onlyMaster
    {
        if (feeManager > ZERO_ADDRESS) {
            revert NotPermitted();
        }

        feeManager = _feeManagerContract;

        _transfer(
            address(this),
            _feeManagerContract,
            FEE_MANAGER_NFT
        );
    }

    function reservePosition()
        external
        returns (uint256)
    {
        return _reservePositionForUser(
            msg.sender
        );
    }

    function reservePositionForUser(
        address _user
    )
        onlyReserveRole
        external
        returns (uint256)
    {
        return _reservePositionForUser(
            _user
        );
    }

    function _reservePositionForUser(
        address _user
    )
        internal
        returns (uint256)
    {
        if (reserved[_user] > 0) {
            return reserved[_user];
        }

        uint256 reservedId = getNextExpectedId();
        reserved[_user] = reservedId;

        totalReserved =
        totalReserved + 1;

        return reservedId;
    }

    function getNextExpectedId()
        public
        view
        returns (uint256)
    {
        return totalReserved + totalSupply();
    }

    /**
     * @dev Mints NFT for sender, without it
     * user can not use WiseLending protocol
     */
    function mintPosition()
        external
        returns (uint256)
    {
        return _mintPositionForUser(
            msg.sender
        );
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApprovedSoft(
        uint256 tokenId
    )
        external
        view
        returns (address)
    {
        if (_exists(tokenId) == false) {
            return ZERO_ADDRESS;
        }

        return getApproved(
            tokenId
        );
    }

    /**
     * @dev Mints NFT for _user, without it
     * user can not use WiseLending protocol
     */
    function mintPositionForUser(
        address _user
    )
        external
        returns (uint256)
    {
        if (isApprovedForAll(
                _user,
                msg.sender
            ) == false
        ) {
            revert NotPermitted();
        }

        return _mintPositionForUser(
            _user
        );
    }

    function _mintPositionForUser(
        address _user
    )
        internal
        returns (uint256)
    {
        uint256 nftId = reserved[
            _user
        ];

        if (nftId > 0) {
            delete reserved[
                _user
            ];

            totalReserved--;

        } else {
            nftId = getNextExpectedId();
        }

        _mint(
            _user,
            nftId
        );

        return nftId;
    }

    function isOwner(
        uint256 _nftId,
        address _owner
    )
        external
        view
        returns (bool)
    {
        if (_nftId == FEE_MANAGER_NFT) {
            return feeManager == _owner;
        }

        if (reserved[_owner] == _nftId) {
            return true;
        }

        if (ownerOf(_nftId) == _owner) {
            return true;
        }

        return false;
    }

    function approveMint(
        address _spender,
        uint256 _nftId
    )
        external
    {
        if (reserved[msg.sender] == _nftId) {
            approve(
                _spender,
                _mintPositionForUser(
                    msg.sender
                )
            );

            return;
        }

        approve(
            _spender,
            _nftId
        );
    }

    /**
     * @dev Returns positions of owner
     */
    function walletOfOwner(
        address _owner
    )
        external
        view
        returns (uint256[] memory)
    {
        uint256 reservedId = reserved[
            _owner
        ];

        uint256 ownerTokenCount = balanceOf(
            _owner
        );

        uint256 reservedCount;

        if (reservedId > 0) {
            reservedCount = 1;
        }

        uint256[] memory tokenIds = new uint256[](
            ownerTokenCount + reservedCount
        );

        uint256 i;

        while (i < ownerTokenCount) {
            tokenIds[i] = tokenOfOwnerByIndex(
                _owner,
                i
            );

            unchecked {
                ++i;
            }
        }

        if (reservedId > 0) {
            tokenIds[i] = reservedId;
        }

        return tokenIds;
    }

    /**
     * @dev Allows to update base target for MetaData.
     */
    function setBaseURI(
        string memory _newBaseURI
    )
        external
        onlyMaster
    {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(
        string memory _newBaseExtension
    )
        external
        onlyMaster
    {
        baseExtension = _newBaseExtension;
    }

    /**
     * @dev Returns path to MetaData URI
     */
    function tokenURI(
        uint256 _tokenId
    )
        public
        view
        override
        returns (string memory)
    {
        require(
            _exists(_tokenId) == true,
            "PositionNFTs: WRONG_TOKEN"
        );

        string memory currentBaseURI = baseURI;

        if (bytes(currentBaseURI).length == 0) {
            return "";
        }

        return string(
            abi.encodePacked(
                currentBaseURI,
                _toString(_tokenId),
                baseExtension
            )
        );
    }

    /**
     * @dev Converts tokenId uint to string.
     */
    function _toString(
        uint256 _tokenId
    )
        internal
        pure
        returns (string memory str)
    {
        if (_tokenId == 0) {
            return "0";
        }

        uint256 j = _tokenId;
        uint256 length;

        while (j != 0) {
            length++;
            j /= 10;
        }

        bytes memory bstr = new bytes(
            length
        );

        uint256 k = length;
        j = _tokenId;

        while (j != 0) {
            bstr[--k] = bytes1(
                uint8(
                    48 + (j % 10)
                )
            );
            j /= 10;
        }

        str = string(
            bstr
        );
    }
}
