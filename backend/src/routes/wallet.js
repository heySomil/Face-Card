const express = require('express');
const Joi = require('joi');
const suiService = require('../services/suiService');

const router = express.Router();

// Validation schemas
const addressSchema = Joi.object({
  address: Joi.string().required().messages({
    'string.empty': 'Address is required',
    'any.required': 'Address is required'
  })
});

/**
 * POST /api/wallet/create
 * Create a new wallet
 */
router.post('/create', async (req, res) => {
  try {
    const wallet = suiService.createWallet();
    
    res.json({
      success: true,
      data: {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey
      },
      message: 'Wallet created successfully'
    });
  } catch (error) {
    console.error('Create wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create wallet',
      message: error.message
    });
  }
});

/**
 * POST /api/wallet/balance
 * Get wallet balance
 */
router.post('/balance', async (req, res) => {
  try {
    // Validate request
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { address } = value;
    const balance = await suiService.getBalance(address);
    
    res.json({
      success: true,
      data: {
        address,
        balances: balance
      },
      message: 'Balance retrieved successfully'
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balance',
      message: error.message
    });
  }
});

/**
 * POST /api/wallet/faucet
 * Request test tokens from faucet (testnet only)
 */
router.post('/faucet', async (req, res) => {
  try {
    // Validate request
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { address } = value;
    const result = await suiService.requestTestTokens(address);
    
    res.json({
      success: true,
      data: result,
      message: 'Test tokens requested successfully'
    });
  } catch (error) {
    console.error('Faucet request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request test tokens',
      message: error.message
    });
  }
});

module.exports = router;

