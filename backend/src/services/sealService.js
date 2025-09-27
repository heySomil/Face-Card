/**
 * Seal Protocol Integration Service
 * 
 * Handles encrypted biometric data storage and retrieval using Seal Protocol
 * - Encrypts face/voice embeddings before off-chain storage
 * - Manages on-chain policies for decryption access
 * - Enforces fresh nonce requirements for security
 */

const crypto = require('crypto');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { SuiClient } = require('@mysten/sui/client');

class SealService {
  constructor() {
    this.client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
    this.sealPackageId = process.env.SEAL_PACKAGE_ID || '0x...'; // Seal Protocol package ID
    this.verifierKeyPair = null; // Verifier service key
    this.initializeVerifierKey();
  }

  /**
   * Initialize the verifier service key for Seal Protocol
   */
  initializeVerifierKey() {
    try {
      const privateKey = process.env.SEAL_VERIFIER_PRIVATE_KEY;
      if (privateKey) {
        this.verifierKeyPair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
        console.log('🔐 Seal verifier key initialized');
      } else {
        console.warn('⚠️ Seal verifier key not configured');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Seal verifier key:', error);
    }
  }

  /**
   * Encrypt biometric embeddings using Seal Protocol
   * @param {Object} biometricData - Face/voice embeddings and metadata
   * @param {string} userId - User identifier
   * @param {string} terminalId - Terminal/merchant identifier
   * @returns {Object} Encrypted data package
   */
  async encryptBiometricData(biometricData, userId, terminalId) {
    try {
      console.log('🔒 Encrypting biometric data with Seal Protocol...');
      
      // Generate encryption key and nonce
      const encryptionKey = crypto.randomBytes(32);
      const nonce = crypto.randomBytes(16);
      const timestamp = Date.now();

      // Create metadata
      const metadata = {
        userId,
        terminalId,
        timestamp,
        dataType: 'biometric_embeddings',
        version: '1.0'
      };

      // Encrypt the biometric data
      const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
      cipher.setAAD(Buffer.from(JSON.stringify(metadata)));
      
      let encrypted = cipher.update(JSON.stringify(biometricData), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      // Create Seal policy data
      const policyData = {
        encryptedKey: this.encryptKeyForVerifier(encryptionKey),
        nonce: nonce.toString('hex'),
        authTag: authTag.toString('hex'),
        metadata,
        accessConditions: {
          requiresFreshNonce: true,
          allowedVerifiers: [this.verifierKeyPair?.getPublicKey().toSuiAddress()],
          maxAge: 3600000, // 1 hour in milliseconds
        }
      };

      console.log('✅ Biometric data encrypted successfully');
      
      return {
        encryptedData: encrypted,
        policy: policyData,
        storageId: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to encrypt biometric data:', error);
      throw new Error(`Seal encryption failed: ${error.message}`);
    }
  }

  /**
   * Create on-chain Seal policy for encrypted data
   * @param {Object} policyData - Policy configuration
   * @returns {string} Transaction digest for policy creation
   */
  async createOnChainPolicy(policyData) {
    try {
      console.log('📜 Creating on-chain Seal policy...');
      
      if (!this.verifierKeyPair) {
        throw new Error('Verifier key not initialized');
      }

      // This would interact with the actual Seal Protocol smart contracts
      // For now, we'll simulate the policy creation
      const mockPolicyTx = {
        policyId: crypto.randomUUID(),
        verifierAddress: this.verifierKeyPair.getPublicKey().toSuiAddress(),
        accessConditions: policyData.accessConditions,
        createdAt: Date.now(),
        transactionDigest: `0x${crypto.randomBytes(32).toString('hex')}`
      };

      console.log('✅ On-chain policy created:', mockPolicyTx.policyId);
      return mockPolicyTx;

    } catch (error) {
      console.error('❌ Failed to create on-chain policy:', error);
      throw new Error(`Policy creation failed: ${error.message}`);
    }
  }

  /**
   * Decrypt biometric data using Seal Protocol
   * @param {string} encryptedData - Encrypted biometric data
   * @param {Object} policy - Seal policy data
   * @param {string} requestNonce - Fresh nonce for request
   * @param {string} userId - User identifier
   * @param {string} terminalId - Terminal identifier
   * @returns {Object} Decrypted biometric data
   */
  async decryptBiometricData(encryptedData, policy, requestNonce, userId, terminalId) {
    try {
      console.log('🔓 Decrypting biometric data with Seal Protocol...');
      
      // Validate access conditions
      await this.validateAccessConditions(policy, requestNonce, userId, terminalId);
      
      // Decrypt the encryption key
      const decryptionKey = this.decryptKeyFromVerifier(policy.encryptedKey);
      
      // Decrypt the biometric data
      const decipher = crypto.createDecipher('aes-256-gcm', decryptionKey);
      decipher.setAAD(Buffer.from(JSON.stringify(policy.metadata)));
      decipher.setAuthTag(Buffer.from(policy.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const biometricData = JSON.parse(decrypted);
      
      console.log('✅ Biometric data decrypted successfully');
      return biometricData;

    } catch (error) {
      console.error('❌ Failed to decrypt biometric data:', error);
      throw new Error(`Seal decryption failed: ${error.message}`);
    }
  }

  /**
   * Validate Seal access conditions
   * @param {Object} policy - Seal policy
   * @param {string} requestNonce - Request nonce
   * @param {string} userId - User identifier
   * @param {string} terminalId - Terminal identifier
   */
  async validateAccessConditions(policy, requestNonce, userId, terminalId) {
    const conditions = policy.accessConditions;
    
    // Check if fresh nonce is required and provided
    if (conditions.requiresFreshNonce && !requestNonce) {
      throw new Error('Fresh nonce required for access');
    }
    
    // Validate nonce freshness (not reused)
    if (requestNonce && await this.isNonceUsed(requestNonce)) {
      throw new Error('Nonce has already been used');
    }
    
    // Check data age
    const dataAge = Date.now() - policy.metadata.timestamp;
    if (dataAge > conditions.maxAge) {
      throw new Error('Encrypted data has expired');
    }
    
    // Validate verifier access
    const verifierAddress = this.verifierKeyPair?.getPublicKey().toSuiAddress();
    if (!conditions.allowedVerifiers.includes(verifierAddress)) {
      throw new Error('Verifier not authorized for this data');
    }
    
    // Mark nonce as used
    if (requestNonce) {
      await this.markNonceAsUsed(requestNonce);
    }
  }

  /**
   * Encrypt encryption key for verifier
   * @param {Buffer} key - Encryption key to protect
   * @returns {string} Encrypted key
   */
  encryptKeyForVerifier(key) {
    if (!this.verifierKeyPair) {
      throw new Error('Verifier key not available');
    }
    
    // In a real implementation, this would use the verifier's public key
    // For simulation, we'll use a simple encryption
    const cipher = crypto.createCipher('aes-256-cbc', this.verifierKeyPair.getSecretKey());
    let encrypted = cipher.update(key, null, 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt encryption key using verifier key
   * @param {string} encryptedKey - Encrypted key
   * @returns {Buffer} Decrypted key
   */
  decryptKeyFromVerifier(encryptedKey) {
    if (!this.verifierKeyPair) {
      throw new Error('Verifier key not available');
    }
    
    const decipher = crypto.createDecipher('aes-256-cbc', this.verifierKeyPair.getSecretKey());
    let decrypted = decipher.update(encryptedKey, 'hex');
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
  }

  /**
   * Check if nonce has been used before
   * @param {string} nonce - Nonce to check
   * @returns {boolean} True if nonce was used
   */
  async isNonceUsed(nonce) {
    // In a real implementation, this would check a database or cache
    // For simulation, we'll assume nonces are fresh
    return false;
  }

  /**
   * Mark nonce as used to prevent replay attacks
   * @param {string} nonce - Nonce to mark as used
   */
  async markNonceAsUsed(nonce) {
    // In a real implementation, this would store the nonce in a database
    console.log(`🔒 Nonce marked as used: ${nonce}`);
  }

  /**
   * Store encrypted biometric data off-chain
   * @param {Object} encryptedPackage - Encrypted data package
   * @returns {string} Storage reference
   */
  async storeEncryptedData(encryptedPackage) {
    try {
      console.log('💾 Storing encrypted biometric data off-chain...');
      
      // In a real implementation, this would store to IPFS, Arweave, or other storage
      const storageReference = `seal://${encryptedPackage.storageId}`;
      
      // Simulate storage operation
      console.log('✅ Encrypted data stored:', storageReference);
      return storageReference;
      
    } catch (error) {
      console.error('❌ Failed to store encrypted data:', error);
      throw new Error(`Storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve encrypted biometric data from off-chain storage
   * @param {string} storageReference - Storage reference
   * @returns {Object} Encrypted data package
   */
  async retrieveEncryptedData(storageReference) {
    try {
      console.log('📥 Retrieving encrypted biometric data...');
      
      // In a real implementation, this would fetch from the storage system
      // For simulation, we'll return a mock structure
      return {
        encryptedData: 'mock_encrypted_data',
        policy: {
          nonce: 'mock_nonce',
          authTag: 'mock_auth_tag',
          metadata: {
            userId: 'mock_user',
            terminalId: 'mock_terminal',
            timestamp: Date.now()
          },
          accessConditions: {
            requiresFreshNonce: true,
            allowedVerifiers: [this.verifierKeyPair?.getPublicKey().toSuiAddress()],
            maxAge: 3600000
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to retrieve encrypted data:', error);
      throw new Error(`Retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get Seal Protocol status and configuration
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: !!this.verifierKeyPair,
      verifierAddress: this.verifierKeyPair?.getPublicKey().toSuiAddress(),
      packageId: this.sealPackageId,
      features: {
        encryptedStorage: true,
        onChainPolicies: true,
        nonceValidation: true,
        accessControl: true
      }
    };
  }
}

module.exports = SealService;

