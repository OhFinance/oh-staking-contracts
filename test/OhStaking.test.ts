import {parseEther} from '@ethersproject/units';
import {expect} from 'chai';
import {deployments, ethers, getNamedAccounts} from 'hardhat';
import {impersonateAccount} from '../lib/utils';
import {getEscrow, getStaking} from '../lib/contract';

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
      const rewardToken = await ethers.getContractAt(
        ['function approve(address,uint256) external'],
        token,
        signer
      );
      const tx2 = await rewardToken.approve(escrow.address, 1);
      await tx2.wait();
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
      expect(startRewardsTime).to.be.gt(Date.now());
    });

    it('stakes and locks correctly', async function () {});

    it('claims and redeems escrowed rewards', async function () {});

    it('unstakes and exits correctly', async function () {});
  });
});
