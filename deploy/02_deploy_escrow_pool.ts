import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

// 3 Months
const ESCROW_PERIOD = 60 * 60 * 24 * 30 * 3;

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deployer, token, zero} = await getNamedAccounts();
  const {deploy, log} = deployments;

  log('Staking - Escrow');

  await deploy('EscrowPool', {
    from: deployer,
    contract: 'OhPool',
    args: ['Escrowed Oh! Finance', 'EOH', token, token, zero, 0, 0, 0, ESCROW_PERIOD],
    log: true,
    deterministicDeployment: false,
    skipIfAlreadyDeployed: false,
  });
};

deploy.tags = ['EscrowPool'];
export default deploy;
