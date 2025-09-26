#!/usr/bin/env node

/**
 * Create a proper Sui wallet with 32-byte private key
 */

const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { toB64, fromB64 } = require('@mysten/sui/utils');

console.log('🔐 Creating proper Sui wallet with 32-byte private key...\n');

try {
  // Generate a random 32-byte private key
  const privateKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(privateKeyBytes);
  
  // Create keypair from the 32-byte key
  const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
  
  // Get the address and keys
  const address = keypair.getPublicKey().toSuiAddress();
  const privateKey = toB64(privateKeyBytes);
  const publicKey = keypair.getPublicKey().toBase64();

  console.log('✅ Wallet created successfully!');
  console.log('================================');
  console.log(`📍 Address: ${address}`);
  console.log(`🔑 Private Key (32 bytes): ${privateKey}`);
  console.log(`🔓 Public Key: ${publicKey}`);
  console.log('================================\n');
  
  // Verify the wallet works
  console.log('🧪 Verification:');
  const verifyKeypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
  const verifyAddress = verifyKeypair.getPublicKey().toSuiAddress();
  console.log(`   Expected address: ${address}`);
  console.log(`   Verified address: ${verifyAddress}`);
  console.log(`   Match: ${address === verifyAddress ? '✅ YES' : '❌ NO'}`);
  console.log(`   Private key length: ${fromB64(privateKey).length} bytes\n`);
  
  console.log('📋 To use this wallet:');
  console.log('1. Fund it with SUI tokens');
  console.log('2. Use the private key for transfers');
  console.log('3. Set as gas sponsor if needed\n');
  
  console.log('💰 To get testnet SUI tokens:');
  console.log(`curl -X POST https://faucet.testnet.sui.io/v2/gas -H "Content-Type: application/json" -d '{"FixedAmountRequest":{"recipient":"${address}"}}'`);

  return {
    address,
    privateKey,
    publicKey
  };

} catch (error) {
  console.error('❌ Error creating wallet:', error.message);
  process.exit(1);
}
