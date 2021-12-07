// SPDX-License-Identifier: MIT

//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IEscrow.sol";

pragma solidity 0.8.7;

contract OhStaking is ERC20, Ownable, ReentrancyGuard {
    IERC20 public token;
    IEscrow public escrow;

    uint public rewardRate = 0;
    uint public rewardsDuration = 0;
    uint public claimedRewards;
    uint public startRewardsTime;
    uint public lastUpdateTime;
    uint public lastRewardTimestamp;
    uint public rewardPerTokenStored;
    uint public maxBonus;
    uint public maxLockDuration;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;
    mapping(address => Deposit) public deposits;

    struct Deposit {
        uint256 amount;
        uint64 start;
        uint64 end;
    }

    event Staked(address indexed user, uint amountStaked);
    event Unstaked(address indexed user, uint amountUnstaked);
    event RewardsClaimed(address indexed user, uint rewardsClaimed);
    event RewardAmountSet(uint rewardRate, uint duration);

    constructor(
        string memory name, 
        string memory symbol, 
        address  _token,
        address _escrow,
        uint _maxBonus,
        uint _maxLockDuration,
        uint _startRewards
    ) ERC20(name, symbol) {
        token = IERC20(_token);
        escrow = IEscrow(_escrow);
        maxBonus = _maxBonus;
        maxLockDuration = _maxLockDuration;
        startRewardsTime = _startRewards;
    }

    modifier updateReward(address account) {
        uint updatedRewardPerToken = rewardPerToken();
        rewardPerTokenStored = updatedRewardPerToken;
        lastUpdateTime = rewardTimestamp();
        if (account != address(0)){
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = updatedRewardPerToken;
        }
        _;
    }

    // external functions

    function stake(uint _amount, uint _duration) external nonReentrant {
        _stake(msg.sender, _amount, _duration);
    }

    function unstake(uint _amount) external nonReentrant {
        _unstake(msg.sender, _amount);
    }

    function claim() external nonReentrant updateReward(msg.sender) {
        _claim(msg.sender);
    }

    function exit() external nonReentrant {
        _unstake(msg.sender, balanceOf(msg.sender));
        _claim(msg.sender);
    }

    // public views

    function getMultiplier(uint duration) public view returns (uint) {
        if (duration == 0) {
            return 1e18;
        }
        return 1e18 + ((maxBonus * duration) / maxLockDuration);
    }

    function totalClaimed() public view returns (uint) {
        return claimedRewards;
    }

    function rewardPerToken() public view returns (uint) {
        if (totalSupply() == 0 || block.timestamp < startRewardsTime) {
            return 0;
        }
        return rewardPerTokenStored + (
            (rewardRate * (rewardTimestamp() - startTimestamp()) * 1e18 / totalSupply())
        );
    }

    function earned(address account) public view returns (uint) {
        return (
            balanceOf(account) * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18
        ) + rewards[account];
    }

    // internal views

    // function to check if staking rewards have ended
    function rewardTimestamp() internal view returns (uint) {
        if (block.timestamp < lastRewardTimestamp) {
            return block.timestamp;
        }
        else {
            return lastRewardTimestamp;
        }
    }

    // function to check if staking rewards have started
    function startTimestamp() internal view returns (uint) {
        if (startRewardsTime > lastUpdateTime) {
            return startRewardsTime;
        }
        else {
            return lastUpdateTime;
        }
    }

    // internal functions

    function _stake(address _user, uint _amount, uint _duration) internal updateReward(_user) {
        require(_amount > 0, "Must stake > 0 tokens");
        require(_duration <= maxLockDuration, "Lock exceeds max duration");
        
        uint balance = deposits[_user].amount;
        uint start = deposits[_user].start;
        uint end = deposits[_user].end;
        
        // require new locks to exceed past lock duration
        require(_duration >= end - start, "Must exceed current lock");

        // calculate mint amount, account for previous deposits
        uint mintAmount = (((balance + _amount) * getMultiplier(_duration)) / 1e18) - balance;

        // update user deposit
        deposits[_user].amount = balance + _amount;
        deposits[_user].start = uint64(block.timestamp);
        deposits[_user].end = uint64(block.timestamp + _duration);

        // transfer and mint
        require(token.transferFrom(_user, address(this), _amount), "Token transfer failed");
        _mint(_user, mintAmount);
        emit Staked(_user, _amount);
    }

    function _unstake(address _user, uint _amount) internal updateReward(_user) {
        require(_amount > 0, "Must withdraw > 0 tokens");

        uint balance = deposits[_user].amount;
        uint start = deposits[_user].start;
        uint end = deposits[_user].end;

        // require lock has ended
        require(end < block.timestamp, "Tokens still locked");

        // calculate burn amount
        uint burnAmount = (_amount * getMultiplier(end - start)) / 1e18;

        // update user deposit
        deposits[_user].amount = balance - _amount;
        if (balance - _amount == 0) {
            deposits[_user].start = 0;
            deposits[_user].end = 0;
        }

        // burn and transfer 
        _burn(_user, burnAmount);
        require(token.transfer(_user, _amount), "Token transfer failed");
        emit Unstaked(_user, _amount);
    }

    function _claim(address _user) internal {
        uint reward = rewards[_user];
        if (reward > 0) {
            rewards[_user] = 0;
            claimedRewards += reward;
            require(escrow.mint(_user, reward), "Token transfer failed");
            emit RewardsClaimed(_user, reward);
        }
    }

    // overrides

    function _transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal override {
        uint end = deposits[_from].end;
        if (end > 0) {
            uint balance = deposits[_from].amount;
            uint start = deposits[_from].start;

            // calculate equivalent deposited amount
            uint depositAmount = balance / (getMultiplier(end - start) / 1e18);

            // update from deposits
            deposits[_from].amount = balance - depositAmount;
            if (balance - depositAmount == 0) {
                deposits[_from].start = 0;
                deposits[_from].end = 0;
            }

            // update to deposits
            deposits[_to].amount = depositAmount;
            deposits[_to].start = uint64(start);
            deposits[_to].end = uint64(end);
        }
        
        super._transfer(_from, _to, _amount);
    }

    //owner only functions

    function setRewardAmount(uint reward, uint _rewardsDuration) onlyOwner external updateReward(address(0)) {
        rewardsDuration = _rewardsDuration;
        rewardRate = reward / rewardsDuration;
        uint balance = token.balanceOf(address(this)) - totalSupply();

        require(rewardRate <= balance / rewardsDuration, "Contract does not have enough tokens for current reward rate");

        lastUpdateTime = block.timestamp;
        if (block.timestamp < startRewardsTime) {
            lastRewardTimestamp = startRewardsTime + rewardsDuration;
        }
        else {
            lastRewardTimestamp = block.timestamp + rewardsDuration;
        }
        emit RewardAmountSet(rewardRate, _rewardsDuration);
    }
}