// backend/src/routes/yellowNetworkRoutes.js
// REAL Yellow Network API Routes

const express = require('express');
const { getYellowNetworkService } = require('../services/yellowNetworkService');

const router = express.Router();

// FIXED: Middleware that doesn't reinitialize the service and checks connection/auth
async function requireYellowNetwork(req, res, next) {
  try {
    const service = getYellowNetworkService();

    if (!service) {
      return res.status(500).json({
        success: false,
        error: 'Yellow Network service not initialized',
        details: 'Service not found'
      });
    }

    const status = service.getStatus();
    if (!status.connected) {
      return res.status(500).json({
        success: false,
        error: 'Yellow Network not connected',
        details: 'WebSocket connection lost',
        suggestions: ['Restart backend to reconnect', 'Check network connectivity']
      });
    }

    if (!status.authenticated) {
      return res.status(500).json({
        success: false,
        error: 'Yellow Network not authenticated',
        details: 'Authentication lost, connection may have dropped',
        suggestions: ['Restart backend to re-authenticate', 'Check WebSocket stability']
      });
    }

    req.yellowService = service;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Yellow Network service error',
      details: error.message
    });
  }
}

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    const service = getYellowNetworkService();
    const status = service ? service.getStatus() : null;

    res.json({
      status: 'healthy',
      service: 'PayWiser Yellow Network Integration',
      network: 'Yellow Network (Nitrolite)',
      hackathon: 'Yellow Network Hackathon 2025',
      connection: status || { connected: false, authenticated: false, error: 'Service not initialized' }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'PayWiser Yellow Network Integration',
      error: error.message
    });
  }
});

// Get Yellow Network status
router.get('/status', (req, res) => {
  try {
    const service = getYellowNetworkService();
    const status = service ? service.getStatus() : null;

    if (!status) {
      return res.json({
        success: false,
        error: 'Service not initialized',
        status: {
          connected: false,
          authenticated: false
        }
      });
    }

    res.json({
      success: true,
      status: {
        network: 'Yellow Network',
        protocol: 'Nitrolite (ERC-7824)',
        connected: status.connected,
        authenticated: status.authenticated,
        walletAddress: status.walletAddress,
        sessionKeyAddress: status.sessionKeyAddress,
        clearNodeUrl: status.clearNodeUrl,
        channelId: status.channelId,
        activeSessions: status.activeSessions,
        features: [
          'State Channels',
          'Gasless Transactions', 
          'Cross-chain Rewards',
          'Real-time Processing',
          'Biometric Payments'
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting Yellow Network status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Yellow Network status',
      details: error.message
    });
  }
});

// Reconnect endpoint (helpful for debugging)
router.post('/reconnect', async (req, res) => {
  try {
    const service = getYellowNetworkService();
    
    if (service) {
      console.log('🔄 Manually reconnecting Yellow Network...');
      service.disconnect();
      await service.connect();
    }
    
    res.json({
      success: true,
      message: 'Reconnection attempted',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Manual reconnection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Reconnection failed',
      details: error.message
    });
  }
});

// Get channels information
router.get('/channels', requireYellowNetwork, async (req, res) => {
  try {
    console.log('🟡 Getting channels from Yellow Network...');
    
    const channels = await req.yellowService.getChannels();
    
    res.json({
      success: true,
      channels: channels.params || [],
      network: 'Yellow Network',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting channels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get channels',
      details: error.message
    });
  }
});

// Get ledger balances
router.get('/balances', requireYellowNetwork, async (req, res) => {
  try {
    console.log('🟡 Getting ledger balances from Yellow Network...');
    
    const balances = await req.yellowService.getLedgerBalances();
    
    res.json({
      success: true,
      balances: balances.params || [],
      network: 'Yellow Network',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting balances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balances',
      details: error.message
    });
  }
});

// Process biometric payment via Yellow Network
router.post('/payment/biometric', requireYellowNetwork, async (req, res) => {
  try {
    const {
      customerAddress,
      merchantAddress,
      amount,
      biometricHash,
      merchantName = 'Unknown Merchant'
    } = req.body;

    // Validate required fields
    if (!customerAddress || !merchantAddress || !amount || !biometricHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['customerAddress', 'merchantAddress', 'amount', 'biometricHash']
      });
    }

    console.log('🟡 Processing biometric payment via Yellow Network...');
    console.log('Customer:', customerAddress);
    console.log('Merchant:', merchantAddress);
    console.log('Amount:', amount);

    // Step 1: Create application session
    const session = await req.yellowService.createBiometricPaymentSession(
      customerAddress,
      merchantAddress,
      amount
    );

    if (!session.success) {
      throw new Error('Failed to create payment session');
    }

    console.log('✅ Payment session created:', session.sessionId);

    // Step 2: Process the biometric payment
    const result = await req.yellowService.processBiometricPayment(
      session.sessionId,
      biometricHash,
      merchantName
    );

    console.log('✅ Biometric payment processed successfully');

    res.json({
      success: true,
      payment: {
        transactionId: result.transactionId,
        amount: parseFloat(amount),
        currency: 'USDC',
        from: customerAddress,
        to: merchantAddress,
        merchantName,
        status: 'completed',
        network: 'Yellow Network',
        protocol: 'Nitrolite (ERC-7824)',
        stateChannelId: result.stateChannelId,
        gasSponsored: true,
        processingTime: `${result.processingTime}ms`,
        biometric: {
          verified: true,
          hash: biometricHash,
          method: 'facial_recognition'
        },
        rewards: result.rewards,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Biometric payment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Biometric payment failed',
      details: error.message,
      network: 'Yellow Network'
    });
  }
});

// Demo endpoint for testing without real authentication
router.post('/payment/biometric-demo', (req, res) => {
  const { customerAddress, merchantAddress, amount, biometricHash, merchantName = 'Unknown Merchant' } = req.body;
  
  res.json({
    success: true,
    payment: {
      transactionId: `yellow_demo_${Date.now()}`,
      amount: parseFloat(amount),
      from: customerAddress,
      to: merchantAddress,
      merchantName,
      status: 'completed',
      network: 'Yellow Network',
      note: 'Demo endpoint - real integration working but connection unstable'
    }
  });
});

// Helper endpoint to create/fund a demo channel for testing
router.post('/channel/create-demo', requireYellowNetwork, async (req, res) => {
  try {
    console.log('🟡 Creating demo channel for testing...');
    
    // This would normally create a real channel, but for demo we'll simulate
    const demoChannelId = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    res.json({
      success: true,
      channel: {
        channelId: demoChannelId,
        status: 'open',
        token: 'USDC',
        amount: '1000.00',
        participant: req.yellowService.wallet.address,
        chainId: 1,
        adjudicator: '0x0000000000000000000000000000000000000000',
        note: 'Demo channel created for testing biometric payments'
      },
      network: 'Yellow Network',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Demo channel creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Demo channel creation failed',
      details: error.message
    });
  }
});

// Create application session
router.post('/session/create', requireYellowNetwork, async (req, res) => {
  try {
    const { customerAddress, merchantAddress, amount } = req.body;

    if (!customerAddress || !merchantAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['customerAddress', 'merchantAddress', 'amount']
      });
    }

    console.log('🟡 Creating Yellow Network application session...');

    const result = await req.yellowService.createBiometricPaymentSession(
      customerAddress,
      merchantAddress,
      amount
    );

    res.json({
      success: true,
      session: {
        sessionId: result.sessionId,
        status: result.status,
        network: 'Yellow Network',
        protocol: 'Nitrolite (ERC-7824)',
        participants: [customerAddress, merchantAddress],
        amount: parseFloat(amount),
        currency: 'USDC'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
      details: error.message
    });
  }
});

// Initialize connection endpoint
router.post('/initialize', requireYellowNetwork, (req, res) => {
  try {
    const status = req.yellowService.getStatus();
    
    res.json({
      success: true,
      message: 'Yellow Network connection initialized',
      status: status,
      network: 'Yellow Network',
      protocol: 'Nitrolite (ERC-7824)',
      features: [
        'Real-time state channels',
        'Gasless transactions',
        'Cross-chain capabilities',
        'EIP-712 signatures',
        'Biometric payment support'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initializing Yellow Network:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Yellow Network',
      details: error.message
    });
  }
});

router.get('/channel/mine', requireYellowNetwork, async (req, res) => {
  try {
    console.log('Getting your real channel...');
    
    const channel = await req.yellowService.getMyChannel();
    
    res.json({
      success: true,
      channel: {
        channelId: channel.channel_id,
        status: channel.status,
        participant: channel.participant,
        token: channel.token,
        amount: channel.amount,
        chainId: channel.chain_id,
        adjudicator: channel.adjudicator,
        challenge: channel.challenge,
        nonce: channel.nonce,
        version: channel.version,
        created: channel.created_at,
        updated: channel.updated_at
      },
      network: 'Yellow Network (Real)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting your channel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get your channel',
      details: error.message
    });
  }
});

// Verify your channel is ready for payments
router.get('/channel/verify', requireYellowNetwork, async (req, res) => {
  try {
    console.log('Verifying channel is ready...');
    
    const verification = await req.yellowService.verifyChannelReady();
    
    res.json({
      success: true,
      verification: {
        ...verification,
        message: 'Channel is ready for biometric payments'
      },
      network: 'Yellow Network (Real)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Channel verification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Channel verification failed',
      details: error.message,
      suggestions: [
        'Check if channel is funded',
        'Verify channel status is "open"',
        'Ensure proper authentication'
      ]
    });
  }
});

// Get active sessions
router.get('/sessions/active', requireYellowNetwork, (req, res) => {
  try {
    const service = req.yellowService;
    const activeSessions = Array.from(service.appSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      status: session.status,
      customerAddress: session.customerAddress,
      merchantAddress: session.merchantAddress,
      amount: session.amount,
      createdAt: new Date(session.createdAt).toISOString(),
      completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : null
    }));

    res.json({
      success: true,
      activeSessionsCount: activeSessions.filter(s => s.status === 'open').length,
      totalSessions: activeSessions.length,
      sessions: activeSessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process real biometric payment using your channel
router.post('/payment/biometric-real', requireYellowNetwork, async (req, res) => {
  try {
    const {
      customerAddress,
      merchantAddress,
      amount,
      biometricHash,
      merchantName = 'Unknown Merchant'
    } = req.body;

    if (!customerAddress || !merchantAddress || !amount || !biometricHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['customerAddress', 'merchantAddress', 'amount', 'biometricHash']
      });
    }

    console.log('Processing REAL biometric payment via Yellow Network...');
    console.log('Customer:', customerAddress);
    console.log('Merchant:', merchantAddress);
    console.log('Amount:', amount);
    console.log('Channel ID:', process.env.YELLOW_CHANNEL_ID);

    // First verify channel is ready
    await req.yellowService.verifyChannelReady();

    // Create application session
    const session = await req.yellowService.createBiometricPaymentSession(
      customerAddress,
      merchantAddress,
      amount
    );

    if (!session.success) {
      throw new Error('Failed to create payment session on real channel');
    }

    console.log('Payment session created on real channel:', session.sessionId);

    // Process the biometric payment
    const result = await req.yellowService.processBiometricPayment(
      session.sessionId,
      biometricHash,
      merchantName
    );

    console.log('REAL biometric payment processed successfully');

    res.json({
      success: true,
      payment: {
        transactionId: result.transactionId,
        amount: parseFloat(amount),
        currency: 'USDC',
        from: customerAddress,
        to: merchantAddress,
        merchantName,
        status: 'completed',
        network: 'Yellow Network (REAL)',
        protocol: 'Nitrolite (ERC-7824)',
        channelId: process.env.YELLOW_CHANNEL_ID,
        sessionId: session.sessionId,
        stateChannelId: result.stateChannelId,
        gasSponsored: true,
        processingTime: `${result.processingTime}ms`,
        realChannel: true,
        biometric: {
          verified: true,
          hash: biometricHash,
          method: 'facial_recognition'
        },
        rewards: result.rewards,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('REAL biometric payment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Real biometric payment failed',
      details: error.message,
      network: 'Yellow Network (REAL)',
      channelId: process.env.YELLOW_CHANNEL_ID
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Yellow Network API error:', error);
  res.status(500).json({
    success: false,
    error: 'Yellow Network API error',
    details: error.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;