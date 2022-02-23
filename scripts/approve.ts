import {ethers, getNamedAccounts} from 'hardhat';

const APPROVE_AMOUNT = '100';

async function main() {
  const {deployer, token} = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const ohToken = await ethers.getContractAt('IERC20', token, signer);
  const staking = await ethers.getContract('OhStaking', signer);

  let tx = await ohToken.approve(staking.address, ethers.utils.parseEther(APPROVE_AMOUNT));
  await tx.wait(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
