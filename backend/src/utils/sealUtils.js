/**
 * Seal Protocol Utility Functions
 * 
 * Helper functions for Seal Protocol operations including:
 * - Biometric data preprocessing
 * - Policy validation helpers
 * - Encryption/decryption utilities
 * - Nonce management
 */

const crypto = require('crypto');
const { sealConfig } = require('../config/sealConfig');

/**
 * Biometric Data Processing Utilities
 */
class BiometricUtils {
  /**
   * Normalize face embeddings for consistent encryption
   * @param {Array} embeddings - Face embedding vector
   * @returns {Object} Normalized embedding data
   */
  static normalizeFaceEmbeddings(embeddings) {
    if (!Array.isArray(embeddings)) {
      throw new Error('Face embeddings must be an array');
    }
    
    // Normalize to unit vector
    const magnitude = Math.sqrt(embeddings.reduce((sum, val) => sum + val * val, 0));
    const normalized = embeddings.map(val => val / magnitude);
    
    return {
      vector: normalized,
      dimension: normalized.length,
      magnitude: magnitude,
      checksum: crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex').substring(0, 16)
    };
  }

  /**
   * Validate biometric data structure
   * @param {Object} biometricData - Biometric data to validate
   * @returns {boolean} True if valid
   */
  static validateBiometricData(biometricData) {
    const required = ['type', 'data', 'timestamp', 'quality'];
    
    for (const field of required) {
      if (!biometricData.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate data types
    if (biometricData.type === 'face') {
      if (!Array.isArray(biometricData.data.embeddings)) {
        throw new Error('Face data must include embeddings array');
      }
      
      if (biometricData.data.embeddings.length < 128) {
        throw new Error('Face embeddings vector too small');
      }
    }
    
    // Validate quality score
    if (biometricData.quality < 0.5) {
      throw new Error('Biometric data quality too low for encryption');
    }
    
    return true;
  }

  /**
   * Generate biometric data hash for integrity verification
   * @param {Object} biometricData - Biometric data
   * @returns {string} SHA-256 hash
   */
  static generateDataHash(biometricData) {
    const dataString = JSON.stringify(biometricData, Object.keys(biometricData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
}

/**
 * Policy Management Utilities
 */
class PolicyUtils {
  /**
   * Create access policy from conditions
   * @param {Object} conditions - Access conditions
   * @param {string} userId - User identifier
   * @param {string} terminalId - Terminal identifier
   * @returns {Object} Policy object
   */
  static createAccessPolicy(conditions, userId, terminalId) {
    const defaultConditions = sealConfig.policies.defaultConditions;
    
    return {
      id: crypto.randomUUID(),
      userId,
      terminalId,
      conditions: {
        ...defaultConditions,
        ...conditions
      },
      createdAt: Date.now(),
      version: '1.0',
      signature: PolicyUtils.signPolicy({ userId, terminalId, conditions })
    };
  }

  /**
   * Sign policy data for integrity
   * @param {Object} policyData - Policy data to sign
   * @returns {string} Policy signature
   */
  static signPolicy(policyData) {
    const dataString = JSON.stringify(policyData, Object.keys(policyData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Verify policy signature
   * @param {Object} policy - Policy to verify
   * @returns {boolean} True if signature is valid
   */
  static verifyPolicySignature(policy) {
    const { signature, ...policyData } = policy;
    const expectedSignature = PolicyUtils.signPolicy(policyData);
    return signature === expectedSignature;
  }

  /**
   * Check if policy has expired
   * @param {Object} policy - Policy to check
   * @returns {boolean} True if expired
   */
  static isPolicyExpired(policy) {
    const age = Date.now() - policy.createdAt;
    return age > policy.conditions.maxAge;
  }

  /**
   * Validate access conditions
   * @param {Object} policy - Policy with conditions
   * @param {Object} request - Access request
   * @returns {Object} Validation result
   */
  static validateAccessConditions(policy, request) {
    const violations = [];
    
    // Check policy expiration
    if (PolicyUtils.isPolicyExpired(policy)) {
      violations.push('Policy has expired');
    }
    
    // Check nonce requirement
    if (policy.conditions.requiresFreshNonce && !request.nonce) {
      violations.push('Fresh nonce required');
    }
    
    // Check verifier authorization
    if (policy.conditions.requireVerifierSignature && !request.verifierSignature) {
      violations.push('Verifier signature required');
    }
    
    // Check user/terminal match
    if (policy.userId !== request.userId) {
      violations.push('User ID mismatch');
    }
    
    if (policy.terminalId !== request.terminalId) {
      violations.push('Terminal ID mismatch');
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
}

/**
 * Encryption Utilities
 */
class EncryptionUtils {
  /**
   * Generate encryption key from password and salt
   * @param {string} password - Password/passphrase
   * @param {Buffer} salt - Salt for key derivation
   * @returns {Buffer} Derived key
   */
  static deriveKey(password, salt) {
    const config = sealConfig.encryption.keyDerivation;
    return crypto.pbkdf2Sync(password, salt, config.iterations, sealConfig.encryption.keySize, 'sha256');
  }

  /**
   * Encrypt data with AES-GCM
   * @param {string} data - Data to encrypt
   * @param {Buffer} key - Encryption key
   * @param {Buffer} nonce - Nonce for encryption
   * @returns {Object} Encrypted data package
   */
  static encryptData(data, key, nonce) {
    const cipher = crypto.createCipherGCM('aes-256-gcm', key, nonce);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      authTag: authTag.toString('hex'),
      nonce: nonce.toString('hex')
    };
  }

  /**
   * Decrypt data with AES-GCM
   * @param {Object} encryptedPackage - Encrypted data package
   * @param {Buffer} key - Decryption key
   * @returns {string} Decrypted data
   */
  static decryptData(encryptedPackage, key) {
    const { encrypted, authTag, nonce } = encryptedPackage;
    
    const decipher = crypto.createDecipherGCM('aes-256-gcm', key, Buffer.from(nonce, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate secure random bytes
   * @param {number} size - Number of bytes to generate
   * @returns {Buffer} Random bytes
   */
  static generateRandomBytes(size) {
    return crypto.randomBytes(size);
  }

  /**
   * Hash data with SHA-256
   * @param {string} data - Data to hash
   * @returns {string} Hex-encoded hash
   */
  static hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Nonce Management Utilities
 */
class NonceUtils {
  static usedNonces = new Map(); // In-memory storage for demo

  /**
   * Generate a fresh nonce
   * @param {string} context - Context for nonce (userId + terminalId)
   * @returns {string} Generated nonce
   */
  static generateNonce(context = '') {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const contextHash = crypto.createHash('sha256').update(context).digest('hex').substring(0, 8);
    
    return `${timestamp}-${contextHash}-${randomBytes}`;
  }

  /**
   * Validate nonce format and freshness
   * @param {string} nonce - Nonce to validate
   * @returns {Object} Validation result
   */
  static validateNonce(nonce) {
    try {
      const parts = nonce.split('-');
      if (parts.length !== 3) {
        return { valid: false, reason: 'Invalid nonce format' };
      }
      
      const timestamp = parseInt(parts[0]);
      const age = Date.now() - timestamp;
      
      if (age > sealConfig.security.nonce.expirationTime) {
        return { valid: false, reason: 'Nonce expired' };
      }
      
      if (NonceUtils.isNonceUsed(nonce)) {
        return { valid: false, reason: 'Nonce already used' };
      }
      
      return { valid: true, age };
      
    } catch (error) {
      return { valid: false, reason: 'Nonce validation error' };
    }
  }

  /**
   * Check if nonce has been used
   * @param {string} nonce - Nonce to check
   * @returns {boolean} True if used
   */
  static isNonceUsed(nonce) {
    return NonceUtils.usedNonces.has(nonce);
  }

  /**
   * Mark nonce as used
   * @param {string} nonce - Nonce to mark
   */
  static markNonceAsUsed(nonce) {
    const expiration = Date.now() + sealConfig.security.nonce.expirationTime;
    NonceUtils.usedNonces.set(nonce, expiration);
    
    // Clean up expired nonces
    NonceUtils.cleanupExpiredNonces();
  }

  /**
   * Clean up expired nonces from memory
   */
  static cleanupExpiredNonces() {
    const now = Date.now();
    for (const [nonce, expiration] of NonceUtils.usedNonces.entries()) {
      if (expiration < now) {
        NonceUtils.usedNonces.delete(nonce);
      }
    }
  }
}

/**
 * Storage Utilities
 */
class StorageUtils {
  /**
   * Generate storage reference
   * @param {string} storageId - Unique storage identifier
   * @param {string} provider - Storage provider
   * @returns {string} Storage reference URI
   */
  static generateStorageReference(storageId, provider = 'ipfs') {
    return `seal://${provider}/${storageId}`;
  }

  /**
   * Parse storage reference
   * @param {string} reference - Storage reference URI
   * @returns {Object} Parsed reference
   */
  static parseStorageReference(reference) {
    const match = reference.match(/^seal:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
      throw new Error('Invalid storage reference format');
    }
    
    return {
      protocol: 'seal',
      provider: match[1],
      storageId: match[2]
    };
  }

  /**
   * Validate storage reference format
   * @param {string} reference - Storage reference to validate
   * @returns {boolean} True if valid
   */
  static isValidStorageReference(reference) {
    try {
      StorageUtils.parseStorageReference(reference);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = {
  BiometricUtils,
  PolicyUtils,
  EncryptionUtils,
  NonceUtils,
  StorageUtils
};

