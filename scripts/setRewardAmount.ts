import {ethers, getNamedAccounts} from 'hardhat';
import {getStaking} from '../lib/contract';

const REWARD_AMOUNT = '864000';
const REWARD_DURATION = 864000; // 100 days in seconds

async function main() {
  const {deployer} = await getNamedAccounts();
  const staking = await getStaking(deployer);

  let tx = await staking.setRewardAmount(ethers.utils.parseEther(REWARD_AMOUNT), REWARD_DURATION);
  await tx.wait(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
