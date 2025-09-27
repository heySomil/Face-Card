/**
 * Real Biometric Payment Routes
 * Handles real facial recognition and actual Yellow Network transactions
 */

const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const realBiometricService = require('../services/realBiometricService');
const { getYellowNetworkService } = require('../services/yellowNetworkService');

const router = express.Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation schemas
const enrollmentSchema = Joi.object({
  walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  userName: Joi.string().min(1).max(100).required(),
  userEmail: Joi.string().email().required()
});

const paymentSchema = Joi.object({
  customerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  merchantAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
  amount: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).required(),
  currency: Joi.string().valid('USDC', 'SUI').default('USDC'),
  merchantName: Joi.string().min(1).max(100).required()
});

// Middleware to require Yellow Network service
const requireYellowNetwork = (req, res, next) => {
  try {
    const yellowNetworkService = getYellowNetworkService();
    if (!yellowNetworkService.isAuthenticated) {
      return res.status(503).json({
        success: false,
        error: 'Yellow Network service not available',
        message: 'Please try again later'
      });
    }
    req.yellowNetworkService = yellowNetworkService;
    next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      error: 'Yellow Network service not initialized',
      message: 'Please try again later'
    });
  }
};

/**
 * POST /api/real-biometric/enroll
 * Enroll a user's face for real biometric payments
 */
router.post('/enroll', upload.single('faceImage'), async (req, res) => {
  try {
    console.log('🔐 Real biometric enrollment request received');

    // Validate request body
    const { error: validationError, value: validatedData } = enrollmentSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: validationError.details[0].message
      });
    }

    // Check if face image is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Missing face image',
        message: 'Please provide a face image for enrollment'
      });
    }

    // Enroll the face
    const enrollmentResult = await realBiometricService.enrollFace(
      req.file.buffer,
      validatedData
    );

    res.json({
      success: true,
      message: 'Face enrolled successfully for real biometric payments',
      data: enrollmentResult
    });

  } catch (error) {
    console.error('❌ Real biometric enrollment failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Face enrollment failed'
    });
  }
});

/**
 * POST /api/real-biometric/recognize
 * Recognize a face for payment verification
 */
router.post('/recognize', upload.single('faceImage'), async (req, res) => {
  try {
    console.log('🔐 Real biometric recognition request received');

    // Validate request body
    const { walletAddress } = req.body;
    if (!walletAddress || !/^0x[a-fA-F0-9]{64}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        message: 'Please provide a valid 64-character hex wallet address'
      });
    }

    // Check if face image is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Missing face image',
        message: 'Please provide a face image for recognition'
      });
    }

    // Recognize the face
    const recognitionResult = await realBiometricService.recognizeFace(
      req.file.buffer,
      walletAddress
    );

    res.json({
      success: true,
      message: 'Face recognized successfully',
      data: recognitionResult
    });

  } catch (error) {
    console.error('❌ Real biometric recognition failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Face recognition failed'
    });
  }
});

/**
 * POST /api/real-biometric/payment
 * Process a real biometric payment with actual Yellow Network transaction
 */
router.post('/payment', upload.single('faceImage'), requireYellowNetwork, async (req, res) => {
  try {
    console.log('🔐 Real biometric payment request received');

    // Validate request body
    const { error: validationError, value: validatedData } = paymentSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: validationError.details[0].message
      });
    }

    // Check if face image is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Missing face image',
        message: 'Please provide a face image for payment verification'
      });
    }

    // Process real biometric payment
    const paymentResult = await realBiometricService.processRealBiometricPayment(
      validatedData,
      req.file.buffer
    );

    res.json({
      success: true,
      message: 'Real biometric payment processed successfully',
      data: paymentResult
    });

  } catch (error) {
    console.error('❌ Real biometric payment failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Real biometric payment failed'
    });
  }
});

/**
 * GET /api/real-biometric/status/:walletAddress
 * Check enrollment status for real biometric payments
 */
router.get('/status/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress || !/^0x[a-fA-F0-9]{64}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
        message: 'Please provide a valid 64-character hex wallet address'
      });
    }

    const statusResult = await realBiometricService.checkEnrollmentStatus(walletAddress);

    res.json({
      success: true,
      data: statusResult
    });

  } catch (error) {
    console.error('❌ Failed to check real biometric status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check enrollment status'
    });
  }
});

/**
 * GET /api/real-biometric/enrolled
 * Get all enrolled users (for debugging)
 */
router.get('/enrolled', async (req, res) => {
  try {
    const enrolledUsers = realBiometricService.getAllEnrolledUsers();

    res.json({
      success: true,
      data: {
        count: enrolledUsers.length,
        users: enrolledUsers.map(user => ({
          id: user.id,
          walletAddress: user.userInfo.walletAddress,
          userName: user.userInfo.userName,
          enrolledAt: user.enrolledAt,
          quality: user.quality,
          confidence: user.confidence,
          isActive: user.isActive
        }))
      }
    });

  } catch (error) {
    console.error('❌ Failed to get enrolled users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get enrolled users'
    });
  }
});

/**
 * DELETE /api/real-biometric/clear
 * Clear all enrollments (for testing)
 */
router.delete('/clear', async (req, res) => {
  try {
    realBiometricService.clearAllEnrollments();

    res.json({
      success: true,
      message: 'All real biometric enrollments cleared'
    });

  } catch (error) {
    console.error('❌ Failed to clear enrollments:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to clear enrollments'
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: 'Only image files (jpg, png, gif, etc.) are allowed'
    });
  }
  
  next(error);
});

module.exports = router;
