import {ethers} from 'hardhat';

export const getEscrowPool = async (signer: string, at?: string) => {
  if (at) {
    return await ethers.getContractAt('EscrowPool', at, signer);
  }
  return await ethers.getContract('EscrowPool', signer);
};
