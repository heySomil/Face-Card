const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');
const { fromB64, toB64 } = require('@mysten/sui/utils');

class SuiService {
  constructor() {
    // Initialize Sui client
    const network = process.env.SUI_NETWORK || 'testnet';
    const rpcUrl = process.env.SUI_RPC_URL || getFullnodeUrl(network);
    
    this.client = new SuiClient({ url: rpcUrl });
    this.network = network;
    
    // Initialize gas sponsor keypair if provided
    if (process.env.GAS_SPONSOR_PRIVATE_KEY) {
      try {
        const privateKeyBytes = fromB64(process.env.GAS_SPONSOR_PRIVATE_KEY);
        // Take only the first 32 bytes for the secret key
        const secretKey = privateKeyBytes.slice(0, 32);
        this.gasSponsorKeypair = Ed25519Keypair.fromSecretKey(secretKey);
        console.log('✅ Gas sponsor account initialized');
      } catch (error) {
        console.warn('⚠️  Failed to initialize gas sponsor account:', error.message);
      }
    }
    
    // USDC coin type (testnet) - Updated to match actual faucet tokens
    this.usdcCoinType = process.env.USDC_COIN_TYPE || 
      '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';
  }

  /**
   * Create a new wallet (keypair)
   */
  createWallet() {
    try {
      const keypair = new Ed25519Keypair();
      const address = keypair.getPublicKey().toSuiAddress();
      const privateKey = toB64(keypair.getSecretKey());
      
      return {
        address,
        privateKey,
        publicKey: keypair.getPublicKey().toBase64()
      };
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance for SUI and USDC
   */
  async getBalance(address) {
    try {
      console.log('🔍 Getting balance for address:', address);
      
      // Validate address format
      if (!address || typeof address !== 'string') {
        throw new Error('Invalid address format');
      }

      // Get SUI balance
      let suiBalance;
      try {
        suiBalance = await this.client.getBalance({
          owner: address,
          coinType: '0x2::sui::SUI'
        });
        console.log('✅ SUI balance retrieved:', suiBalance.totalBalance);
      } catch (suiError) {
        console.error('❌ SUI balance error:', suiError.message);
        throw new Error(`Failed to get SUI balance: ${suiError.message}`);
      }

      // Get USDC balance with fallback
      let usdcBalance;
      try {
        usdcBalance = await this.client.getBalance({
          owner: address,
          coinType: this.usdcCoinType
        });
        console.log('✅ USDC balance retrieved:', usdcBalance.totalBalance);
      } catch (usdcError) {
        console.warn('⚠️ USDC balance failed, using zero balance:', usdcError.message);
        // Fallback to zero balance if USDC fails
        usdcBalance = { totalBalance: '0' };
      }

      return {
        sui: {
          balance: suiBalance.totalBalance,
          formatted: (parseInt(suiBalance.totalBalance) / 1e9).toFixed(9) // SUI has 9 decimals
        },
        usdc: {
          balance: usdcBalance.totalBalance,
          formatted: (parseInt(usdcBalance.totalBalance) / 1e6).toFixed(6) // USDC has 6 decimals
        }
      };
    } catch (error) {
      console.error('❌ Balance fetch error:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Transfer SUI from one account to another with gas sponsorship
   */
  async transferSUI(fromPrivateKey, toAddress, amount) {
    try {
      if (!this.gasSponsorKeypair) {
        throw new Error('Gas sponsor account not configured properly');
      }

      // Create keypair from private key
      const privateKeyBytes = fromB64(fromPrivateKey);
      const secretKey = privateKeyBytes.slice(0, 32);
      const fromKeypair = Ed25519Keypair.fromSecretKey(secretKey);
      const fromAddress = fromKeypair.getPublicKey().toSuiAddress();

      // Convert amount to smallest unit (SUI has 9 decimals)
      const amountInSmallestUnit = Math.floor(amount * 1e9);

      // Get SUI coins owned by sender
      const coins = await this.client.getCoins({
        owner: fromAddress,
        coinType: '0x2::sui::SUI'
      });

      if (coins.data.length === 0) {
        throw new Error('No SUI coins found in sender account');
      }

      // Create transaction
      const txb = new Transaction();
      txb.setSender(fromAddress);
      txb.setGasOwner(this.gasSponsorKeypair.getPublicKey().toSuiAddress());
      
      // If we have multiple coins, merge them first
      if (coins.data.length > 1) {
        const [firstCoin, ...restCoins] = coins.data;
        if (restCoins.length > 0) {
          txb.mergeCoins(
            txb.object(firstCoin.coinObjectId),
            restCoins.map(coin => txb.object(coin.coinObjectId))
          );
        }
      }

      // Split and transfer SUI
      const [transferCoin] = txb.splitCoins(
        txb.object(coins.data[0].coinObjectId),
        [amountInSmallestUnit]
      );
      txb.transferObjects([transferCoin], toAddress);

      // Sign with both sender and sponsor
      const senderSignature = await txb.sign({ signer: fromKeypair });
      const sponsorSignature = await txb.sign({ signer: this.gasSponsorKeypair });

      // Execute sponsored transaction
      const result = await this.client.executeTransactionBlock({
        transactionBlock: txb,
        signature: [senderSignature.signature, sponsorSignature.signature],
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return {
        digest: result.digest,
        status: result.effects?.status?.status,
        gasUsed: result.effects?.gasUsed,
        sponsored: true,
        sponsor: this.gasSponsorKeypair.getPublicKey().toSuiAddress(),
        objectChanges: result.objectChanges
      };
    } catch (error) {
      throw new Error(`SUI transfer failed: ${error.message}`);
    }
  }

  /**
   * Transfer USDC from one account to another
   */
  async transferUSDC(fromPrivateKey, toAddress, amount) {
    try {
      // Create keypair from private key
      const fromKeypair = Ed25519Keypair.fromSecretKey(fromB64(fromPrivateKey));
      const fromAddress = fromKeypair.getPublicKey().toSuiAddress();

      // Convert amount to smallest unit (USDC has 6 decimals)
      const amountInSmallestUnit = Math.floor(amount * 1e6);

      // Get USDC coins owned by sender
      const coins = await this.client.getCoins({
        owner: fromAddress,
        coinType: this.usdcCoinType
      });

      if (coins.data.length === 0) {
        throw new Error('No USDC coins found in sender account');
      }

      // Create transaction block
      const txb = new Transaction();

      // If we have multiple coins, merge them first
      if (coins.data.length > 1) {
        const [firstCoin, ...restCoins] = coins.data;
        if (restCoins.length > 0) {
          txb.mergeCoins(
            txb.object(firstCoin.coinObjectId),
            restCoins.map(coin => txb.object(coin.coinObjectId))
          );
        }
      }

      // Split the coin and transfer - use raw number like in working demo
      const [transferCoin] = txb.splitCoins(
        txb.object(coins.data[0].coinObjectId),
        [amountInSmallestUnit]
      );

      txb.transferObjects([transferCoin], toAddress);

      // Execute transaction
      const result = await this.client.signAndExecuteTransactionBlock({
        signer: fromKeypair,
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return {
        digest: result.digest,
        status: result.effects?.status?.status,
        gasUsed: result.effects?.gasUsed,
        objectChanges: result.objectChanges
      };
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Transfer USDC with gas sponsorship
   */
  async transferUSDCWithSponsorship(fromPrivateKey, toAddress, amount) {
    try {
      if (!this.gasSponsorKeypair) {
        throw new Error('Gas sponsor account not configured');
      }

      // Create keypair from private key
      const fromKeypair = Ed25519Keypair.fromSecretKey(fromB64(fromPrivateKey));
      const fromAddress = fromKeypair.getPublicKey().toSuiAddress();

      // Convert amount to smallest unit
      const amountInSmallestUnit = Math.floor(amount * 1e6);

      // Get USDC coins owned by sender
      const coins = await this.client.getCoins({
        owner: fromAddress,
        coinType: this.usdcCoinType
      });

      if (coins.data.length === 0) {
        throw new Error('No USDC coins found in sender account');
      }

      // Create transaction block
      const txb = new Transaction();
      
      // Set up sponsorship - same as working demo
      txb.setSender(fromAddress);
      txb.setGasOwner(this.gasSponsorKeypair.getPublicKey().toSuiAddress());
      txb.setGasBudget(10000000); // 0.01 SUI

      // Merge coins if multiple
      if (coins.data.length > 1) {
        const [firstCoin, ...restCoins] = coins.data;
        if (restCoins.length > 0) {
          txb.mergeCoins(
            txb.object(firstCoin.coinObjectId),
            restCoins.map(coin => txb.object(coin.coinObjectId))
          );
        }
      }

      // Split and transfer - use raw number like in working demo
      const [transferCoin] = txb.splitCoins(
        txb.object(coins.data[0].coinObjectId),
        [amountInSmallestUnit]
      );

      txb.transferObjects([transferCoin], toAddress);

      console.log('📝 Building sponsored USDC transaction...');
      
      // Build transaction like in working demo
      const txBytes = await txb.build({ client: this.client });
      
      // Check if sender and sponsor are the same
      const sponsorAddress = this.gasSponsorKeypair.getPublicKey().toSuiAddress();
      const isSelfSponsored = fromAddress === sponsorAddress;
      
      console.log('🔍 Transaction details:', {
        sender: fromAddress,
        sponsor: sponsorAddress,
        isSelfSponsored
      });

      let signatures;
      if (isSelfSponsored) {
        // If sender is the same as sponsor, only need one signature
        console.log('🔐 Self-sponsored transaction - using single signature');
        const signature = await fromKeypair.signTransaction(txBytes);
        signatures = signature.signature;
      } else {
        // Different sender and sponsor - need both signatures
        console.log('🔐 Multi-party sponsored transaction - using dual signatures');
        const senderSignature = await fromKeypair.signTransaction(txBytes);
        const sponsorSignature = await this.gasSponsorKeypair.signTransaction(txBytes);
        signatures = [senderSignature.signature, sponsorSignature.signature];
      }

      console.log('🚀 Executing sponsored USDC transaction...');

      // Execute sponsored transaction
      const result = await this.client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: signatures,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showBalanceChanges: true
        }
      });

      return {
        digest: result.digest,
        status: result.effects?.status?.status,
        gasUsed: result.effects?.gasUsed,
        sponsored: true,
        sponsor: this.gasSponsorKeypair.getPublicKey().toSuiAddress(),
        objectChanges: result.objectChanges
      };
    } catch (error) {
      throw new Error(`Sponsored transfer failed: ${error.message}`);
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(digest) {
    try {
      return await this.client.getTransactionBlock({
        digest,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true
        }
      });
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Request test tokens from faucet (testnet only)
   */
  async requestTestTokens(address) {
    try {
      if (this.network !== 'testnet') {
        throw new Error('Faucet only available on testnet');
      }

      const response = await fetch('https://faucet.testnet.sui.io/v2/gas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FixedAmountRequest: {
            recipient: address
          }
        })
      });

      if (!response.ok) {
        throw new Error('Faucet request failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Faucet request failed: ${error.message}`);
    }
  }
}

module.exports = new SuiService();
