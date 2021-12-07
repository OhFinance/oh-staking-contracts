import {ethers} from 'hardhat';

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
