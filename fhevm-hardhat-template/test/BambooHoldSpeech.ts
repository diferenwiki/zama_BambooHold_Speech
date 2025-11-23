import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import type { BambooHoldSpeech } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";

describe("BambooHoldSpeech", function () {
  let bambooHold: BambooHoldSpeech;
  let contractAddress: string;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;

  before(async () => {
    // Get signers
    const signers = await ethers.getSigners();
    owner = signers[0];
    user1 = signers[1];

    // Deploy all contracts using hardhat-deploy
    await deployments.fixture(["BambooHoldSpeech"]);

    // Get deployed contract
    const BambooHoldSpeechDeployment = await deployments.get("BambooHoldSpeech");
    bambooHold = await ethers.getContractAt("BambooHoldSpeech", BambooHoldSpeechDeployment.address);
    contractAddress = BambooHoldSpeechDeployment.address;
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn("This test suite can only run on FHEVM mock environment");
      this.skip();
    }
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await bambooHold.getAddress()).to.be.properAddress;
    });

    it("Should have zero submissions initially", async function () {
      const count = await bambooHold.getHistoryCount();
      expect(count).to.equal(0);
    });
  });

  describe("Submit Metrics", function () {
    it("Should submit encrypted metrics successfully", async function () {
      // Prepare encrypted inputs
      const input = await fhevm
        .createEncryptedInput(contractAddress, owner.address)
        .add16(45) // Emotional fluctuation
        .add16(30) // Social fatigue
        .add16(50) // Sleep debt
        .encrypt();

      // Submit metrics
      const tx = await bambooHold.submitMetrics(
        input.handles[0],
        input.handles[1],
        input.handles[2],
        input.inputProof
      );

      await expect(tx).to.emit(bambooHold, "MetricsSubmitted");

      // Verify submission count increased
      const count = await bambooHold.getHistoryCount();
      expect(count).to.equal(1);
    });

    it("Should update submission count", async function () {
      const submissionCount = await bambooHold.submissionCount(owner.address);
      expect(submissionCount).to.equal(1);
    });

    it("Should have a valid timestamp", async function () {
      const summary = await bambooHold.getSummary();
      expect(summary.lastTimestamp).to.be.greaterThan(0);
    });

    it("Should allow multiple submissions from same user", async function () {
      // Second submission with different values
      const input = await fhevm
        .createEncryptedInput(contractAddress, owner.address)
        .add16(70) // Higher emotional fluctuation
        .add16(60) // Higher social fatigue
        .add16(80) // Higher sleep debt
        .encrypt();

      await bambooHold.submitMetrics(
        input.handles[0],
        input.handles[1],
        input.handles[2],
        input.inputProof
      );

      const count = await bambooHold.getHistoryCount();
      expect(count).to.equal(2);
    });
  });

  describe("Retrieve Metrics", function () {
    it("Should get latest risk score", async function () {
      const riskScore = await bambooHold.getRiskScore();
      expect(riskScore).to.not.be.undefined;
    });

    it("Should get caution window", async function () {
      const cautionWindow = await bambooHold.getCautionWindow();
      expect(cautionWindow).to.not.be.undefined;
    });

    it("Should get latest metrics", async function () {
      const [emotional, social, sleep, timestamp] = await bambooHold.getLatestMetrics();
      expect(emotional).to.not.be.undefined;
      expect(social).to.not.be.undefined;
      expect(sleep).to.not.be.undefined;
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Should get metrics at specific index", async function () {
      const [emotional, social, sleep, riskScore, cautionWindow, timestamp] = 
        await bambooHold.getMetricsAtIndex(0);
      
      expect(emotional).to.not.be.undefined;
      expect(social).to.not.be.undefined;
      expect(sleep).to.not.be.undefined;
      expect(riskScore).to.not.be.undefined;
      expect(cautionWindow).to.not.be.undefined;
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Should revert when getting metrics with invalid index", async function () {
      await expect(bambooHold.getMetricsAtIndex(999)).to.be.revertedWith("Index out of bounds");
    });

    it("Should get summary statistics", async function () {
      const summary = await bambooHold.getSummary();
      expect(summary.totalSubmissions).to.equal(2);
      expect(summary.lastTimestamp).to.be.greaterThan(0);
    });
  });

  describe("Multiple Users", function () {
    it("Should allow different users to submit independently", async function () {
      // User1 submits
      const input = await fhevm
        .createEncryptedInput(contractAddress, user1.address)
        .add16(25)
        .add16(35)
        .add16(40)
        .encrypt();

      await bambooHold.connect(user1).submitMetrics(
        input.handles[0],
        input.handles[1],
        input.handles[2],
        input.inputProof
      );

      // User1 should have 1 submission
      const user1Count = await bambooHold.connect(user1).getHistoryCount();
      expect(user1Count).to.equal(1);

      // Owner should still have 2 submissions
      const ownerCount = await bambooHold.getHistoryCount();
      expect(ownerCount).to.equal(2);
    });
  });

  describe("Error Cases", function () {
    it("Should revert when getting metrics without submission", async function () {
      const signers = await ethers.getSigners();
      const newUser = signers[2];

      await expect(
        bambooHold.connect(newUser).getRiskScore()
      ).to.be.revertedWith("No metrics submitted yet");

      await expect(
        bambooHold.connect(newUser).getCautionWindow()
      ).to.be.revertedWith("No metrics submitted yet");

      await expect(
        bambooHold.connect(newUser).getLatestMetrics()
      ).to.be.revertedWith("No metrics submitted yet");
    });
  });
});

