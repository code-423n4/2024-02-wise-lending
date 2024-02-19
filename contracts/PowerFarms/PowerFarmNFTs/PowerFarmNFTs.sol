// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author Christoph Krpoun
 * @author René Hochmuth
 * @author Vitally Marinchenko
 */

import "../../OwnableMaster.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

interface IFarmContract {

    function reservedKeys(
        address _owner
    )
        external
        view
        returns (uint256);
}

contract PowerFarmNFTs is ERC721Enumerable, OwnableMaster {

    string public baseURI;
    string public baseExtension;
    address public farmContract;

    modifier onlyFarmContract() {
        require(
            msg.sender == farmContract,
            "PowerFarmsNFTs: INVALID_FARM"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol
    )
        ERC721(
            _name,
            _symbol
        )
        OwnableMaster(
            msg.sender
        )
    {}

    function setFarmContract(
        address _farmContract
    )
        external
        onlyMaster
    {
        if (farmContract == ZERO_ADDRESS) {
            farmContract = _farmContract;
        }
    }

    /**
     * @dev Mints farming NFT, later to be sent
     * to the user representing his farming position
     */
    function mintKey(
        address _keyOwner,
        uint256 _keyId
    )
        external
        onlyFarmContract
    {
        _mint(
            _keyOwner,
            _keyId
        );
    }

    /**
     * @dev Burns farming NFT
     */
    function burnKey(
        uint256 _keyId
    )
        external
        onlyFarmContract
    {
        _burn(
            _keyId
        );
    }

    function checkOwner(
        uint256 _keyId,
        address _ownerAddress
    )
        external
        view
        returns (bool)
    {
        return ownerOf(
            _keyId
        ) == _ownerAddress;
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
        IFarmContract farm = IFarmContract(
            farmContract
        );

        uint256 reservedId = farm.reservedKeys(
            _owner
        );

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

        for (i; i < ownerTokenCount;) {
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
        string calldata _newBaseURI
    )
        external
        onlyMaster
    {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(
        string calldata _newBaseExtension
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
            "PowerFarmsNFTs: WRONG_TOKEN"
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
                    48 + j % 10
                )
            );
            j /= 10;
        }

        str = string(
            bstr
        );
    }
}
