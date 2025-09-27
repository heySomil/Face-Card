// backend/src/server.js
// Updated server.js with Yellow Network integration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const walletRoutes = require('./routes/wallet');
const transferRoutes = require('./routes/transfer');
const sponsorRoutes = require('./routes/sponsor');
const faceEnrollmentRoutes = require('./routes/faceEnrollment');
const sealRoutes = require('./routes/seal');
const yellowNetworkRoutes = require('./routes/yellowNetworkRoutes');
const realBiometricRoutes = require('./routes/realBiometricRoutes');
const faceImageRoutes = require('./routes/faceImageRoutes'); // ADD THIS LINE
const { initializeYellowNetwork } = require('./services/yellowNetworkService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initializeYellowNetwork()
  .then(() => {
    console.log('🟡 Yellow Network auto-initialized on startup');
  })
  .catch((error) => {
    console.error('⚠️ Yellow Network auto-initialization failed:', error.message);
    console.error('Yellow Network features will be initialized on first API call');
  });

// Routes
app.use('/api/wallet', walletRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/sponsor', sponsorRoutes);
app.use('/api/face', faceEnrollmentRoutes);
app.use('/api/seal', sealRoutes);
app.use('/api/yellow', yellowNetworkRoutes);
app.use('/api/real-biometric', realBiometricRoutes);
app.use('/api/face-images', faceImageRoutes); // ADD THIS LINE

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    network: process.env.SUI_NETWORK || 'testnet',
    yellowNetwork: process.env.YELLOW_CLEARNODE_URL ? 'enabled' : 'disabled' // ADD THIS LINE
  });
});

// Yellow Network test endpoint // ADD THIS BLOCK
app.get('/api/test-yellow', (req, res) => {
  res.json({
    message: 'Yellow Network integration active!',
    hackathon: 'Yellow Network Hackathon 2025',
    status: 'ready',
    protocol: 'Nitrolite (ERC-7824)',
    features: [
      'State Channels',
      'Gasless Transactions',
      'Cross-chain Rewards',
      'Biometric Payments',
      'Real-time Processing'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PayWiser Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🟡 Yellow Network: http://localhost:${PORT}/api/yellow/health`); // ADD THIS LINE
  console.log(`🟡 Yellow Test: http://localhost:${PORT}/api/test-yellow`); // ADD THIS LINE
});