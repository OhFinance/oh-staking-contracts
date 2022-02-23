import {parseEther} from '@ethersproject/units';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {getEscrow} from '../lib/contract';
import {ESCROW_PERIOD} from '../lib/constants';

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
      60 * 60, // ESCROW_PERIOD, // 60 * 60
      60, // 60 * 60 * 24, // 1 day // 60
    ],
    log: true,
    deterministicDeployment: false,
    skipIfAlreadyDeployed: false,
  });
};

deploy.tags = ['Staking'];
export default deploy;
