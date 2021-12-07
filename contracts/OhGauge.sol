// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


/// @dev Oh! Finance Gauge
/// @dev Contract to distribute rewards to Vault contracts, cross-chain compatible
/// @dev Gauge pulls rewards from Treasury multisig every epoch and distributes them to each Vault
contract OhGauge {
    using SafeERC20 for IERC20;

    uint256 public constant EPOCH_LENGTH = 60 * 60 * 24 * 30; // 1 month
    uint256 public epoch;
    uint256 public rewardsPerEpoch;
    uint256 public totalWeight;

    IERC20 public immutable reward;
    address public immutable rewardSource;
    // address public immutable anyswap;

    mapping(uint256 => mapping(address => bool)) public vaultAdded;
    Vault[] public vaults;

    Epoch[] public epochs;

    struct Epoch {
        uint256 start;
        uint256 end;
    }

    struct Vault {
        address vaultContract;
        uint256 chainId;
        uint256 weight;
    }

    constructor(
        address _reward,
        address _rewardSource,
        address _anyswap
    ) {
        require(_reward != address(0), "LiquidityMiningManager.constructor: reward token must be set");
        require(_rewardSource != address(0), "LiquidityMiningManager.constructor: rewardSource token must be set");
        reward = IERC20(_reward);
        rewardSource = _rewardSource;
    }

    /// @dev Distribute reward tokens for the current epoch to each Vault
    function distributeRewards() external {
        Epoch memory current = epochs[epochs.length - 1];
        require(block.timestamp > current.end, "Gauge: Epoch Rewards already distributed");

        // return if vaults length == 0
        if (vaults.length == 0) {
            return;
        }

        // return if epoch rewards == 0
        if (rewardsPerEpoch == 0) {
            return;
        }

        reward.safeTransferFrom(rewardSource, address(this), rewardsPerEpoch);

        for (uint256 i = 0; i < vaults.length; i++) {
            Vault memory vault = vaults[i];
            uint256 vaultRewardAmount = (rewardsPerEpoch * vault.weight) / totalWeight;

            if (vault.chainId == 1) {
                reward.safeTransfer(vault.vaultContract, vaultRewardAmount);
            } else {
                // call anyswap to bridge
            }
        }

        uint256 leftOverReward = reward.balanceOf(address(this));

        // send back excess but ignore dust
        if (leftOverReward > 1) {
            reward.safeTransfer(rewardSource, leftOverReward);
        }

        // emit RewardsDistributed(_msgSender(), totalRewardAmount);
    }
}
