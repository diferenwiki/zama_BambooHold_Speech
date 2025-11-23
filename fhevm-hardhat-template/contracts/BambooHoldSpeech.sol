// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, ebool, externalEuint16} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title BambooHoldSpeech
 * @notice Privacy-preserving caution window system based on encrypted emotional metrics
 * @dev Uses FHEVM to compute risk scores from encrypted inputs without revealing user data
 */
contract BambooHoldSpeech is ZamaEthereumConfig {
    // Struct to store encrypted metrics and computed results
    struct MetricsRecord {
        euint16 emotionalFluctuation;
        euint16 socialFatigue;
        euint16 sleepDebt;
        euint32 riskScore;
        euint8 cautionWindow; // 0: Safe, 1: Moderate, 2: High Risk
        uint256 timestamp;
    }

    // Mapping from user address to their metrics history
    mapping(address => MetricsRecord[]) private userHistory;

    // Mapping from user address to their latest metrics (for quick access)
    mapping(address => MetricsRecord) private latestMetrics;

    // Summary statistics (partially public for analytics)
    mapping(address => uint256) public submissionCount;

    // Events
    event MetricsSubmitted(address indexed user, uint256 timestamp, uint256 recordIndex);
    event CautionWindowUpdated(address indexed user, uint256 timestamp);

    // Risk thresholds (weighted sum * 10, to avoid division)
    // Max score: 100*12 + 100*10 + 100*15 = 3700 (scaled by 10)
    // Real max: 370
    // 
    // Moderate: 30% of max = 111 real → 1110 scaled
    // High Risk: 50% of max = 185 real → 1850 scaled
    uint16 private constant MODERATE_THRESHOLD = 1110;
    uint16 private constant HIGH_RISK_THRESHOLD = 1850;

    /**
     * @notice Submit encrypted metrics for caution window calculation
     * @param inputEmotional Encrypted input for emotional fluctuation
     * @param inputSocial Encrypted input for social fatigue
     * @param inputSleep Encrypted input for sleep debt
     * @param inputProof Input proof for all three metrics
     */
    function submitMetrics(
        externalEuint16 inputEmotional,
        externalEuint16 inputSocial,
        externalEuint16 inputSleep,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted inputs to euint16
        euint16 emotional = FHE.fromExternal(inputEmotional, inputProof);
        euint16 social = FHE.fromExternal(inputSocial, inputProof);
        euint16 sleep = FHE.fromExternal(inputSleep, inputProof);

        // Calculate encrypted risk score and caution window
        (euint32 riskScore, euint8 cautionWindow) = _calculateRiskScore(emotional, social, sleep);

        // Create metrics record
        MetricsRecord memory record = MetricsRecord({
            emotionalFluctuation: emotional,
            socialFatigue: social,
            sleepDebt: sleep,
            riskScore: riskScore,
            cautionWindow: cautionWindow,
            timestamp: block.timestamp
        });

        // Store in history
        userHistory[msg.sender].push(record);
        
        // Update latest metrics
        latestMetrics[msg.sender] = record;

        // Update submission count
        submissionCount[msg.sender]++;

        // Allow user to decrypt their own data
        FHE.allow(riskScore, msg.sender);
        FHE.allow(cautionWindow, msg.sender);
        FHE.allow(emotional, msg.sender);
        FHE.allow(social, msg.sender);
        FHE.allow(sleep, msg.sender);

        // Also allow this contract to use and access these values
        FHE.allowThis(emotional);
        FHE.allowThis(social);
        FHE.allowThis(sleep);
        FHE.allowThis(riskScore);
        FHE.allowThis(cautionWindow);
        
        // Allow this contract address for user decryption (needed for EIP-712 signature)
        FHE.allow(emotional, address(this));
        FHE.allow(social, address(this));
        FHE.allow(sleep, address(this));
        FHE.allow(riskScore, address(this));
        FHE.allow(cautionWindow, address(this));

        emit MetricsSubmitted(msg.sender, block.timestamp, userHistory[msg.sender].length - 1);
        emit CautionWindowUpdated(msg.sender, block.timestamp);
    }

    /**
     * @notice Calculate encrypted risk score and caution window level
     * @dev Uses FHE operations to maintain privacy while computing
     */
    function _calculateRiskScore(
        euint16 emotional,
        euint16 social,
        euint16 sleep
    ) private returns (euint32 riskScore, euint8 cautionWindow) {
        // Calculate weighted sum: emotional * 1.2 + social * 1.0 + sleep * 1.5
        // Multiply by 10 to avoid decimals: emotional * 12 + social * 10 + sleep * 15
        euint16 emotionalWeighted = FHE.mul(emotional, FHE.asEuint16(12)); // * 1.2 * 10 = * 12
        euint16 socialWeighted = FHE.mul(social, FHE.asEuint16(10));       // * 1.0 * 10 = * 10
        euint16 sleepWeighted = FHE.mul(sleep, FHE.asEuint16(15));         // * 1.5 * 10 = * 15

        // Sum all weighted components (result is scaled by 10)
        euint16 totalWeighted = FHE.add(emotionalWeighted, socialWeighted);
        totalWeighted = FHE.add(totalWeighted, sleepWeighted);

        // Don't divide - just use scaled thresholds
        // Cast to euint32 for risk score (still scaled by 10)
        riskScore = FHE.asEuint32(totalWeighted);

        // Determine caution window level using encrypted comparison
        // Compare totalWeighted (scaled by 10) against scaled thresholds
        ebool isHighRisk = FHE.ge(totalWeighted, FHE.asEuint16(HIGH_RISK_THRESHOLD));
        ebool isModerateRisk = FHE.ge(totalWeighted, FHE.asEuint16(MODERATE_THRESHOLD));

        // Use FHE.select to assign level
        euint8 level0 = FHE.asEuint8(0);
        euint8 level1 = FHE.asEuint8(1);
        euint8 level2 = FHE.asEuint8(2);

        // First select between level 2 and others
        cautionWindow = FHE.select(isHighRisk, level2, level1);
        // Then select between level 1 and level 0
        cautionWindow = FHE.select(isModerateRisk, cautionWindow, level0);
    }

    /**
     * @notice Get the current caution window status (encrypted)
     * @return Encrypted caution window level
     */
    function getCautionWindow() external view returns (euint8) {
        require(latestMetrics[msg.sender].timestamp > 0, "No metrics submitted yet");
        return latestMetrics[msg.sender].cautionWindow;
    }

    /**
     * @notice Get the current risk score (encrypted)
     * @return Encrypted risk score
     */
    function getRiskScore() external view returns (euint32) {
        require(latestMetrics[msg.sender].timestamp > 0, "No metrics submitted yet");
        return latestMetrics[msg.sender].riskScore;
    }

    /**
     * @notice Get the latest metrics (encrypted)
     * @return emotional Encrypted emotional fluctuation
     * @return social Encrypted social fatigue
     * @return sleep Encrypted sleep debt
     * @return timestamp Submission timestamp (public)
     */
    function getLatestMetrics() external view returns (
        euint16 emotional,
        euint16 social,
        euint16 sleep,
        uint256 timestamp
    ) {
        require(latestMetrics[msg.sender].timestamp > 0, "No metrics submitted yet");
        MetricsRecord memory record = latestMetrics[msg.sender];
        return (record.emotionalFluctuation, record.socialFatigue, record.sleepDebt, record.timestamp);
    }

    /**
     * @notice Get the number of historical records for the caller
     * @return Number of records
     */
    function getHistoryCount() external view returns (uint256) {
        return userHistory[msg.sender].length;
    }

    /**
     * @notice Get metrics at a specific index in history (encrypted)
     * @param index Index in the history array
     * @return emotional Encrypted emotional fluctuation
     * @return social Encrypted social fatigue
     * @return sleep Encrypted sleep debt
     * @return riskScore Encrypted risk score
     * @return cautionWindow Encrypted caution window level
     * @return timestamp Submission timestamp (public)
     */
    function getMetricsAtIndex(uint256 index) external view returns (
        euint16 emotional,
        euint16 social,
        euint16 sleep,
        euint32 riskScore,
        euint8 cautionWindow,
        uint256 timestamp
    ) {
        require(index < userHistory[msg.sender].length, "Index out of bounds");
        MetricsRecord memory record = userHistory[msg.sender][index];
        return (
            record.emotionalFluctuation,
            record.socialFatigue,
            record.sleepDebt,
            record.riskScore,
            record.cautionWindow,
            record.timestamp
        );
    }

    /**
     * @notice Get summary statistics (partially public)
     * @return totalSubmissions Total number of submissions
     * @return lastTimestamp Last submission timestamp
     */
    function getSummary() external view returns (
        uint256 totalSubmissions,
        uint256 lastTimestamp
    ) {
        totalSubmissions = submissionCount[msg.sender];
        lastTimestamp = latestMetrics[msg.sender].timestamp;
    }

    /**
     * @notice Get latest timestamp (public for UI display)
     * @return timestamp Last update timestamp
     */
    function getLastUpdateTimestamp() external view returns (uint256) {
        return latestMetrics[msg.sender].timestamp;
    }

    /**
     * @notice Re-authorize old records for decryption (fix for records submitted before authorization fix)
     * @param index Index of the record to re-authorize
     */
    function reauthorizeRecord(uint256 index) external {
        require(index < userHistory[msg.sender].length, "Index out of bounds");
        MetricsRecord storage record = userHistory[msg.sender][index];
        
        // Re-authorize all encrypted fields for user and contract
        FHE.allow(record.emotionalFluctuation, msg.sender);
        FHE.allow(record.socialFatigue, msg.sender);
        FHE.allow(record.sleepDebt, msg.sender);
        FHE.allow(record.riskScore, msg.sender);
        FHE.allow(record.cautionWindow, msg.sender);
        
        FHE.allow(record.emotionalFluctuation, address(this));
        FHE.allow(record.socialFatigue, address(this));
        FHE.allow(record.sleepDebt, address(this));
        FHE.allow(record.riskScore, address(this));
        FHE.allow(record.cautionWindow, address(this));
        
        // Also re-authorize latest metrics if this is the latest record
        if (index == userHistory[msg.sender].length - 1) {
            FHE.allow(latestMetrics[msg.sender].emotionalFluctuation, msg.sender);
            FHE.allow(latestMetrics[msg.sender].socialFatigue, msg.sender);
            FHE.allow(latestMetrics[msg.sender].sleepDebt, msg.sender);
            FHE.allow(latestMetrics[msg.sender].riskScore, msg.sender);
            FHE.allow(latestMetrics[msg.sender].cautionWindow, msg.sender);
            
            FHE.allow(latestMetrics[msg.sender].emotionalFluctuation, address(this));
            FHE.allow(latestMetrics[msg.sender].socialFatigue, address(this));
            FHE.allow(latestMetrics[msg.sender].sleepDebt, address(this));
            FHE.allow(latestMetrics[msg.sender].riskScore, address(this));
            FHE.allow(latestMetrics[msg.sender].cautionWindow, address(this));
        }
    }

    /**
     * @notice Re-authorize all records for decryption (batch fix)
     */
    function reauthorizeAllRecords() external {
        uint256 count = userHistory[msg.sender].length;
        for (uint256 i = 0; i < count; i++) {
            MetricsRecord storage record = userHistory[msg.sender][i];
            
            FHE.allow(record.emotionalFluctuation, msg.sender);
            FHE.allow(record.socialFatigue, msg.sender);
            FHE.allow(record.sleepDebt, msg.sender);
            FHE.allow(record.riskScore, msg.sender);
            FHE.allow(record.cautionWindow, msg.sender);
            
            FHE.allow(record.emotionalFluctuation, address(this));
            FHE.allow(record.socialFatigue, address(this));
            FHE.allow(record.sleepDebt, address(this));
            FHE.allow(record.riskScore, address(this));
            FHE.allow(record.cautionWindow, address(this));
        }
        
        // Also re-authorize latest metrics
        if (count > 0) {
            FHE.allow(latestMetrics[msg.sender].emotionalFluctuation, msg.sender);
            FHE.allow(latestMetrics[msg.sender].socialFatigue, msg.sender);
            FHE.allow(latestMetrics[msg.sender].sleepDebt, msg.sender);
            FHE.allow(latestMetrics[msg.sender].riskScore, msg.sender);
            FHE.allow(latestMetrics[msg.sender].cautionWindow, msg.sender);
            
            FHE.allow(latestMetrics[msg.sender].emotionalFluctuation, address(this));
            FHE.allow(latestMetrics[msg.sender].socialFatigue, address(this));
            FHE.allow(latestMetrics[msg.sender].sleepDebt, address(this));
            FHE.allow(latestMetrics[msg.sender].riskScore, address(this));
            FHE.allow(latestMetrics[msg.sender].cautionWindow, address(this));
        }
    }
}

