// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IPowerFarmsNFTs {

    function ownerOf(
        uint256 _tokenId
    )
        external
        view
        returns (address);

    function mintKey(
        address _keyOwner,
        uint256 _keyId
    )
        external;

    /**
     * @dev Burns farming NFT
     */
    function burnKey(
        uint256 _keyId
    )
        external;
}
