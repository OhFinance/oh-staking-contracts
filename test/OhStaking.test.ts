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
  setRewardAmount,
  stake,
  unstake,
} from '../lib/functions';

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

      // approve escrow to take rewards from treasury
      await impersonateAccount(treasury);
      const signer = await ethers.getSigner(treasury);
      const rewardToken = await getERC20(signer.address, token);
      const tx2 = await rewardToken.approve(escrow.address, 1);
      await tx2.wait();

      const tx3 = await rewardToken.transfer(deployer, 10000000);
      await tx3.wait();

      // const bal = await rewardToken.balanceOf(deployer);
      // console.log(bal.toString());
      // await stopImpersonatingAccount(treasury);
      // await impersonateAccount(deployer);
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
      const startRewardsTime = await staking.startRewardsTime();

      expect(name).to.eq('Staked Oh! Finance');
      expect(symbol).to.eq('SOH');
      expect(staked).to.eq(token);
      expect(reward).to.eq(escrow.address);
      expect(maxBonus).to.eq(parseEther('1'));
      expect(maxLockDuration).to.eq(31104000);
      // expect(startRewardsTime).to.be.gt(Date.now());
    });

    it('sets reward rate correctly', async function () {
      const {deployer} = await getNamedAccounts();
      const staking = await getStaking(deployer);

      await setRewardAmount(deployer, staking.address, parseEther('100'), 31104000);
    });

    it('stakes and locks correctly', async function () {
      const {deployer, token} = await getNamedAccounts();
      const contract = await getERC20(deployer, token);
      const staking = await getStaking(deployer);

      await approve(deployer, token, staking.address, 100000);
      await stake(deployer, staking.address, 10000, 0);

      await advanceNSeconds(10000);
      await advanceNBlocks(1);

      await stake(deployer, staking.address, 90000, 31104000);
    });

    it('claims and redeems escrowed rewards', async function () {
      const {deployer} = await getNamedAccounts();
      const staking = await getStaking(deployer);
      const escrow = await getEscrow(deployer);

      await claim(deployer, staking.address);

      await advanceNSeconds(6000);
      await advanceNBlocks(1);

      // await redeem(deployer, escrow.address);
    });

    it('unstakes and exits correctly', async function () {
      const {deployer} = await getNamedAccounts();
      const staking = await getStaking(deployer);

      await advanceNSeconds(31104000);
      await advanceNBlocks(1);

      await unstake(deployer, staking.address, 100000);

      // await exit(deployer, staking.address);
    });
  });
});
