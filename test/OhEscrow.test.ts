import {expect} from 'chai';
import {deployments, getNamedAccounts} from 'hardhat';
import {getEscrow} from '../lib/contract';

describe('OhEscrow', function () {
  before(async function () {
    await deployments.fixture(['Escrow']);
  });

  it('is deployed correctly', async function () {
    const {deployer, token, treasury} = await getNamedAccounts();
    const escrow = await getEscrow(deployer);

    const name = await escrow.name();
    const symbol = await escrow.symbol();
    const reward = await escrow.token();
    const multisig = await escrow.treasury();
    const duration = await escrow.escrowDuration();

    expect(name).to.eq('Escrowed Oh! Finance');
    expect(symbol).to.eq('EOH');
    expect(reward).to.eq(token);
    expect(treasury).to.eq(multisig);
    expect(duration).to.eq(7776000);
  });

  it('sets minter correctly', async function () {
    const {deployer} = await getNamedAccounts();
    const escrow = await getEscrow(deployer);

    const tx = await escrow.setMinter(deployer);
    await tx.wait();

    const approved = await escrow.minters(deployer);
    expect(approved).to.be.true;

    const tx2 = await escrow.mint(deployer, 1);
    await tx2.wait();

    const balance = await escrow.balanceOf(deployer);
    expect(balance.toNumber()).to.eq(1);
  });
});
