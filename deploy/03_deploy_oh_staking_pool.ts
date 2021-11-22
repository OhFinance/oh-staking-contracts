import {parseEther} from '@ethersproject/units';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {getEscrowPool} from 'lib/contract';

// 3 Months
const ESCROW_PERIOD = 60 * 60 * 24 * 30 * 3;

// 1 Year
const LOCKUP_PERIOD = 60 * 60 * 24 * 30 * 12;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deployer, token, zero} = await getNamedAccounts();
  const {deploy, log} = deployments;

  log('Staking - Oh! Pool');

  const escrow = await getEscrowPool(deployer);

  await deploy('OhStakingPool', {
    from: deployer,
    contract: 'OhPool',
    args: [
      'Staked Oh! Finance',
      'SOH',
      token,
      token,
      escrow.address,
      parseEther('1'),
      ESCROW_PERIOD,
      parseEther('1'),
      LOCKUP_PERIOD,
    ],
    log: true,
    deterministicDeployment: false,
    skipIfAlreadyDeployed: false,
  });
};

deploy.tags = ['OhStakingPool'];
export default deploy;
