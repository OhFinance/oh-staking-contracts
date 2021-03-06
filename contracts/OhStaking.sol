// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IEscrow.sol";

contract OhStaking is ERC20, Ownable, ReentrancyGuard {
    IERC20 public token;
    IEscrow public escrow;

    bool public isKilled = false;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration = 0;
    uint256 public claimedRewards;
    uint256 public startRewardsTime;
    uint256 public lastUpdateTime;
    uint256 public lastRewardTimestamp;
    uint256 public rewardPerTokenStored;
    uint256 public maxBonus;
    uint256 public maxLockDuration;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => Deposit) public deposits;

    struct Deposit {
        uint256 amount;
        uint64 start;
        uint64 end;
    }

    event Staked(address indexed user, uint256 amountStaked);
    event Unstaked(address indexed user, uint256 amountUnstaked);
    event RewardsClaimed(address indexed user, uint256 rewardsClaimed);
    event RewardAmountSet(uint256 rewardRate, uint256 duration);

    constructor(
        string memory name,
        string memory symbol,
        address _token,
        address _escrow,
        uint256 _maxBonus,
        uint256 _maxLockDuration,
        uint256 _startRewards
    ) ERC20(name, symbol) {
        token = IERC20(_token);
        escrow = IEscrow(_escrow);
        maxBonus = _maxBonus;
        maxLockDuration = _maxLockDuration;
        startRewardsTime = block.timestamp + _startRewards;
    }

    modifier updateReward(address account) {
        uint256 updatedRewardPerToken = rewardPerToken();
        rewardPerTokenStored = updatedRewardPerToken;
        lastUpdateTime = rewardTimestamp();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = updatedRewardPerToken;
        }
        _;
    }

    // external functions

    function stake(uint256 _amount, uint256 _duration) external nonReentrant {
        _stake(msg.sender, _amount, _duration);
    }

    function unstake(uint256 _amount) external nonReentrant {
        _unstake(msg.sender, _amount);
    }

    function claim() external nonReentrant updateReward(msg.sender) {
        _claim(msg.sender);
    }

    function exit() external nonReentrant {
        _unstake(msg.sender, deposits[msg.sender].amount);
        _claim(msg.sender);
    }

    // Exit without updating reward values, forfeits all rewards
    function emergencyExit() external nonReentrant {
        uint256 amount = deposits[msg.sender].amount;
        uint256 start = deposits[msg.sender].start;
        uint256 end = deposits[msg.sender].end;

        require(amount > 0, "No tokens to withdraw");

        // require lock has ended if contract has not been killed
        if (!isKilled) {
            require(end < block.timestamp, "Tokens still locked");
        }

        // calculate burn amount
        uint256 burnAmount = (amount * getMultiplier(end - start)) / 1e18;

        // update user deposit and rewards to 0
        deposits[msg.sender].amount = 0;
        deposits[msg.sender].start = 0;
        deposits[msg.sender].end = 0;
        rewards[msg.sender] = 0;
        userRewardPerTokenPaid[msg.sender] = 0;

        _burn(msg.sender, burnAmount);
        require(token.transfer(msg.sender, amount), "Token transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    //owner only functions

    function setRewardAmount(uint256 reward, uint256 _rewardsDuration) external onlyOwner updateReward(address(0)) {
        rewardsDuration = _rewardsDuration;
        rewardRate = reward / rewardsDuration;

        lastUpdateTime = block.timestamp;
        if (block.timestamp < startRewardsTime) {
            lastRewardTimestamp = startRewardsTime + rewardsDuration;
        } else {
            lastRewardTimestamp = block.timestamp + rewardsDuration;
        }
        emit RewardAmountSet(rewardRate, _rewardsDuration);
    }

    function kill() external onlyOwner {
        require(!isKilled, "Pool already killed");
        isKilled = true;
    }

    // public views

    function getMultiplier(uint256 duration) public view returns (uint256) {
        if (duration == 0) {
            return 1e18;
        }
        return 1e18 + ((maxBonus * duration) / maxLockDuration);
    }

    function totalClaimed() public view returns (uint256) {
        return claimedRewards;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0 || block.timestamp < startRewardsTime) {
            return 0;
        }
        return rewardPerTokenStored + (((rewardRate * (rewardTimestamp() - startTimestamp()) * 1e18) / totalSupply()));
    }

    function earned(address account) public view returns (uint256) {
        return ((balanceOf(account) * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) + rewards[account];
    }

    // internal views

    // function to check if staking rewards have ended
    function rewardTimestamp() internal view returns (uint256) {
        if (block.timestamp < lastRewardTimestamp) {
            return block.timestamp;
        } else {
            return lastRewardTimestamp;
        }
    }

    // function to check if staking rewards have started
    function startTimestamp() internal view returns (uint256) {
        if (startRewardsTime > lastUpdateTime) {
            return startRewardsTime;
        } else {
            return lastUpdateTime;
        }
    }

    // internal functions

    function _stake(
        address _user,
        uint256 _amount,
        uint256 _duration
    ) internal updateReward(_user) {
        require(_amount > 0, "Must stake > 0 tokens");
        require(_duration <= maxLockDuration, "Lock exceeds max duration");
        require(!isKilled, "Contract has been killed");

        uint256 balance = deposits[_user].amount;
        uint256 start = deposits[_user].start;
        uint256 end = deposits[_user].end;

        // require new locks to exceed past lock duration
        require(_duration >= end - start, "Must exceed current lock");

        // calculate mint amount, account for previous deposits
        uint256 mintAmount = (((balance + _amount) * getMultiplier(_duration)) / 1e18) - balanceOf(_user);

        // update user deposit
        deposits[_user].amount = balance + _amount;
        deposits[_user].start = uint64(block.timestamp);
        deposits[_user].end = uint64(block.timestamp + _duration);

        // transfer and mint
        require(token.transferFrom(_user, address(this), _amount), "Token transfer failed");
        _mint(_user, mintAmount);
        emit Staked(_user, _amount);
    }

    function _unstake(address _user, uint256 _amount) internal updateReward(_user) {
        require(_amount > 0, "Must withdraw > 0 tokens");

        uint256 balance = deposits[_user].amount;
        uint256 start = deposits[_user].start;
        uint256 end = deposits[_user].end;

        // require lock has ended if contract has not been killed
        if (!isKilled) {
            require(end < block.timestamp, "Tokens still locked");
        }

        // calculate burn amount
        uint256 burnAmount = (_amount * getMultiplier(end - start)) / 1e18;

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
        uint256 reward = rewards[_user];
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
        uint256 end = deposits[_from].end;
        if (end > 0) {
            uint256 balance = deposits[_from].amount;
            uint256 start = deposits[_from].start;

            // calculate equivalent deposited amount
            uint256 depositAmount = balance / (getMultiplier(end - start) / 1e18);

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
}
