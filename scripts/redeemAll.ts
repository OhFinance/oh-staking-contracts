import {ethers, getNamedAccounts} from 'hardhat';
import {getEscrow} from 'lib/contract';

async function main() {
  const {deployer} = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const escrow = await getEscrow(signer.address);

  let tx = await escrow.redeemAll();
  await tx.wait(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
