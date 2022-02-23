import {ethers, getNamedAccounts} from 'hardhat';

const UNSTAKE_AMOUNT = '100';

async function main() {
  const {deployer} = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const staking = await ethers.getContract('OhStaking', signer);

  let tx = await staking.unstake(ethers.utils.parseEther(UNSTAKE_AMOUNT));
  await tx.wait(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
