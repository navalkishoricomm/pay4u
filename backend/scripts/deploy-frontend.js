const Client = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const config = {
    host: process.env.SSH_HOST,
    port: process.env.SSH_PORT || 22,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD,
    remoteDir: process.env.REMOTE_APP_DIR || '/var/www/pay4u',
};

if (!config.host || !config.username || !config.password) {
    console.error('Error: SSH credentials missing in .env');
    process.exit(1);
}

const sftp = new Client();

async function deployFrontend() {
    try {
        console.log(`Connecting to ${config.host}...`);
        await sftp.connect(config);
        console.log('Connected via SFTP.');

        const frontendBuildDir = path.join(__dirname, '../../frontend/build');
        const remoteFrontendDir = path.join(config.remoteDir, 'frontend/build').replace(/\\/g, '/');

        if (fs.existsSync(frontendBuildDir)) {
            console.log(`Uploading frontend build from ${frontendBuildDir} to ${remoteFrontendDir}...`);
            
            // Ensure remote dir exists
            try {
                await sftp.mkdir(remoteFrontendDir, true);
            } catch (e) {}
            
            await sftp.uploadDir(frontendBuildDir, remoteFrontendDir);
            console.log('Frontend uploaded successfully.');
        } else {
            console.error('Frontend build directory not found. Run "npm run build" in frontend folder first.');
            process.exit(1);
        }

        await sftp.end();
        console.log('SFTP connection closed.');
        process.exit(0);

    } catch (err) {
        console.error('Deployment failed:', err);
        try { sftp.end(); } catch(e) {}
        process.exit(1);
    }
}

deployFrontend();
