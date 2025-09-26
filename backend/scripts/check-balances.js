#!/usr/bin/env node

/**
 * Balance Checker Script for All Wallets
 * This script checks the SUI and USDC balances for all created wallets
 */

const suiService = require('../src/services/suiService');

// PayWiser working wallets
const wallets = [
  {
    name: 'Wallet A (Gas Sponsor)',
    address: '0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c'
  },
  {
    name: 'Wallet B (Sender)',
    address: '0x41fe7d24482047fac1cb08d5e2591eaee7941bc00fdb4d0edb9e0ff81c7f0cd4'
  },
  {
    name: 'Wallet C (Receiver)',
    address: '0x8c4215b1b404e1ad2949459c7eff154a2087d2b884334617645a75f96220c836'
  }
];

async function checkAllBalances() {
  console.log('💰 Checking balances for all wallets...\n');
  console.log('=' .repeat(80));

  let totalSui = 0;
  let totalUsdc = 0;

  for (const wallet of wallets) {
    try {
      console.log(`\n📍 ${wallet.name}`);
      console.log(`   Address: ${wallet.address}`);
      
      const balance = await suiService.getBalance(wallet.address);
      
      const suiBalance = parseFloat(balance.sui.formatted);
      const usdcBalance = parseFloat(balance.usdc.formatted);
      
      totalSui += suiBalance;
      totalUsdc += usdcBalance;
      
      console.log(`   💎 SUI:  ${balance.sui.formatted} SUI`);
      console.log(`   💵 USDC: ${balance.usdc.formatted} USDC`);
      
      if (suiBalance === 0 && usdcBalance === 0) {
        console.log(`   ⚠️  Empty wallet - needs funding`);
      } else if (suiBalance > 0 && usdcBalance === 0) {
        console.log(`   ✅ Has SUI for gas, no USDC`);
      } else if (suiBalance > 0 && usdcBalance > 0) {
        console.log(`   🎉 Fully funded wallet`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log('📊 SUMMARY:');
  console.log(`   Total SUI across all wallets:  ${totalSui.toFixed(9)} SUI`);
  console.log(`   Total USDC across all wallets: ${totalUsdc.toFixed(6)} USDC`);
  console.log(`   Number of wallets: ${wallets.length}`);
  
  if (totalSui === 0) {
    console.log('\n🚨 No wallets have SUI! Fund them with:');
    console.log('   curl -X POST https://faucet.testnet.sui.io/v2/gas \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"FixedAmountRequest":{"recipient":"WALLET_ADDRESS"}}\'');
  }
}

// Run the balance check
checkAllBalances().catch(console.error);
