// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

contract CustomOracleSetup {

    address public master;
    uint256 public lastUpdateGlobal;

    uint80 public globalRoundId;

    mapping(uint80 => uint256) public timeStampByRoundId;

    modifier onlyOwner() {
        require(
            msg.sender == master,
            "CustomOracleSetup: NOT_MASTER"
        );
        _;
    }

    constructor() {
        master = msg.sender;
    }

    function renounceOwnership()
        external
        onlyOwner
    {
        master = address(0x0);
    }

    function setLastUpdateGlobal(
        uint256 _time
    )
        external
        onlyOwner
    {
        lastUpdateGlobal = _time;
    }

    function setRoundData(
        uint80 _roundId,
        uint256 _updateTime
    )
        external
        onlyOwner
    {
        timeStampByRoundId[_roundId] = _updateTime;
    }

    function setGlobalAggregatorRoundId(
        uint80 _aggregatorRoundId
    )
        external
        onlyOwner
    {
        globalRoundId = _aggregatorRoundId;
    }

    function getTimeStamp()
        external
        view
        returns (uint256)
    {
        return block.timestamp;
    }
}
