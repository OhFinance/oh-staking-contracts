import {parseEther} from '@ethersproject/units';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {getEscrow} from '../lib/contract';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, network} = hre;
  const {deployer, token, tokenLp, zero} = await getNamedAccounts();
  const {deploy, log} = deployments;

  log('Staking - Oh! LP Pool');

  const escrow = await getEscrow(deployer);

  if (network.name === 'mainnet') {
    // await deploy('OhLPStaking', {
    //   from: deployer,
    //   contract: 'OhStaking',
    //   args: [
    //     'Staked Oh! Finance Sushiswap LP',
    //     'SOHSLP',
    //     tokenLp,
    //     token,
    //     escrow.address,
    //     parseEther('1'),
    //     LOCKUP_PERIOD,
    //   ],
    //   log: true,
    //   deterministicDeployment: false,
    //   skipIfAlreadyDeployed: false,
    // });
  } else if (network.name === 'avalanche') {
  }
};

deploy.tags = ['LPStaking'];
export default deploy;
