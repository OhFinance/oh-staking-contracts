import {BigNumberish} from '@ethersproject/bignumber';
import {getERC20, getEscrow, getStaking} from './contract';

// erc20

export const balanceOf = async (signer: string, token: string, owner: string) => {
  const erc20 = await getERC20(signer, token);
  return await erc20.balanceOf(owner);
};

export const approve = async (
  signer: string,
  token: string,
  owner: string,
  amount: BigNumberish
) => {
  const erc20 = await getERC20(signer, token);
  const tx = await erc20.approve(owner, amount);
  await tx.wait();
};

export const transfer = async (signer: string, token: string, to: string, amount: BigNumberish) => {
  const erc20 = await getERC20(signer, token);
  const tx = await erc20.transfer(to, amount);
  await tx.wait();
};

// staking

export const stake = async (
  signer: string,
  staking: string,
  amount: BigNumberish,
  duration: BigNumberish
) => {
  const stk = await getStaking(signer, staking);
  const tx = await stk.stake(amount, duration);
  await tx.wait();
};

export const unstake = async (signer: string, staking: string, amount: BigNumberish) => {
  const stk = await getStaking(signer, staking);
  const tx = await stk.unstake(amount);
  await tx.wait();
};

export const claim = async (signer: string, staking: string) => {
  const stk = await getStaking(signer, staking);
  const tx = await stk.claim();
  await tx.wait();
};

export const exit = async (signer: string, staking: string) => {
  const stk = await getStaking(signer, staking);
  const tx = await stk.exit();
  await tx.wait();
};

export const setRewardAmount = async (
  signer: string,
  staking: string,
  amount: BigNumberish,
  duration: BigNumberish
) => {
  const stk = await getStaking(signer, staking);
  const tx = await stk.setRewardAmount(amount, duration);
  await tx.wait();
};

// escrow

export const redeem = async (signer: string, escrow: string) => {
  const esc = await getEscrow(signer, escrow);
  const tx = await esc.redeem();
  await tx.wait();
};

export const redeemAll = async (signer: string, escrow: string) => {
  const esc = await getEscrow(signer, escrow);
  const tx = await esc.redeemAll();
  await tx.wait();
};
