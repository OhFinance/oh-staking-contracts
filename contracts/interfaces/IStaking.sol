// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

interface IStaking {
    function stake(uint amount, uint duration) external;
    function unstake(uint amount) external;
    function claim() external;
    function exit() external;
}