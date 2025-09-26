#!/usr/bin/env node

/**
 * Setup script for PayWiser Sui Backend
 * This script helps with initial setup and testing
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 PayWiser Backend Setup');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Copying .env.example to .env');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
  } else {
    console.log('❌ .env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file exists');
}

console.log('\n📝 Next steps:');
console.log('1. Edit .env file with your configuration');
console.log('2. Add your gas sponsor private key (optional)');
console.log('3. Run: npm install');
console.log('4. Run: npm run dev');
console.log('\n🌐 The server will be available at: http://localhost:3000');
console.log('📖 Check README.md for detailed API documentation');

console.log('\n🧪 Testing:');
console.log('- Use test-api.http file for API testing');
console.log('- Health check: GET http://localhost:3000/health');
console.log('- Create wallet: POST http://localhost:3000/api/wallet/create');

console.log('\n✨ Setup completed successfully!');

