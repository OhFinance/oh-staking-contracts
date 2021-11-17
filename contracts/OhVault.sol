pragma solidity 0.8.7;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract OhVault is Ownable {

    mapping (address => bool) public rewardPools;

    modifier onlyPool {
        require(rewardPools[msg.sender], "Vault: Only Pool");
        _;
    }

    function calculateRewards() external onlyPool {

    }

    function distributeRewards() external onlyPool {

    }

    function addRewards(uint256 _amount) external {

    }

    function setPool(address _pool, bool _approved) external onlyOwner {
        require(rewardPools[_pool] != _approved, "Vault: No Pool Change");
        rewardPools[_pool] = _approved;
    }
}