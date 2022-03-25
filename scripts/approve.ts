import {ethers, getNamedAccounts} from 'hardhat';

async function main() {
  const {deployer, token} = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const ohToken = await ethers.getContractAt('IERC20', token, signer);
  const staking = await ethers.getContract('OhStaking', signer);

  let tx = await ohToken.approve(staking.address, ethers.constants.MaxUint256.toString());
  await tx.wait(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
