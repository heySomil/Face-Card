#!/usr/bin/env node

/**
 * Transfer 0.2 SUI from Wallet B to Wallet A
 */

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');
const { fromB64 } = require('@mysten/sui/utils');

// Wallet information
const wallets = {
  walletA: {
    name: 'Wallet A (Gas Sponsor)',
    address: '0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c',
    privateKey: '3GInch4KuXu922aU4qCs9PmXgE59c/4S73OtzDStYVM='
  },
  walletB: {
    name: 'Wallet B (Sender)',
    address: '0x41fe7d24482047fac1cb08d5e2591eaee7941bc00fdb4d0edb9e0ff81c7f0cd4',
    privateKey: 'VhjC/jLSrvo1rMtZrY7+5uwlhJX8tki5+mk3gM3jlCw='
  }
};

async function transferSUI() {
  try {
    console.log('🚀 Starting SUI transfer...');
    console.log(`From: ${wallets.walletB.name} (${wallets.walletB.address})`);
    console.log(`To: ${wallets.walletA.name} (${wallets.walletA.address})`);
    console.log(`Amount: 0.2 SUI\n`);

    // Initialize Sui client
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    // Check initial balances
    console.log('📊 Initial balances:');
    const walletBBalance = await client.getBalance({
      owner: wallets.walletB.address,
      coinType: '0x2::sui::SUI'
    });
    const walletABalance = await client.getBalance({
      owner: wallets.walletA.address,
      coinType: '0x2::sui::SUI'
    });
    
    console.log(`   Wallet B: ${(parseInt(walletBBalance.totalBalance) / 1e9).toFixed(9)} SUI`);
    console.log(`   Wallet A: ${(parseInt(walletABalance.totalBalance) / 1e9).toFixed(9)} SUI\n`);

    // Create keypair for Wallet B (sender)
    const senderKeypair = Ed25519Keypair.fromSecretKey(fromB64(wallets.walletB.privateKey));
    
    // Verify address matches
    const derivedAddress = senderKeypair.getPublicKey().toSuiAddress();
    if (derivedAddress !== wallets.walletB.address) {
      throw new Error(`Address mismatch for Wallet B: expected ${wallets.walletB.address}, got ${derivedAddress}`);
    }
    console.log('✅ Wallet B private key verification successful');

    // Get SUI coins from Wallet B
    const coins = await client.getCoins({
      owner: wallets.walletB.address,
      coinType: '0x2::sui::SUI'
    });

    if (coins.data.length === 0) {
      throw new Error('No SUI coins found in Wallet B');
    }

    console.log(`📦 Found ${coins.data.length} SUI coin(s) in Wallet B`);

    // Convert 0.2 SUI to MIST (1 SUI = 1e9 MIST)
    const amountInMist = Math.floor(0.2 * 1e9);
    console.log(`💰 Amount in MIST: ${amountInMist}`);

    // Create transaction
    const txb = new Transaction();
    txb.setSender(wallets.walletB.address);

    // Split and transfer 0.2 SUI
    const [transferCoin] = txb.splitCoins(
      txb.gas,
      [amountInMist]
    );

    txb.transferObjects([transferCoin], wallets.walletA.address);

    console.log('📝 Building transaction...');
    
    // Build and sign transaction
    const txBytes = await txb.build({ client });
    const signature = await senderKeypair.signTransaction(txBytes);

    console.log('🚀 Executing transfer...');
    
    // Execute transaction
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: signature.signature,
      options: {
        showEffects: true,
        showBalanceChanges: true
      }
    });

    console.log('\n✅ Transfer completed successfully!');
    console.log('=' .repeat(60));
    console.log(`🔗 Transaction Digest: ${result.digest}`);
    console.log(`📊 Status: ${result.effects?.status?.status}`);
    console.log(`⛽ Gas Used: ${result.effects?.gasUsed?.computationCost || 'N/A'} MIST`);
    
    if (result.balanceChanges) {
      console.log('\n💸 Balance Changes:');
      result.balanceChanges.forEach(change => {
        const amount = parseInt(change.amount) / 1e9;
        console.log(`   ${change.owner}: ${amount > 0 ? '+' : ''}${amount} SUI`);
      });
    }

    // Wait a moment for the transaction to settle
    console.log('\n⏳ Waiting for transaction to settle...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check final balances
    console.log('\n📊 Final balances:');
    const walletBBalanceAfter = await client.getBalance({
      owner: wallets.walletB.address,
      coinType: '0x2::sui::SUI'
    });
    const walletABalanceAfter = await client.getBalance({
      owner: wallets.walletA.address,
      coinType: '0x2::sui::SUI'
    });
    
    console.log(`   Wallet B: ${(parseInt(walletBBalanceAfter.totalBalance) / 1e9).toFixed(9)} SUI`);
    console.log(`   Wallet A: ${(parseInt(walletABalanceAfter.totalBalance) / 1e9).toFixed(9)} SUI`);

    // Calculate changes
    const walletBChange = (parseInt(walletBBalanceAfter.totalBalance) - parseInt(walletBBalance.totalBalance)) / 1e9;
    const walletAChange = (parseInt(walletABalanceAfter.totalBalance) - parseInt(walletABalance.totalBalance)) / 1e9;
    
    console.log('\n💸 Net Balance Changes:');
    console.log(`   Wallet B: ${walletBChange > 0 ? '+' : ''}${walletBChange.toFixed(9)} SUI`);
    console.log(`   Wallet A: ${walletAChange > 0 ? '+' : ''}${walletAChange.toFixed(9)} SUI`);

    return result;

  } catch (error) {
    console.error('\n❌ Transfer failed:', error.message);
    throw error;
  }
}

// Run the transfer
transferSUI().then(() => {
  console.log('\n🎉 Transfer completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Script failed:', error.message);
  process.exit(1);
});

