// SPDX-License-Identifier: MIT

pragma solidity =0.8.24;

contract MockAggregator {

    int192 private _maxAnswer;
    int192 private _minAnswer;

    constructor(
        int192 maxAnswerInt,
        int192 minAnswerInt
    ) {
        _maxAnswer = maxAnswerInt;
        _minAnswer = minAnswerInt;
    }

    function maxAnswer()
        external
        view
        returns (int192)
    {
        return _maxAnswer;
    }

    function minAnswer()
        external
        view
        returns (int192)
    {
        return _minAnswer;
    }
}
