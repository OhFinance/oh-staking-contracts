// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

interface IEscrow {
    function redeem() external;
    function redeemAll() external;
    function mint(address _to, uint _amount) external returns (bool);
}