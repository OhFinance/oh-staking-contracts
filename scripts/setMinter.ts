import {ethers, getNamedAccounts} from 'hardhat';

const MINTER_ADDRESS = '0xf88954f79f5bc7f0347bb1e2a4b63a583346e8a4';

async function main() {
  const {deployer} = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const escrow = await ethers.getContract('OhEscrow', signer);

  let tx = await escrow.setMinter(MINTER_ADDRESS);
  await tx.wait(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
