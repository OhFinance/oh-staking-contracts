import {ethers} from 'hardhat';

export const getERC20 = async (signer: string, at: string) => {
  return await ethers.getContractAt(
    [
      'function approve(address,uint256) external',
      'function transfer(address,uint256) external',
      'function balanceOf(address) external view returns (uint256)',
    ],
    at,
    signer
  );
};

export const getEscrow = async (signer: string, at?: string) => {
  if (at) {
    return await ethers.getContractAt('OhEscrow', at, signer);
  }
  return await ethers.getContract('OhEscrow', signer);
};

export const getStaking = async (signer: string, at?: string) => {
  if (at) {
    return await ethers.getContractAt('OhStaking', at, signer);
  }
  return await ethers.getContract('OhStaking', signer);
};
