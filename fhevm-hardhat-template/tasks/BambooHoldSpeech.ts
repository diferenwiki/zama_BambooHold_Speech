import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("bamboo:submit", "Submit encrypted metrics to BambooHoldSpeech contract")
  .addParam("emotional", "Emotional fluctuation value (0-100)")
  .addParam("social", "Social fatigue value (0-100)")
  .addParam("sleep", "Sleep debt value (0-100)")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { emotional, social, sleep } = taskArguments;

    // Validate inputs
    const emotionalVal = parseInt(emotional);
    const socialVal = parseInt(social);
    const sleepVal = parseInt(sleep);

    if (emotionalVal < 0 || emotionalVal > 100 || 
        socialVal < 0 || socialVal > 100 || 
        sleepVal < 0 || sleepVal > 100) {
      throw new Error("All metrics must be between 0 and 100");
    }

    const BambooHoldSpeechDeployment = await deployments.get("BambooHoldSpeech");
    const bambooHold = await ethers.getContractAt("BambooHoldSpeech", BambooHoldSpeechDeployment.address);

    console.log(`Submitting metrics to BambooHoldSpeech at ${BambooHoldSpeechDeployment.address}`);
    console.log(`Emotional: ${emotionalVal}, Social: ${socialVal}, Sleep: ${sleepVal}`);

    // Note: For actual encrypted submission, you'd need to use fhevmInstance
    // This task is more for demonstration; real encryption should be done in frontend
    console.log("\nNote: This task requires encrypted inputs.");
    console.log("Please use the frontend application for proper encrypted submission.");
  });

task("bamboo:status", "Get current caution window status")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();

    const BambooHoldSpeechDeployment = await deployments.get("BambooHoldSpeech");
    const bambooHold = await ethers.getContractAt("BambooHoldSpeech", BambooHoldSpeechDeployment.address);

    console.log(`Checking status for address: ${signerAddress}`);

    const summary = await bambooHold.getSummary();
    console.log(`\nTotal Submissions: ${summary.totalSubmissions}`);
    
    if (summary.lastTimestamp > 0) {
      const date = new Date(Number(summary.lastTimestamp) * 1000);
      console.log(`Last Update: ${date.toLocaleString()}`);
      console.log("\nNote: Risk score and caution window are encrypted.");
      console.log("Use the frontend application to decrypt and view your data.");
    } else {
      console.log("\nNo metrics submitted yet.");
    }
  });

task("bamboo:history", "Get history count")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();

    const BambooHoldSpeechDeployment = await deployments.get("BambooHoldSpeech");
    const bambooHold = await ethers.getContractAt("BambooHoldSpeech", BambooHoldSpeechDeployment.address);

    const count = await bambooHold.getHistoryCount();
    console.log(`History records for ${signerAddress}: ${count}`);

    if (count > 0) {
      console.log("\nUse the frontend application to view and decrypt your history.");
    }
  });

