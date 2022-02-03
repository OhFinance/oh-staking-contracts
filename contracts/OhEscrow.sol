// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";


contract OhEscrow is ERC20, Ownable, ReentrancyGuard {
    IERC20 public token;

    address public treasury;

    uint256 public escrowDuration;
    uint256 public redeemedRewards;

    mapping(address => bool) public minters;
    mapping(address => uint64) public counter;
    mapping(address => Lock[]) public locks;

    struct Lock {
        uint256 amount;
        uint64 end;
    }

    event Redeemed(address indexed user, uint256 amount);
    event MinterUpdated(address indexed minter, bool approved);

    constructor(
        string memory name,
        string memory symbol,
        address _token,
        address _treasury,
        uint256 _escrowDuration
    ) ERC20(name, symbol) {
        token = IERC20(_token);
        treasury = _treasury;
        escrowDuration = _escrowDuration;
    }

    function printLocks(address addr) internal {
        console.log("*Printing all Locks for %s*", addr);
        uint256 length = locks[msg.sender].length;
        for (uint256 i = 0; i < length; i++) {
            console.log("\t- lock[%s][%s].amount: %s", addr, i, locks[addr][i].amount);
            console.log("\t- lock[%s][%s].end: %s", addr, i, locks[addr][i].end);
        }
    }

    // external functions

    // redeem single escrow lock rewards, included for edge cases w/ too many locks for EVM to handle
    function redeem() external nonReentrant {
        console.log("*Inside Redeem function*");
        uint256 length = locks[msg.sender].length;
        console.log("/t- locks length: %s", length);
        uint256 lockCounter = counter[msg.sender];
        console.log("/t- lock counter: %s", lockCounter);

        printLocks(msg.sender);

        require(length > lockCounter, "All tokens redeemed");
        require(locks[msg.sender][lockCounter].end < block.timestamp, "Tokens still locked");

        uint256 redeemAmount = locks[msg.sender][lockCounter].amount;
        console.log("/t- redeem amount: %s", redeemAmount);

        // ensure any transfers are accounted for
        uint256 balance = balanceOf(msg.sender);
        console.log("/t- balance: %s", balance);
        if (redeemAmount > balance) {
            redeemAmount = balance;
        }

        // update counter and rewards
        counter[msg.sender] = uint64(lockCounter + 1);
        redeemedRewards += redeemAmount;

        // burn escrow and transfer rewards
        _burn(msg.sender, redeemAmount);
        require(token.transferFrom(treasury, msg.sender, redeemAmount), "Token transfer failed");
        emit Redeemed(msg.sender, redeemAmount);
    }

    // redeem all available escrow rewards
    function redeemAll() external nonReentrant {
        console.log("*Inside RedeemAll function*");
        uint256 length = locks[msg.sender].length;
        console.log("/t- locks length: %s", length);
        uint256 lockCounter = counter[msg.sender];
        console.log("/t- lock counter: %s", lockCounter);

        printLocks(msg.sender);

        require(length > lockCounter, "All tokens redeemed");

        // find amount to redeem
        uint256 redeemAmount;
        uint256 redeemCount;
        for (uint256 i = lockCounter; i < length; i++) {
            if (locks[msg.sender][i].end < block.timestamp) {
                redeemAmount += locks[msg.sender][i].amount;
                console.log("/t- redeem amount: %s", redeemAmount);
                redeemCount += 1;
            } else {
                break;
            }
        }

        // revert if no rewards
        require(redeemAmount > 0, "No tokens to redeem");

        // ensure any transfers are accounted for
        uint256 balance = balanceOf(msg.sender);
        console.log("/t- balance: %s", balance);
        if (redeemAmount > balance) {
            redeemAmount = balance;
        }

        // update counter and rewards
        counter[msg.sender] = uint64(lockCounter + redeemCount);
        redeemedRewards += redeemAmount;

        // burn escrow and transfer rewards
        _burn(msg.sender, redeemAmount);
        require(token.transferFrom(treasury, msg.sender, redeemAmount), "Token transfer failed");
        emit Redeemed(msg.sender, redeemAmount);
    }

    function mint(address _to, uint256 _amount) external returns (bool) {
        require(minters[msg.sender], "Minting permissions denied");

        // create a new lock
        console.log("*Adding new lock for %s, with amount %s", _to, _amount);
        locks[_to].push(Lock({amount: _amount, end: uint64(block.timestamp + escrowDuration)}));

        _mint(_to, _amount);
        return true;
    }

    // public views

    function vested(address _user) public view returns (uint256 rewards) {
        uint256 length = locks[_user].length;
        uint256 lockCounter = counter[_user];

        for (uint256 i = lockCounter; i < length; i++) {
            if (locks[_user][i].end < block.timestamp) {
                rewards += locks[_user][i].amount;
            } else {
                break;
            }
        }
    }

    // overrides

    function _transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal override {
        // push lock with new vesting period to recipient
        locks[_to].push(Lock({amount: _amount, end: uint64(block.timestamp + escrowDuration)}));

        super._transfer(_from, _to, _amount);
    }

    // owner functions

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setMinter(address _minter) external onlyOwner {
        bool approved = minters[_minter];
        minters[_minter] = !approved;
        emit MinterUpdated(_minter, !approved);
    }
}
