// Manual SSL Configuration Steps for Pay4U
// Run this script to update backend CORS and get step-by-step instructions

const fs = require('fs');
const path = require('path');

console.log('🔐 Pay4U Manual SSL Configuration');
console.log('=================================\n');

// Step 4: Update Backend CORS Configuration
console.log('📝 Step 4: Updating Backend CORS Configuration...');

const serverJsPath = path.join(__dirname, 'backend', 'server.js');
const appJsPath = path.join(__dirname, 'backend', 'app.js');

let serverFile = null;
if (fs.existsSync(serverJsPath)) {
    serverFile = serverJsPath;
} else if (fs.existsSync(appJsPath)) {
    serverFile = appJsPath;
}

if (serverFile) {
    console.log(`✅ Found server file: ${serverFile}`);
    
    // Read current server file
    let serverContent = fs.readFileSync(serverFile, 'utf8');
    
    // Backup original file
    const backupPath = `${serverFile}.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, serverContent);
    console.log(`📋 Backed up original file to: ${backupPath}`);
    
    // Update CORS configuration
    const httpsOrigin = 'https://pay4u.co.in';
    
    // Check if CORS is already configured
    if (serverContent.includes('cors')) {
        console.log('🔄 Updating existing CORS configuration...');
        
        // Replace HTTP origins with HTTPS
        serverContent = serverContent.replace(
            /http:\/\/pay4u\.co\.in/g,
            httpsOrigin
        );
        
        // Add HTTPS origin if not present
        if (!serverContent.includes(httpsOrigin)) {
            // Find CORS origin array and add HTTPS origin
            const corsOriginRegex = /(origin:\s*\[)([^\]]*)(\])/;
            const match = serverContent.match(corsOriginRegex);
            
            if (match) {
                const origins = match[2].split(',').map(o => o.trim().replace(/['"`]/g, ''));
                if (!origins.some(origin => origin.includes('https://pay4u.co.in'))) {
                    origins.unshift(`'${httpsOrigin}'`);
                    const newOrigins = origins.join(',\n        ');
                    serverContent = serverContent.replace(
                        corsOriginRegex,
                        `$1\n        ${newOrigins}\n    $3`
                    );
                }
            }
        }
    } else {
        console.log('➕ Adding new CORS configuration...');
        
        // Add CORS configuration after express app creation
        const corsConfig = `
// CORS Configuration for HTTPS
const corsOptions = {
    origin: [
        '${httpsOrigin}',
        'http://localhost:3000', // Development
        'http://127.0.0.1:3000'  // Development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
`;
        
        // Find where to insert CORS config (after app creation)
        const appCreationRegex = /(const\s+app\s*=\s*express\(\);?)/;
        if (serverContent.match(appCreationRegex)) {
            serverContent = serverContent.replace(
                appCreationRegex,
                `$1${corsConfig}`
            );
        } else {
            console.log('⚠️  Could not automatically add CORS config. Please add manually.');
        }
    }
    
    // Write updated server file
    fs.writeFileSync(serverFile, serverContent);
    console.log('✅ Updated CORS configuration for HTTPS');
    
} else {
    console.log('⚠️  Server file not found. Please update CORS manually.');
}

// Step 5: Update Frontend Environment (if not already done)
console.log('\n📝 Step 5: Checking Frontend Environment...');

const frontendEnvPath = path.join(__dirname, 'frontend', '.env.production');
const envContent = `REACT_APP_API_URL=https://pay4u.co.in/api
REACT_APP_BASE_URL=https://pay4u.co.in
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
`;

if (fs.existsSync(frontendEnvPath)) {
    const currentEnv = fs.readFileSync(frontendEnvPath, 'utf8');
    if (currentEnv.includes('https://pay4u.co.in')) {
        console.log('✅ Frontend environment already configured for HTTPS');
    } else {
        fs.writeFileSync(frontendEnvPath, envContent);
        console.log('✅ Updated frontend environment for HTTPS');
    }
} else {
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log('✅ Created frontend environment file for HTTPS');
}

// Generate deployment commands
console.log('\n📝 Step 6: Deployment Commands');
console.log('==============================');

const deploymentCommands = {
    'Rebuild Frontend': 'cd frontend && npm run build',
    'Test Backend Locally': 'cd backend && node server.js',
    'Upload to Server': [
        '# Copy files to server (replace with your server details):',
        'scp -r frontend/build/* user@pay4u.co.in:/var/www/pay4u/frontend/build/',
        'scp backend/server.js user@pay4u.co.in:/var/www/pay4u/backend/',
        'scp nginx-ssl-config user@pay4u.co.in:~/'
    ],
    'Server Configuration': [
        '# On your server:',
        'sudo cp ~/nginx-ssl-config /etc/nginx/sites-available/pay4u',
        'sudo nginx -t',
        'sudo systemctl reload nginx',
        'pm2 restart all  # or sudo systemctl restart pay4u'
    ],
    'Test SSL': [
        'curl -I https://pay4u.co.in',
        'curl -I http://pay4u.co.in  # Should redirect to HTTPS',
        'curl -I https://pay4u.co.in/api/health'
    ]
};

Object.entries(deploymentCommands).forEach(([step, commands]) => {
    console.log(`\n🔧 ${step}:`);
    if (Array.isArray(commands)) {
        commands.forEach(cmd => console.log(`   ${cmd}`));
    } else {
        console.log(`   ${commands}`);
    }
});

// Step 7: Testing Instructions
console.log('\n📝 Step 7: Testing Checklist');
console.log('============================');

const testingSteps = [
    '✅ HTTPS loads without certificate errors',
    '✅ HTTP redirects to HTTPS (301/302 status)',
    '✅ API endpoints accessible via HTTPS',
    '✅ Login functionality works',
    '✅ Geolocation API works (main goal)',
    '✅ No mixed content warnings in browser console',
    '✅ All frontend assets load via HTTPS'
];

testingSteps.forEach(step => console.log(`   ${step}`));

console.log('\n🎯 Critical Test for Geolocation:');
console.log('================================');
console.log('1. Open https://pay4u.co.in in browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Run: navigator.geolocation.getCurrentPosition(console.log, console.error)');
console.log('5. Should prompt for location permission and return coordinates');

console.log('\n📋 Troubleshooting:');
console.log('==================');
console.log('• Nginx errors: sudo tail -f /var/log/nginx/error.log');
console.log('• SSL certificate: sudo certbot certificates');
console.log('• Backend logs: pm2 logs or sudo journalctl -u pay4u');
console.log('• Test SSL grade: https://www.ssllabs.com/ssltest/');

console.log('\n✅ Configuration Complete!');
console.log('=========================');
console.log('Your backend CORS has been updated for HTTPS.');
console.log('Follow the deployment commands above to complete SSL setup.');
console.log('\n🚀 After deployment, your app will support geolocation! 🎉');