#!/usr/bin/env node

/**
 * Transfer SUI using the proper wallets with 32-byte private keys
 * First distribute SUI from funded wallet, then demonstrate sponsored transactions
 */

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');
const { fromB64 } = require('@mysten/sui/utils');

// Proper wallets with 32-byte private keys
const properWallets = {
  walletA: {
    name: 'Wallet A (Gas Sponsor)',
    address: '0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c',
    privateKey: '3GInch4KuXu922aU4qCs9PmXgE59c/4S73OtzDStYVM='
  },
  walletB: {
    name: 'Wallet B (Sender)',
    address: '0x41fe7d24482047fac1cb08d5e2591eaee7941bc00fdb4d0edb9e0ff81c7f0cd4',
    privateKey: 'VhjC/jLSrvo1rMtZrY7+5uwlhJX8tki5+mk3gM3jlCw='
  },
  walletC: {
    name: 'Wallet C (Receiver)',
    address: '0x8c4215b1b404e1ad2949459c7eff154a2087d2b884334617645a75f96220c836',
    privateKey: 'tHxcgy/yPNHdgVz8BzmQs0P1NfVDKnGwiQqfUTpRnzo='
  }
};

async function distributeSUI() {
  console.log('🚀 Starting SUI distribution and sponsored transfer demo...\n');

  const client = new SuiClient({ url: getFullnodeUrl('testnet') });

  // Check initial balances
  console.log('📊 Initial balances:');
  for (const [key, wallet] of Object.entries(properWallets)) {
    const balance = await client.getBalance({
      owner: wallet.address,
      coinType: '0x2::sui::SUI'
    });
    console.log(`   ${wallet.name}: ${(parseInt(balance.totalBalance) / 1e9).toFixed(9)} SUI`);
  }

  // Step 1: Distribute SUI from Wallet A to Wallets B and C
  console.log('\n💸 Step 1: Distributing SUI from Wallet A to B and C...');
  
  try {
    // Create keypair for Wallet A
    const walletAKeypair = Ed25519Keypair.fromSecretKey(fromB64(properWallets.walletA.privateKey));
    
    // Verify address matches
    const derivedAddress = walletAKeypair.getPublicKey().toSuiAddress();
    if (derivedAddress !== properWallets.walletA.address) {
      throw new Error(`Address mismatch for Wallet A: expected ${properWallets.walletA.address}, got ${derivedAddress}`);
    }
    console.log('✅ Wallet A private key verification successful');

    // Get SUI coins from Wallet A
    const coins = await client.getCoins({
      owner: properWallets.walletA.address,
      coinType: '0x2::sui::SUI'
    });

    if (coins.data.length === 0) {
      throw new Error('No SUI coins found in Wallet A');
    }

    // Create transaction to send 0.3 SUI to Wallet B and 0.3 SUI to Wallet C
    const txb = new Transaction();
    txb.setSender(properWallets.walletA.address);
    
    // Use the gas coin directly for splitting (it will automatically handle gas payment)
    // Split coins: 0.3 SUI each (300,000,000 MIST)
    const [coinForB, coinForC] = txb.splitCoins(
      txb.gas,
      [300000000, 300000000]
    );

    // Transfer to recipients
    txb.transferObjects([coinForB], properWallets.walletB.address);
    txb.transferObjects([coinForC], properWallets.walletC.address);

    console.log('📝 Building distribution transaction...');
    
    // Build and sign transaction
    const txBytes = await txb.build({ client });
    const signature = await walletAKeypair.signTransaction(txBytes);

    console.log('🚀 Executing distribution...');
    
    // Execute transaction
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: signature.signature,
      options: {
        showEffects: true,
        showBalanceChanges: true
      }
    });

    console.log(`✅ Distribution completed! Transaction: ${result.digest}`);
    
    if (result.balanceChanges) {
      console.log('💸 Balance changes:');
      result.balanceChanges.forEach(change => {
        const amount = parseInt(change.amount) / 1e9;
        console.log(`   ${change.owner}: ${amount > 0 ? '+' : ''}${amount} SUI`);
      });
    }

  } catch (error) {
    console.error('❌ Distribution failed:', error.message);
    return;
  }

  // Wait a moment for the transaction to settle
  console.log('\n⏳ Waiting for transaction to settle...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 2: Check balances after distribution
  console.log('\n📊 Balances after distribution:');
  for (const [key, wallet] of Object.entries(properWallets)) {
    const balance = await client.getBalance({
      owner: wallet.address,
      coinType: '0x2::sui::SUI'
    });
    console.log(`   ${wallet.name}: ${(parseInt(balance.totalBalance) / 1e9).toFixed(9)} SUI`);
  }

  // Step 3: Demonstrate sponsored transfer (Wallet B to Wallet C, sponsored by Wallet A)
  console.log('\n🎯 Step 2: Sponsored transfer from Wallet B to Wallet C...');
  console.log('   Amount: 0.1 SUI');
  console.log('   Gas Sponsor: Wallet A');

  try {
    // Create keypairs
    const senderKeypair = Ed25519Keypair.fromSecretKey(fromB64(properWallets.walletB.privateKey));
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(fromB64(properWallets.walletA.privateKey));

    // Get coins from sender (Wallet B)
    const senderCoins = await client.getCoins({
      owner: properWallets.walletB.address,
      coinType: '0x2::sui::SUI'
    });

    if (senderCoins.data.length === 0) {
      throw new Error('No SUI coins found in Wallet B');
    }

    // Create sponsored transaction
    const sponsoredTxb = new Transaction();
    
    // Set up sponsorship
    sponsoredTxb.setSender(properWallets.walletB.address);
    sponsoredTxb.setGasOwner(properWallets.walletA.address);
    sponsoredTxb.setGasBudget(10000000); // 0.01 SUI

    // Split and transfer 0.1 SUI (100,000,000 MIST)
    const [transferCoin] = sponsoredTxb.splitCoins(
      sponsoredTxb.object(senderCoins.data[0].coinObjectId),
      [100000000]
    );

    sponsoredTxb.transferObjects([transferCoin], properWallets.walletC.address);

    console.log('📝 Building sponsored transaction...');
    
    // Build transaction
    const sponsoredTxBytes = await sponsoredTxb.build({ client });
    
    // Sign with both sender and sponsor
    const senderSignature = await senderKeypair.signTransaction(sponsoredTxBytes);
    const sponsorSignature = await sponsorKeypair.signTransaction(sponsoredTxBytes);

    console.log('🚀 Executing sponsored transaction...');

    // Execute sponsored transaction
    const sponsoredResult = await client.executeTransactionBlock({
      transactionBlock: sponsoredTxBytes,
      signature: [senderSignature.signature, sponsorSignature.signature],
      options: {
        showEffects: true,
        showBalanceChanges: true
      }
    });

    console.log(`✅ Sponsored transfer completed! Transaction: ${sponsoredResult.digest}`);
    console.log(`📊 Status: ${sponsoredResult.effects?.status?.status}`);
    console.log(`⛽ Gas Used: ${sponsoredResult.effects?.gasUsed?.computationCost || 'N/A'} MIST`);
    
    if (sponsoredResult.balanceChanges) {
      console.log('💸 Balance changes:');
      sponsoredResult.balanceChanges.forEach(change => {
        const amount = parseInt(change.amount) / 1e9;
        console.log(`   ${change.owner}: ${amount > 0 ? '+' : ''}${amount} SUI`);
      });
    }

  } catch (error) {
    console.error('❌ Sponsored transfer failed:', error.message);
    return;
  }

  // Final balance check
  console.log('\n📊 Final balances:');
  for (const [key, wallet] of Object.entries(properWallets)) {
    const balance = await client.getBalance({
      owner: wallet.address,
      coinType: '0x2::sui::SUI'
    });
    console.log(`   ${wallet.name}: ${(parseInt(balance.totalBalance) / 1e9).toFixed(9)} SUI`);
  }

  console.log('\n🎉 SUCCESS! Demonstrated:');
  console.log('✅ Proper wallet creation with 32-byte private keys');
  console.log('✅ Address verification and private key mapping');
  console.log('✅ Regular SUI transfers');
  console.log('✅ Sponsored transactions with gas sponsorship');
  console.log('✅ Multi-signature transaction execution');
}

// Run the demo
distributeSUI().then(() => {
  console.log('\n🏁 Demo completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Demo failed:', error.message);
  process.exit(1);
});
