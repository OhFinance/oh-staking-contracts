import {ethers, getNamedAccounts} from 'hardhat';

const MINTER_ADDRESS = '0x880491180789B91Aa0918d934AcF479e5eD0EA6a';

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
