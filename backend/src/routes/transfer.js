const express = require('express');
const Joi = require('joi');
const suiService = require('../services/suiService');

const router = express.Router();

// Validation schemas
const transferSchema = Joi.object({
  fromPrivateKey: Joi.string().required().messages({
    'string.empty': 'Sender private key is required',
    'any.required': 'Sender private key is required'
  }),
  toAddress: Joi.string().required().messages({
    'string.empty': 'Recipient address is required',
    'any.required': 'Recipient address is required'
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  })
});

const transactionSchema = Joi.object({
  digest: Joi.string().required().messages({
    'string.empty': 'Transaction digest is required',
    'any.required': 'Transaction digest is required'
  })
});

/**
 * POST /api/transfer/sui
 * Transfer SUI between accounts
 */
router.post('/sui', async (req, res) => {
  try {
    // Validate request
    const { error, value } = transferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { fromPrivateKey, toAddress, amount } = value;
    
    // Execute SUI transfer
    const result = await suiService.transferSUI(fromPrivateKey, toAddress, amount);
    
    res.json({
      success: true,
      data: {
        transactionDigest: result.digest,
        status: result.status,
        gasUsed: result.gasUsed,
        amount: amount,
        recipient: toAddress,
        currency: 'SUI',
        objectChanges: result.objectChanges
      },
      message: 'SUI transfer completed successfully'
    });
  } catch (error) {
    console.error('SUI transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Transfer failed',
      message: error.message
    });
  }
});

/**
 * POST /api/transfer/usdc
 * Transfer USDC between accounts
 */
router.post('/usdc', async (req, res) => {
  try {
    // Validate request
    const { error, value } = transferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { fromPrivateKey, toAddress, amount } = value;
    
    // Execute transfer
    const result = await suiService.transferUSDC(fromPrivateKey, toAddress, amount);
    
    res.json({
      success: true,
      data: {
        transactionDigest: result.digest,
        status: result.status,
        gasUsed: result.gasUsed,
        amount: amount,
        recipient: toAddress,
        sponsored: false,
        objectChanges: result.objectChanges
      },
      message: 'USDC transfer completed successfully'
    });
  } catch (error) {
    console.error('USDC transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Transfer failed',
      message: error.message
    });
  }
});

/**
 * POST /api/transfer/transaction
 * Get transaction details
 */
router.post('/transaction', async (req, res) => {
  try {
    // Validate request
    const { error, value } = transactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { digest } = value;
    const transaction = await suiService.getTransaction(digest);
    
    res.json({
      success: true,
      data: transaction,
      message: 'Transaction details retrieved successfully'
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction details',
      message: error.message
    });
  }
});

module.exports = router;
