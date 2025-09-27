/**
 * Seal Protocol Configuration
 * 
 * Configuration settings for Seal Protocol integration
 * including encryption parameters, policy settings, and security options
 */

const sealConfig = {
  // Protocol Configuration
  protocol: {
    version: '1.0',
    packageId: process.env.SEAL_PACKAGE_ID || '0x...', // Seal Protocol package on Sui
    network: process.env.NETWORK || 'testnet',
    rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'
  },

  // Encryption Settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keySize: 32, // 256 bits
    nonceSize: 16, // 128 bits
    tagSize: 16, // 128 bits
    keyDerivation: {
      iterations: 100000,
      saltSize: 32,
      algorithm: 'pbkdf2'
    }
  },

  // Policy Configuration
  policies: {
    // Default access conditions
    defaultConditions: {
      requiresFreshNonce: true,
      maxAge: 3600000, // 1 hour in milliseconds
      maxDecryptionAttempts: 3,
      requireVerifierSignature: true
    },
    
    // Biometric data specific policies
    biometricData: {
      faceEmbeddings: {
        maxAge: 7200000, // 2 hours
        encryptionLevel: 'high',
        requiresUserConsent: true
      },
      voiceEmbeddings: {
        maxAge: 3600000, // 1 hour
        encryptionLevel: 'high',
        requiresUserConsent: true
      }
    },

    // Terminal/Merchant specific policies
    terminalAccess: {
      allowedTerminals: process.env.ALLOWED_TERMINALS?.split(',') || [],
      requireTerminalAuth: true,
      maxSessionDuration: 1800000 // 30 minutes
    }
  },

  // Storage Configuration
  storage: {
    // Off-chain storage options
    provider: process.env.SEAL_STORAGE_PROVIDER || 'ipfs', // ipfs, arweave, s3
    
    ipfs: {
      gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
      pinningService: process.env.IPFS_PINNING_SERVICE || 'pinata',
      apiKey: process.env.IPFS_API_KEY,
      secretKey: process.env.IPFS_SECRET_KEY
    },
    
    arweave: {
      gateway: process.env.ARWEAVE_GATEWAY || 'https://arweave.net',
      wallet: process.env.ARWEAVE_WALLET_PATH,
      minConfirmations: 5
    },

    // Backup storage
    enableBackup: true,
    backupProvider: 'arweave',
    backupInterval: 86400000 // 24 hours
  },

  // Security Settings
  security: {
    // Nonce management
    nonce: {
      expirationTime: 300000, // 5 minutes
      maxReuse: 0, // Never reuse nonces
      storageType: 'redis', // redis, memory, database
    },

    // Key management
    keys: {
      rotationInterval: 2592000000, // 30 days
      backupEncryption: true,
      hardwareSecurityModule: process.env.HSM_ENABLED === 'true'
    },

    // Access logging
    logging: {
      logAccess: true,
      logDecryption: true,
      logPolicyViolations: true,
      retentionPeriod: 2592000000 // 30 days
    }
  },

  // Performance Settings
  performance: {
    // Caching
    cache: {
      enabled: true,
      provider: 'redis',
      ttl: 300, // 5 minutes
      maxSize: '100MB'
    },

    // Rate limiting
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 900000, // 15 minutes
      skipSuccessfulRequests: false
    }
  },

  // Monitoring and Alerts
  monitoring: {
    enabled: true,
    metrics: {
      encryptionLatency: true,
      decryptionLatency: true,
      policyViolations: true,
      storageErrors: true
    },
    
    alerts: {
      email: process.env.ALERT_EMAIL,
      webhook: process.env.ALERT_WEBHOOK,
      thresholds: {
        errorRate: 0.05, // 5%
        latency: 1000, // 1 second
        storageFailures: 3
      }
    }
  },

  // Development Settings
  development: {
    mockMode: process.env.NODE_ENV !== 'production',
    debugLogging: process.env.DEBUG_SEAL === 'true',
    skipPolicyValidation: process.env.SKIP_POLICY_VALIDATION === 'true',
    allowInsecureConnections: process.env.ALLOW_INSECURE === 'true'
  }
};

// Validation function
function validateConfig() {
  const errors = [];

  // Check required environment variables
  if (!process.env.SEAL_VERIFIER_PRIVATE_KEY && process.env.NODE_ENV === 'production') {
    errors.push('SEAL_VERIFIER_PRIVATE_KEY is required in production');
  }

  if (!process.env.SEAL_PACKAGE_ID && process.env.NODE_ENV === 'production') {
    errors.push('SEAL_PACKAGE_ID is required in production');
  }

  // Validate encryption settings
  if (sealConfig.encryption.keySize < 16) {
    errors.push('Encryption key size must be at least 16 bytes');
  }

  // Validate policy settings
  if (sealConfig.policies.defaultConditions.maxAge < 60000) {
    errors.push('Policy max age must be at least 1 minute');
  }

  if (errors.length > 0) {
    throw new Error(`Seal configuration validation failed:\n${errors.join('\n')}`);
  }

  console.log('✅ Seal configuration validated successfully');
}

// Export configuration and validation
module.exports = {
  sealConfig,
  validateConfig
};

