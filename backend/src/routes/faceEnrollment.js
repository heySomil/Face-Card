const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const faceEnrollmentService = require('../services/faceEnrollmentService');
const walrusService = require('../services/walrusService');
const mockFaceService = require('../services/mockFaceService');

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
const checkEnrollmentSchema = Joi.object({
  walletAddress: Joi.string().required().pattern(/^0x[a-fA-F0-9]+$/),
  userName: Joi.string().required().min(1).max(100),
  userEmail: Joi.string().email().required()
});

const enrollFaceSchema = Joi.object({
  walletAddress: Joi.string().required().pattern(/^0x[a-fA-F0-9]+$/),
  userName: Joi.string().required().min(1).max(100),
  userEmail: Joi.string().email().required()
});

/**
 * POST /api/face/check-enrollment
 * Check if a wallet address is already enrolled for face recognition
 */
router.post('/check-enrollment', async (req, res) => {
  try {
    const { error, value } = checkEnrollmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { walletAddress, userName, userEmail } = value;
    
    console.log(`🔍 Checking enrollment for wallet: ${walletAddress}`);
    
    const result = await faceEnrollmentService.checkEnrollmentStatus(walletAddress, userName);
    
    res.json({
      success: result.success,
      data: {
        ...result.data,
        userEmail // Include email in response
      },
      message: result.success 
        ? (result.data.isEnrolled ? 'User is enrolled' : 'User is not enrolled')
        : 'Failed to check enrollment status',
      error: result.error || null
    });

  } catch (error) {
    console.error('Check enrollment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/face/enroll
 * Enroll a user's face for recognition
 * Expects multipart/form-data with photo file and user data
 */
router.post('/enroll', upload.single('photo'), async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Photo file is required'
      });
    }

    // Validate form data
    const { error, value } = enrollFaceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { walletAddress, userName, userEmail } = value;
    
    console.log(`🎭 Starting face enrollment for wallet: ${walletAddress}`);
    console.log(`📸 Photo info: ${req.file.mimetype}, ${req.file.size} bytes`);

    // Prepare enrollment data
    const enrollmentData = {
      walletAddress,
      userName,
      userEmail,
      photoBuffer: req.file.buffer,
      photoMimeType: req.file.mimetype
    };

    const result = await faceEnrollmentService.enrollFace(enrollmentData);
    
    const statusCode = result.success ? 200 : 400;
    
    res.status(statusCode).json({
      success: result.success,
      data: result.data,
      message: result.success 
        ? 'Face enrolled successfully'
        : `Enrollment failed: ${result.error}`,
      error: result.error || null
    });

  } catch (error) {
    console.error('Face enrollment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/face/recognize
 * Recognize a face from uploaded photo
 */
router.post('/recognize', upload.single('photo'), async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Photo file is required'
      });
    }

    console.log(`🔍 Starting face recognition`);
    console.log(`📸 Photo info: ${req.file.mimetype}, ${req.file.size} bytes`);

    const result = await faceEnrollmentService.recognizeFace(req.file.buffer, req.file.mimetype);
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success 
        ? (result.data.recognized ? 'Face recognized successfully' : 'No matching face found')
        : `Recognition failed: ${result.error}`,
      error: result.error || null
    });

  } catch (error) {
    console.error('Face recognition error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/face/enrolled-persons
 * Get list of all enrolled persons
 */
router.get('/enrolled-persons', async (req, res) => {
  try {
    console.log('📋 Fetching enrolled persons list');
    
    const result = await faceEnrollmentService.getEnrolledPersons();
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success 
        ? `Found ${result.data.payWiserPersons} enrolled persons`
        : 'Failed to fetch enrolled persons',
      error: result.error || null
    });

  } catch (error) {
    console.error('Get enrolled persons error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/face/person/:uuid
 * Delete a person from the face recognition database
 */
router.delete('/person/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    if (!uuid) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Person UUID is required'
      });
    }

    console.log(`🗑️ Deleting person: ${uuid}`);
    
    const result = await faceEnrollmentService.deletePerson(uuid);
    
    const statusCode = result.success ? 200 : 400;
    
    res.status(statusCode).json({
      success: result.success,
      data: result.data,
      message: result.success 
        ? 'Person deleted successfully'
        : `Deletion failed: ${result.error}`,
      error: result.error || null
    });

  } catch (error) {
    console.error('Delete person error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});


/**
 * GET /api/face/walrus-status
 * Check Walrus service status (for debugging)
 */
router.get('/walrus-status', async (req, res) => {
  try {
    const isAvailable = await walrusService.checkWalrusAvailability();
    const networkStatus = await walrusService.getNetworkStatus();
    
    res.json({
      success: true,
      data: {
        walrusAvailable: isAvailable,
        networkStatus,
        timestamp: new Date().toISOString()
      },
      message: 'Walrus status retrieved'
    });

  } catch (error) {
    console.error('Walrus status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Photo file size must be less than 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Only one photo file is allowed'
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

// Demo route to enable mock service and enroll a demo face
router.post('/demo/setup', async (req, res) => {
  try {
    console.log('🎭 Setting up demo face recognition...');
    
    // Enable mock service
    faceEnrollmentService.enableMockService();
    
    // Enroll a demo face
    const demoFaceData = 'demo_face_data_' + Date.now();
    const demoUserInfo = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      userName: 'Demo User',
      userEmail: 'demo@example.com'
    };
    
    const enrollmentResult = await mockFaceService.enrollFace(demoFaceData, demoUserInfo);
    
    res.json({
      success: true,
      message: 'Demo face recognition setup complete',
      data: {
        mockServiceEnabled: true,
        demoFaceEnrolled: enrollmentResult.success,
        faceId: enrollmentResult.faceId
      }
    });
    
  } catch (error) {
    console.error('❌ Demo setup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route to get mock service status
router.get('/demo/status', async (req, res) => {
  try {
    const enrolledFaces = mockFaceService.getAllEnrolledFaces();
    
    res.json({
      success: true,
      data: {
        mockServiceEnabled: faceEnrollmentService.useMockService,
        enrolledFacesCount: enrolledFaces.length,
        enrolledFaces: enrolledFaces
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get demo status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
