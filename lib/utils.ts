import {ethers, network} from 'hardhat';

export const impersonateAccount = async (account: string) => {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [account],
  });
};

export const stopImpersonatingAccount = async (account: string) => {
  await network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [account],
  });
};

export const advanceNBlocks = async (n: number) => {
  for (let i = 0; i < n; i++) {
    await ethers.provider.send('evm_mine', []);
  }
};

export const advanceNSeconds = async (n: number) => {
  await ethers.provider.send('evm_increaseTime', [n]);
};
