// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

interface IPositionNFTs {

    function ownerOf(
        uint256 _nftId
    )
        external
        view
        returns (address);

    function totalSupply()
        external
        view
        returns (uint256);

    function reserved(
        address _owner
    )
        external
        view
        returns (uint256);

    function reservePosition()
        external;

    function mintPosition()
        external
        returns (uint256);

    function tokenOfOwnerByIndex(
        address _owner,
        uint256 _index
    )
        external
        view
        returns (uint256);

    function walletOfOwner(
        address _owner
    )
        external
        view
        returns (uint256[] memory);

    function mintPositionForUser(
        address _user
    )
        external
        returns (uint256);

    function reservePositionForUser(
        address _user
    )
        external
        returns (uint256);

    function getNextExpectedId()
        external
        view
        returns (uint256);

    function getApproved(
        uint256 _nftId
    )
        external
        view
        returns (address);

    function approve(
        address _to,
        uint256 _nftId
    )
        external;

    function isOwner(
        uint256 _nftId,
        address _caller
    )
        external
        view
        returns (bool);

    function FEE_MANAGER_NFT()
        external
        view
        returns (uint256);
}
