import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("BambooHoldSpeech", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`BambooHoldSpeech contract deployed at: ${deployed.address}`);
};

export default func;
func.id = "deploy_bamboohold_speech";
func.tags = ["BambooHoldSpeech"];

