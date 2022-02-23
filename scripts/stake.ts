import {ethers, getNamedAccounts} from 'hardhat';

const STAKE_AMOUNT = '100';
const STAKE_DURATION = 3600;

async function main() {
  const {deployer} = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const staking = await ethers.getContract('OhStaking', signer);

  let tx = await staking.stake(ethers.utils.parseEther(STAKE_AMOUNT), STAKE_DURATION);
  await tx.wait(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
