import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deployer, token, treasury} = await getNamedAccounts();
  const {deploy, log} = deployments;

  log('Staking - Vault');

  await deploy('OhVault', {
    from: deployer,
    args: [
      token,
      deployer, // treasury
    ],
    log: true,
    deterministicDeployment: false,
    skipIfAlreadyDeployed: true,
  });
};

deploy.tags = ['Vault'];
export default deploy;
