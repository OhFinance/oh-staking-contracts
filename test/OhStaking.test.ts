import {parseEther} from '@ethersproject/units';
import {expect} from 'chai';
import {deployments, ethers, getNamedAccounts} from 'hardhat';
import {
  advanceNBlocks,
  advanceNSeconds,
  impersonateAccount,
  stopImpersonatingAccount,
} from '../lib/utils';
import {getERC20, getEscrow, getStaking} from '../lib/contract';
import {
  approve,
  balanceOf,
  claim,
  exit,
  redeem,
  redeemAll,
  setRewardAmount,
  stake,
  transfer,
  unstake,
} from '../lib/functions';
import {ESCROW_PERIOD, LOCKUP_PERIOD} from '../lib/constants';

describe('OhStaking', function () {
  describe('Staking', function () {
    before(async function () {
      await deployments.fixture(['Escrow', 'Staking']);
      const {deployer, treasury, token} = await getNamedAccounts();
      const escrow = await getEscrow(deployer);
      const staking = await getStaking(deployer);

      // setup staking as minter
      const tx = await escrow.setMinter(staking.address);
      await tx.wait();

      await impersonateAccount(treasury);
      const signer = await ethers.getSigner(treasury);

      // approve escrow to take rewards from treasury
      await approve(signer.address, token, escrow.address, parseEther('10000000'));
      // send deployer funds
      await transfer(signer.address, token, deployer, 100000);
    });

    it('is deployed correctly', async function () {
      const {deployer, token} = await getNamedAccounts();
      const escrow = await getEscrow(deployer);
      const staking = await getStaking(deployer);

      const name = await staking.name();
      const symbol = await staking.symbol();
      const staked = await staking.token();
      const reward = await staking.escrow();
      const maxBonus = await staking.maxBonus();
      const maxLockDuration = await staking.maxLockDuration();

      expect(name).to.eq('Staked Oh! Finance');
      expect(symbol).to.eq('SOH');
      expect(staked).to.eq(token);
      expect(reward).to.eq(escrow.address);
      expect(maxBonus).to.eq(parseEther('1'));
      expect(maxLockDuration).to.eq(LOCKUP_PERIOD);
    });

    it('sets reward rate correctly', async function () {
      const {deployer} = await getNamedAccounts();
      const staking = await getStaking(deployer);

      await setRewardAmount(deployer, staking.address, parseEther('10000000'), LOCKUP_PERIOD);

      const rewardRate = await staking.rewardRate();
      const rewardDuration = await staking.rewardsDuration();

      expect(rewardRate).to.be.gt(0);
      expect(rewardDuration).to.be.eq(LOCKUP_PERIOD);
    });

    it('stakes and locks correctly', async function () {
      const {deployer, token} = await getNamedAccounts();
      const staking = await getStaking(deployer);

      await approve(deployer, token, staking.address, 100000);
      await stake(deployer, staking.address, 10000, 0);

      const standardBalance = await balanceOf(deployer, staking.address, deployer);
      expect(standardBalance).to.eq(10000);

      await advanceNSeconds(10000);
      await advanceNBlocks(1);

      await stake(deployer, staking.address, 90000, LOCKUP_PERIOD);

      const bonusBalance = await balanceOf(deployer, staking.address, deployer);
      expect(bonusBalance).to.eq(200000);
    });

    it('claims and redeems escrowed rewards', async function () {
      const {deployer} = await getNamedAccounts();
      const staking = await getStaking(deployer);
      const escrow = await getEscrow(deployer);

      await advanceNSeconds(86400 * 2); // 2 days
      await advanceNBlocks(1);

      await claim(deployer, staking.address);
      const balance = await balanceOf(deployer, escrow.address, deployer);

      expect(balance).to.be.gt(0);

      await advanceNSeconds(ESCROW_PERIOD + 1);
      await advanceNBlocks(1);

      await redeemAll(deployer, escrow.address);
    });

    it('unstakes and exits correctly', async function () {
      const {deployer} = await getNamedAccounts();
      const staking = await getStaking(deployer);

      await advanceNSeconds(LOCKUP_PERIOD);
      await advanceNBlocks(1);

      await unstake(deployer, staking.address, 99999);

      await advanceNSeconds(86400); // 1 day
      await advanceNBlocks(1);

      await exit(deployer, staking.address);
    });
  });
});
