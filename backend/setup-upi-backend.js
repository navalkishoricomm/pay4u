const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Setup script for UPI backend modifications
console.log('🚀 Setting up UPI backend modifications...');

try {
  // 1. Create uploads directory for UPI barcodes
  const uploadsDir = path.join(__dirname, 'uploads', 'upi-barcodes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads/upi-barcodes directory');
  } else {
    console.log('✅ uploads/upi-barcodes directory already exists');
  }

  // 2. Install multer dependency
  console.log('📦 Installing multer dependency...');
  try {
    execSync('npm install multer', { stdio: 'inherit' });
    console.log('✅ Multer installed successfully');
  } catch (error) {
    console.log('⚠️  Please install multer manually: npm install multer');
  }

  // 3. Create .gitignore entry for uploads (if .gitignore exists)
  const gitignorePath = path.join(__dirname, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('uploads/')) {
      fs.appendFileSync(gitignorePath, '\n# UPI barcode uploads\nuploads/\n');
      console.log('✅ Added uploads/ to .gitignore');
    }
  }

  console.log('\n🎉 UPI backend setup completed!');
  console.log('\n📋 Summary of changes:');
  console.log('  ✅ Modified walletController.js - Added UPI validation and barcode handling');
  console.log('  ✅ Modified wallet.js routes - Added multer middleware for file uploads');
  console.log('  ✅ Created uploads/upi-barcodes directory');
  console.log('  ✅ Multer dependency ready for installation');
  
  console.log('\n🔧 Next steps:');
  console.log('  1. Restart your backend server');
  console.log('  2. Test UPI payment with barcode upload from frontend');
  console.log('  3. Check admin panel for pending UPI transactions');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}