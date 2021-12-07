import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {ESCROW_PERIOD} from '../lib/constants';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deployer, token, treasury} = await getNamedAccounts();
  const {deploy, log} = deployments;

  log('Staking - Escrow');

  await deploy('OhEscrow', {
    from: deployer,
    args: ['Escrowed Oh! Finance', 'EOH', token, treasury, ESCROW_PERIOD],
    log: true,
    deterministicDeployment: false,
    skipIfAlreadyDeployed: false,
  });
};

deploy.tags = ['Escrow'];
export default deploy;
