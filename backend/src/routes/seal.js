/**
 * Seal Protocol API Routes
 * 
 * REST API endpoints for Seal Protocol operations:
 * - Encrypt biometric data
 * - Create access policies
 * - Decrypt data with policy validation
 * - Manage nonces and access control
 */

const express = require('express');
const crypto = require('crypto');
const SealService = require('../services/sealService');
const { sealConfig } = require('../config/sealConfig');

const router = express.Router();
const sealService = new SealService();

// Middleware for request validation
const validateRequest = (req, res, next) => {
  const { userId, terminalId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }
  
  if (!terminalId) {
    return res.status(400).json({
      success: false,
      error: 'Terminal ID is required'
    });
  }
  
  next();
};

/**
 * POST /api/seal/encrypt
 * Encrypt biometric data using Seal Protocol
 */
router.post('/encrypt', validateRequest, async (req, res) => {
  try {
    const { biometricData, userId, terminalId, dataType } = req.body;
    
    if (!biometricData) {
      return res.status(400).json({
        success: false,
        error: 'Biometric data is required'
      });
    }
    
    console.log(`🔒 Encrypting ${dataType || 'biometric'} data for user ${userId}`);
    
    // Encrypt the biometric data
    const encryptedPackage = await sealService.encryptBiometricData(
      biometricData,
      userId,
      terminalId
    );
    
    // Create on-chain policy
    const policy = await sealService.createOnChainPolicy(encryptedPackage.policy);
    
    // Store encrypted data off-chain
    const storageReference = await sealService.storeEncryptedData(encryptedPackage);
    
    res.json({
      success: true,
      data: {
        storageReference,
        policyId: policy.policyId,
        policyTx: policy.transactionDigest,
        encryptedAt: encryptedPackage.createdAt,
        expiresAt: new Date(Date.now() + sealConfig.policies.defaultConditions.maxAge).toISOString()
      },
      message: 'Biometric data encrypted and stored successfully'
    });
    
  } catch (error) {
    console.error('❌ Seal encryption error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to encrypt biometric data'
    });
  }
});

/**
 * POST /api/seal/decrypt
 * Decrypt biometric data with policy validation
 */
router.post('/decrypt', validateRequest, async (req, res) => {
  try {
    const { storageReference, userId, terminalId, requestNonce } = req.body;
    
    if (!storageReference) {
      return res.status(400).json({
        success: false,
        error: 'Storage reference is required'
      });
    }
    
    if (!requestNonce) {
      return res.status(400).json({
        success: false,
        error: 'Fresh nonce is required for decryption'
      });
    }
    
    console.log(`🔓 Decrypting data from ${storageReference} for user ${userId}`);
    
    // Retrieve encrypted data
    const encryptedPackage = await sealService.retrieveEncryptedData(storageReference);
    
    // Decrypt with policy validation
    const biometricData = await sealService.decryptBiometricData(
      encryptedPackage.encryptedData,
      encryptedPackage.policy,
      requestNonce,
      userId,
      terminalId
    );
    
    res.json({
      success: true,
      data: {
        biometricData,
        decryptedAt: new Date().toISOString(),
        nonceUsed: requestNonce
      },
      message: 'Biometric data decrypted successfully'
    });
    
  } catch (error) {
    console.error('❌ Seal decryption error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to decrypt biometric data'
    });
  }
});

/**
 * POST /api/seal/generate-nonce
 * Generate a fresh nonce for secure requests
 */
router.post('/generate-nonce', (req, res) => {
  try {
    const { userId, terminalId } = req.body;
    
    if (!userId || !terminalId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Terminal ID are required'
      });
    }
    
    // Generate cryptographically secure nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + sealConfig.security.nonce.expirationTime;
    
    console.log(`🎲 Generated nonce for user ${userId} at terminal ${terminalId}`);
    
    res.json({
      success: true,
      data: {
        nonce,
        userId,
        terminalId,
        timestamp,
        expiresAt: new Date(expiresAt).toISOString(),
        validFor: sealConfig.security.nonce.expirationTime / 1000 // seconds
      },
      message: 'Fresh nonce generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Nonce generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce'
    });
  }
});

/**
 * GET /api/seal/policy/:policyId
 * Get policy information
 */
router.get('/policy/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    
    // In a real implementation, this would fetch from blockchain
    const mockPolicy = {
      policyId,
      verifierAddress: sealService.verifierKeyPair?.getPublicKey().toSuiAddress(),
      accessConditions: sealConfig.policies.defaultConditions,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    res.json({
      success: true,
      data: mockPolicy,
      message: 'Policy retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Policy retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve policy'
    });
  }
});

/**
 * POST /api/seal/validate-access
 * Validate access conditions without decryption
 */
router.post('/validate-access', validateRequest, async (req, res) => {
  try {
    const { storageReference, requestNonce, userId, terminalId } = req.body;
    
    if (!storageReference || !requestNonce) {
      return res.status(400).json({
        success: false,
        error: 'Storage reference and nonce are required'
      });
    }
    
    // Retrieve policy data
    const encryptedPackage = await sealService.retrieveEncryptedData(storageReference);
    
    // Validate access conditions
    await sealService.validateAccessConditions(
      encryptedPackage.policy,
      requestNonce,
      userId,
      terminalId
    );
    
    res.json({
      success: true,
      data: {
        accessGranted: true,
        validatedAt: new Date().toISOString(),
        nonceValid: true,
        policyCompliant: true
      },
      message: 'Access validation successful'
    });
    
  } catch (error) {
    console.error('❌ Access validation error:', error);
    res.status(403).json({
      success: false,
      error: error.message || 'Access validation failed',
      data: {
        accessGranted: false,
        reason: error.message
      }
    });
  }
});

/**
 * GET /api/seal/status
 * Get Seal Protocol service status
 */
router.get('/status', (req, res) => {
  try {
    const status = sealService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        configuration: {
          encryptionAlgorithm: sealConfig.encryption.algorithm,
          keySize: sealConfig.encryption.keySize,
          nonceExpiration: sealConfig.security.nonce.expirationTime,
          policyMaxAge: sealConfig.policies.defaultConditions.maxAge
        },
        health: {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        }
      },
      message: 'Seal Protocol service is operational'
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

/**
 * POST /api/seal/revoke-policy
 * Revoke a Seal policy (emergency use)
 */
router.post('/revoke-policy', async (req, res) => {
  try {
    const { policyId, reason } = req.body;
    
    if (!policyId) {
      return res.status(400).json({
        success: false,
        error: 'Policy ID is required'
      });
    }
    
    console.log(`🚫 Revoking policy ${policyId}: ${reason || 'No reason provided'}`);
    
    // In a real implementation, this would update the on-chain policy
    const revocationTx = `0x${crypto.randomBytes(32).toString('hex')}`;
    
    res.json({
      success: true,
      data: {
        policyId,
        revoked: true,
        revokedAt: new Date().toISOString(),
        reason: reason || 'Manual revocation',
        transactionDigest: revocationTx
      },
      message: 'Policy revoked successfully'
    });
    
  } catch (error) {
    console.error('❌ Policy revocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke policy'
    });
  }
});

module.exports = router;

