const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

/**
 * Walrus Service for storing and retrieving face enrollment data
 * This service handles storing enrollment status and metadata on Walrus decentralized storage
 */
class WalrusService {
  constructor() {
    this.walrusCliPath = 'walrus'; // Assumes walrus CLI is in PATH
    this.configPath = '~/.config/walrus/client_config.yaml';
    this.tempDir = path.join(__dirname, '../../temp');
    this.network = process.env.WALRUS_NETWORK || 'testnet';
    
    // Ensure temp directory exists
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create temp directory:', error.message);
    }
  }

  /**
   * Store face enrollment data on Walrus
   * @param {Object} enrollmentData - The enrollment data to store
   * @param {string} enrollmentData.walletAddress - Sui wallet address
   * @param {string} enrollmentData.userName - User's name from Google OAuth
   * @param {string} enrollmentData.userEmail - User's email from Google OAuth
   * @param {string} enrollmentData.luxandUuid - UUID from Luxand Cloud API
   * @param {string} enrollmentData.enrolledAt - ISO timestamp of enrollment
   * @param {boolean} enrollmentData.isEnrolled - Enrollment status
   * @returns {Promise<Object>} - Walrus blob information
   */
  async storeEnrollmentData(enrollmentData) {
    try {
      const tempFilePath = path.join(this.tempDir, `enrollment_${enrollmentData.walletAddress}_${Date.now()}.json`);
      
      // Create enrollment record
      const enrollmentRecord = {
        version: '1.0',
        walletAddress: enrollmentData.walletAddress,
        userName: enrollmentData.userName,
        userEmail: enrollmentData.userEmail,
        luxandUuid: enrollmentData.luxandUuid,
        luxandPersonName: `${enrollmentData.walletAddress}|${enrollmentData.userName}`,
        enrolledAt: enrollmentData.enrolledAt,
        isEnrolled: enrollmentData.isEnrolled,
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'PayWiser',
          type: 'face_enrollment',
          network: this.network
        }
      };

      // Write to temporary file
      await fs.writeFile(tempFilePath, JSON.stringify(enrollmentRecord, null, 2));

      // Store on Walrus with 5 epochs duration (deletable)
      const storeCommand = `${this.walrusCliPath} store --epochs 5 --deletable "${tempFilePath}"`;
      console.log('🗂️ Storing enrollment data on Walrus...');
      
      const { stdout, stderr } = await execAsync(storeCommand);
      
      if (stderr) {
        console.warn('Walrus store warning:', stderr);
      }

      // Parse Walrus response
      const walrusResponse = JSON.parse(stdout);
      
      // Clean up temp file
      await fs.unlink(tempFilePath).catch(() => {});

      console.log('✅ Enrollment data stored on Walrus:', {
        blobId: walrusResponse.newlyCreated?.blobObject?.blobId || walrusResponse.alreadyCertified?.blobId,
        walletAddress: enrollmentData.walletAddress
      });

      return {
        success: true,
        blobId: walrusResponse.newlyCreated?.blobObject?.blobId || walrusResponse.alreadyCertified?.blobId,
        blobObject: walrusResponse.newlyCreated?.blobObject || null,
        cost: walrusResponse.newlyCreated?.cost || 0,
        data: enrollmentRecord
      };

    } catch (error) {
      console.error('❌ Failed to store enrollment data on Walrus:', error);
      throw new Error(`Walrus storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve face enrollment data from Walrus
   * @param {string} blobId - Walrus blob ID
   * @returns {Promise<Object>} - Enrollment data
   */
  async retrieveEnrollmentData(blobId) {
    try {
      console.log('📥 Retrieving enrollment data from Walrus...');
      
      const readCommand = `${this.walrusCliPath} read "${blobId}"`;
      const { stdout, stderr } = await execAsync(readCommand);
      
      if (stderr) {
        console.warn('Walrus read warning:', stderr);
      }

      const enrollmentData = JSON.parse(stdout);
      
      console.log('✅ Retrieved enrollment data from Walrus:', {
        blobId,
        walletAddress: enrollmentData.walletAddress
      });

      return {
        success: true,
        data: enrollmentData
      };

    } catch (error) {
      console.error('❌ Failed to retrieve enrollment data from Walrus:', error);
      throw new Error(`Walrus retrieval failed: ${error.message}`);
    }
  }

  /**
   * Update enrollment status on Walrus
   * @param {string} oldBlobId - Previous blob ID to replace
   * @param {Object} updatedData - Updated enrollment data
   * @returns {Promise<Object>} - New Walrus blob information
   */
  async updateEnrollmentData(oldBlobId, updatedData) {
    try {
      // First retrieve the existing data
      const existingData = await this.retrieveEnrollmentData(oldBlobId);
      
      // Merge with updates
      const mergedData = {
        ...existingData.data,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      // Store the updated data
      return await this.storeEnrollmentData(mergedData);

    } catch (error) {
      console.error('❌ Failed to update enrollment data on Walrus:', error);
      throw new Error(`Walrus update failed: ${error.message}`);
    }
  }

  /**
   * Create enrollment index for quick lookups
   * This stores a mapping of wallet addresses to their enrollment blob IDs
   * @param {Object} indexData - Index mapping data
   * @returns {Promise<Object>} - Walrus blob information for index
   */
  async storeEnrollmentIndex(indexData) {
    try {
      const tempFilePath = path.join(this.tempDir, `enrollment_index_${Date.now()}.json`);
      
      const indexRecord = {
        version: '1.0',
        type: 'enrollment_index',
        createdAt: new Date().toISOString(),
        network: this.network,
        enrollments: indexData
      };

      await fs.writeFile(tempFilePath, JSON.stringify(indexRecord, null, 2));

      const storeCommand = `${this.walrusCliPath} store --epochs 10 --deletable "${tempFilePath}"`;
      console.log('🗂️ Storing enrollment index on Walrus...');
      
      const { stdout, stderr } = await execAsync(storeCommand);
      
      if (stderr) {
        console.warn('Walrus store index warning:', stderr);
      }

      const walrusResponse = JSON.parse(stdout);
      
      // Clean up temp file
      await fs.unlink(tempFilePath).catch(() => {});

      console.log('✅ Enrollment index stored on Walrus');

      return {
        success: true,
        blobId: walrusResponse.newlyCreated?.blobObject?.blobId || walrusResponse.alreadyCertified?.blobId,
        data: indexRecord
      };

    } catch (error) {
      console.error('❌ Failed to store enrollment index on Walrus:', error);
      throw new Error(`Walrus index storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve enrollment index from Walrus
   * @param {string} indexBlobId - Index blob ID
   * @returns {Promise<Object>} - Index data
   */
  async retrieveEnrollmentIndex(indexBlobId) {
    try {
      console.log('📥 Retrieving enrollment index from Walrus...');
      
      const readCommand = `${this.walrusCliPath} read "${indexBlobId}"`;
      const { stdout, stderr } = await execAsync(readCommand);
      
      if (stderr) {
        console.warn('Walrus read index warning:', stderr);
      }

      const indexData = JSON.parse(stdout);
      
      console.log('✅ Retrieved enrollment index from Walrus');

      return {
        success: true,
        data: indexData
      };

    } catch (error) {
      console.error('❌ Failed to retrieve enrollment index from Walrus:', error);
      throw new Error(`Walrus index retrieval failed: ${error.message}`);
    }
  }

  /**
   * Check if Walrus CLI is available
   * @returns {Promise<boolean>} - Whether Walrus CLI is available
   */
  async checkWalrusAvailability() {
    try {
      const { stdout } = await execAsync(`${this.walrusCliPath} --version`);
      console.log('✅ Walrus CLI available:', stdout.trim());
      return true;
    } catch (error) {
      console.warn('⚠️ Walrus CLI not available:', error.message);
      return false;
    }
  }

  /**
   * Get Walrus network status
   * @returns {Promise<Object>} - Network status information
   */
  async getNetworkStatus() {
    try {
      const { stdout } = await execAsync(`${this.walrusCliPath} info`);
      const statusInfo = JSON.parse(stdout);
      
      return {
        success: true,
        network: this.network,
        status: statusInfo
      };
    } catch (error) {
      console.warn('⚠️ Failed to get Walrus network status:', error.message);
      return {
        success: false,
        network: this.network,
        error: error.message
      };
    }
  }
}

module.exports = new WalrusService();
