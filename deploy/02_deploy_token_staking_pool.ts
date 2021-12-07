import {parseEther} from '@ethersproject/units';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {getEscrow} from '../lib/contract';
import {LOCKUP_PERIOD} from '../lib/constants';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deployer, token} = await getNamedAccounts();
  const {deploy, log} = deployments;

  log('Staking - Oh! Pool');

  const escrow = await getEscrow(deployer);

  await deploy('OhStaking', {
    from: deployer,
    args: [
      'Staked Oh! Finance',
      'SOH',
      token,
      escrow.address,
      parseEther('1'),
      LOCKUP_PERIOD,
      600 + Math.floor(Date.now() / 1000), // 86400 // 1d
    ],
    log: true,
    deterministicDeployment: false,
    skipIfAlreadyDeployed: false,
  });
};

deploy.tags = ['Staking'];
export default deploy;
