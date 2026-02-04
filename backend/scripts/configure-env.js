const { Client: SSHClient } = require('ssh2');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const config = {
    host: process.env.SSH_HOST,
    port: process.env.SSH_PORT || 22,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD,
};

if (!config.host || !config.username || !config.password) {
    console.error('Error: SSH credentials missing in .env');
    process.exit(1);
}

// Read local .env
const localEnvPath = path.join(__dirname, '../.env');
if (!fs.existsSync(localEnvPath)) {
    console.error('Error: Local .env file not found');
    process.exit(1);
}

let envContent = fs.readFileSync(localEnvPath, 'utf8');

// Ensure PORT is 5001 (it might be already, but let's be safe)
if (!envContent.includes('PORT=5001')) {
    envContent = envContent.replace(/PORT=\d+/, 'PORT=5001');
    if (!envContent.includes('PORT=')) {
        envContent += '\nPORT=5001';
    }
}

// Ensure NODE_ENV is production
envContent = envContent.replace(/NODE_ENV=development/, 'NODE_ENV=production');

// Fix MONGO_URI for remote server if it is using localhost
// If the local .env uses 'localhost', it should work on the remote server too assuming Mongo is installed there.
// If not, we might need to adjust it. But let's assume standard VPS setup.

const ssh = new SSHClient();

function executeCommand(conn, command) {
    return new Promise((resolve, reject) => {
        console.log(`\n> ${command}`);
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('close', (code, signal) => {
                if (code === 0) resolve(output);
                else reject(new Error(`Command failed with code ${code}`));
            }).on('data', (data) => {
                output += data;
                process.stdout.write(data);
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
            });
        });
    });
}

async function configureEnv() {
    console.log(`Connecting to ${config.host}...`);
    
    ssh.on('ready', async () => {
        console.log('SSH Ready');
        try {
            console.log('Uploading .env file...');
            
            // Encode content to base64 to avoid shell escaping issues
            const b64Content = Buffer.from(envContent).toString('base64');
            
            await executeCommand(ssh, `echo "${b64Content}" | base64 -d > /var/www/pay4u/backend/.env`);
            
            console.log('.env uploaded successfully.');

            // Restart backend
            console.log('Restarting backend...');
            await executeCommand(ssh, 'pm2 restart pay4u-backend');
            
            console.log('Backend restarted.');
            
            // Check status again
            await executeCommand(ssh, 'pm2 list');
            
            // Wait a second for startup
            await new Promise(r => setTimeout(r, 2000));
            
            // Check logs
            await executeCommand(ssh, 'pm2 logs pay4u-backend --lines 20 --nostream');

            ssh.end();
        } catch (err) {
            console.error('Configuration failed:', err);
            ssh.end();
            process.exit(1);
        }
    }).on('error', (err) => {
        console.error('Connection failed:', err);
        process.exit(1);
    }).connect(config);
}

configureEnv();
