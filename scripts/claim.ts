import {ethers, getNamedAccounts} from 'hardhat';

async function main() {
  const {deployer} = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const staking = await ethers.getContract('OhStaking', signer);

  let tx = await staking.claim();
  await tx.wait(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
