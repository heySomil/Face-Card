const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/face-images');
    // Create directory if it doesn't exist
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      cb(null, uploadDir);
    }).catch(err => {
      cb(err, null);
    });
  },
  filename: (req, file, cb) => {
    const walletAddress = req.body.walletAddress || 'unknown';
    const timestamp = Date.now();
    const filename = `${walletAddress}_${timestamp}.jpg`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Store face image for a user
router.post('/store', upload.single('faceImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const { walletAddress, userName } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const imageData = {
      walletAddress,
      userName: userName || 'Unknown User',
      imagePath: req.file.path,
      imageUrl: `/api/face-images/get/${req.file.filename}`,
      filename: req.file.filename,
      uploadedAt: new Date().toISOString()
    };

    // Store image metadata in a simple JSON file
    const metadataPath = path.join(__dirname, '../../uploads/face-images/metadata.json');
    let metadata = {};
    
    try {
      const existingData = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(existingData);
    } catch (err) {
      // File doesn't exist, start with empty object
    }

    metadata[walletAddress] = imageData;
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('✅ Face image stored successfully:', {
      walletAddress,
      filename: req.file.filename,
      imageUrl: imageData.imageUrl
    });

    res.json({
      success: true,
      data: {
        imageUrl: imageData.imageUrl,
        filename: req.file.filename,
        uploadedAt: imageData.uploadedAt
      }
    });

  } catch (error) {
    console.error('❌ Error storing face image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store face image'
    });
  }
});

// Get face image for a user
router.get('/get/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../uploads/face-images', filename);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch (err) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the image file
    res.sendFile(imagePath);

  } catch (error) {
    console.error('❌ Error retrieving face image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve face image'
    });
  }
});

// Get face image metadata for a user
router.get('/metadata/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const metadataPath = path.join(__dirname, '../../uploads/face-images/metadata.json');
    
    let metadata = {};
    try {
      const data = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(data);
    } catch (err) {
      return res.json({
        success: true,
        data: null
      });
    }

    const userImageData = metadata[walletAddress] || null;

    res.json({
      success: true,
      data: userImageData
    });

  } catch (error) {
    console.error('❌ Error retrieving face image metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve face image metadata'
    });
  }
});

// Get all face images (for merchant to see all enrolled users)
router.get('/all', async (req, res) => {
  try {
    const metadataPath = path.join(__dirname, '../../uploads/face-images/metadata.json');
    
    let metadata = {};
    try {
      const data = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(data);
    } catch (err) {
      return res.json({
        success: true,
        data: []
      });
    }

    const allImages = Object.values(metadata);

    res.json({
      success: true,
      data: allImages
    });

  } catch (error) {
    console.error('❌ Error retrieving all face images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve face images'
    });
  }
});

module.exports = router;
