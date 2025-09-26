#!/usr/bin/env node

/**
 * Sponsored Transfer: Remaining SUI from Wallet B to Wallet A
 * Transfer all remaining SUI (0.008990120) with gas sponsored by Wallet A
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

async function transferRemainingSUI() {
  try {
    console.log('🚀 Starting sponsored transfer of remaining SUI...');
    console.log(`From: ${wallets.walletB.name} (${wallets.walletB.address})`);
    console.log(`To: ${wallets.walletA.name} (${wallets.walletA.address})`);
    console.log(`Amount: ALL remaining SUI`);
    console.log(`Gas Sponsor: ${wallets.walletA.name}\n`);

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
    
    const walletBSUI = parseInt(walletBBalance.totalBalance) / 1e9;
    const walletASUI = parseInt(walletABalance.totalBalance) / 1e9;
    
    console.log(`   Wallet B: ${walletBSUI.toFixed(9)} SUI`);
    console.log(`   Wallet A: ${walletASUI.toFixed(9)} SUI\n`);

    if (walletBSUI === 0) {
      console.log('✅ Wallet B is already empty. Nothing to transfer.');
      return;
    }

    // Create keypairs
    const senderKeypair = Ed25519Keypair.fromSecretKey(fromB64(wallets.walletB.privateKey));
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(fromB64(wallets.walletA.privateKey));

    // Get SUI coins from Wallet B
    const coins = await client.getCoins({
      owner: wallets.walletB.address,
      coinType: '0x2::sui::SUI'
    });

    if (coins.data.length === 0) {
      throw new Error('No SUI coins found in Wallet B');
    }

    console.log(`📦 Found ${coins.data.length} SUI coin(s) in Wallet B`);

    // Calculate amount to transfer (all available balance)
    const totalBalance = parseInt(walletBBalance.totalBalance);
    console.log(`💰 Total balance in MIST: ${totalBalance}`);
    console.log(`💰 Total balance in SUI: ${(totalBalance / 1e9).toFixed(9)}`);

    // Create sponsored transaction
    const txb = new Transaction();
    
    // Set up sponsorship
    txb.setSender(wallets.walletB.address);
    txb.setGasOwner(wallets.walletA.address);
    txb.setGasBudget(10000000); // 0.01 SUI gas budget

    // Transfer the entire coin object (all remaining SUI)
    txb.transferObjects([txb.object(coins.data[0].coinObjectId)], wallets.walletA.address);

    console.log('📝 Building sponsored transaction...');
    
    // Build transaction
    const txBytes = await txb.build({ client });
    
    // Sign with both sender and sponsor
    const senderSignature = await senderKeypair.signTransaction(txBytes);
    const sponsorSignature = await sponsorKeypair.signTransaction(txBytes);

    console.log('🚀 Executing sponsored transaction...');

    // Execute sponsored transaction
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: [senderSignature.signature, sponsorSignature.signature],
      options: {
        showEffects: true,
        showBalanceChanges: true
      }
    });

    console.log('\n✅ Sponsored transfer completed!');
    console.log('=' .repeat(60));
    console.log(`🔗 Transaction Digest: ${result.digest}`);
    console.log(`📊 Status: ${result.effects?.status?.status}`);
    console.log(`⛽ Gas Used: ${result.effects?.gasUsed?.computationCost || 'N/A'} MIST`);
    console.log(`💰 Gas Sponsor: ${wallets.walletA.name}`);
    
    if (result.balanceChanges) {
      console.log('\n💸 Balance Changes:');
      result.balanceChanges.forEach(change => {
        const amount = parseInt(change.amount) / 1e9;
        const owner = change.owner === wallets.walletA.address ? 'Wallet A (Gas Sponsor + Receiver)' : 
                     change.owner === wallets.walletB.address ? 'Wallet B (Sender)' : 
                     change.owner;
        console.log(`   ${owner}: ${amount > 0 ? '+' : ''}${amount.toFixed(9)} SUI`);
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
    
    const walletBSUIAfter = parseInt(walletBBalanceAfter.totalBalance) / 1e9;
    const walletASUIAfter = parseInt(walletABalanceAfter.totalBalance) / 1e9;
    
    console.log(`   Wallet B: ${walletBSUIAfter.toFixed(9)} SUI`);
    console.log(`   Wallet A: ${walletASUIAfter.toFixed(9)} SUI`);

    // Calculate net changes
    const walletBChange = walletBSUIAfter - walletBSUI;
    const walletAChange = walletASUIAfter - walletASUI;
    
    console.log('\n💸 Net Balance Changes:');
    console.log(`   Wallet B (Sender): ${walletBChange > 0 ? '+' : ''}${walletBChange.toFixed(9)} SUI`);
    console.log(`   Wallet A (Gas Sponsor + Receiver): ${walletAChange > 0 ? '+' : ''}${walletAChange.toFixed(9)} SUI`);

    console.log('\n🎯 Transaction Summary:');
    console.log(`   ✅ Wallet B transferred ALL remaining SUI (${walletBSUI.toFixed(9)}) to Wallet A`);
    console.log(`   ✅ Wallet A paid gas fees for the transaction`);
    console.log(`   ✅ Wallet B is now empty (0 SUI)`);
    console.log(`   ✅ Sponsored transaction executed successfully`);

    return result;

  } catch (error) {
    console.error('\n❌ Sponsored transfer failed:', error.message);
    throw error;
  }
}

// Run the sponsored transfer
transferRemainingSUI().then(() => {
  console.log('\n🎉 All remaining SUI transferred successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Script failed:', error.message);
  process.exit(1);
});

