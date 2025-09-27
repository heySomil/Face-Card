const express = require('express');
const Joi = require('joi');
const suiService = require('../services/suiService');

const router = express.Router();

// Validation schemas
const sponsoredTransferSchema = Joi.object({
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

/**
 * POST /api/sponsor/transfer-usdc
 * Transfer USDC with gas sponsorship
 */
router.post('/transfer-usdc', async (req, res) => {
  try {
    // Validate request
    const { error, value } = sponsoredTransferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { fromPrivateKey, toAddress, amount } = value;
    
    // Execute sponsored transfer
    const result = await suiService.transferUSDCWithSponsorship(fromPrivateKey, toAddress, amount);
    
    res.json({
      success: true,
      data: {
        transactionDigest: result.digest,
        status: result.status,
        gasUsed: result.gasUsed,
        amount: amount,
        recipient: toAddress,
        sponsored: true,
        sponsor: result.sponsor,
        objectChanges: result.objectChanges
      },
      message: 'Sponsored USDC transfer completed successfully'
    });
  } catch (error) {
    console.error('Sponsored transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Sponsored transfer failed',
      message: error.message
    });
  }
});

/**
 * GET /api/sponsor/info
 * Get sponsor account information
 */
router.get('/info', async (req, res) => {
  try {
    if (!suiService.gasSponsorKeypair) {
      return res.status(404).json({
        success: false,
        error: 'Gas sponsor not configured',
        message: 'Gas sponsor account is not set up'
      });
    }

    const sponsorAddress = suiService.gasSponsorKeypair.getPublicKey().toSuiAddress();
    const balance = await suiService.getBalance(sponsorAddress);
    
    res.json({
      success: true,
      data: {
        sponsorAddress,
        balances: balance,
        network: suiService.network
      },
      message: 'Sponsor information retrieved successfully'
    });
  } catch (error) {
    console.error('Get sponsor info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sponsor information',
      message: error.message
    });
  }
});

module.exports = router;

