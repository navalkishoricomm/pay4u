const Client = require('ssh2-sftp-client');
const { Client: SSHClient } = require('ssh2');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const config = {
    host: process.env.SSH_HOST,
    port: process.env.SSH_PORT || 22,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD,
    // privateKey: process.env.SSH_KEY_PATH ? fs.readFileSync(process.env.SSH_KEY_PATH) : undefined,
    // Handle private key path if provided
    privateKey: process.env.SSH_KEY_PATH ? fs.readFileSync(path.resolve(process.env.SSH_KEY_PATH)) : undefined,
    remoteDir: process.env.REMOTE_APP_DIR || '/var/www/pay4u',
};

if (!config.host || !config.username || (!config.password && !config.privateKey)) {
    console.error('Error: Please set SSH_HOST, SSH_USERNAME, and either SSH_PASSWORD or SSH_KEY_PATH in .env file');
    console.error('Example .env configuration:');
    console.error('SSH_HOST=192.168.1.100');
    console.error('SSH_USERNAME=root');
    console.error('SSH_PASSWORD=yourpassword');
    console.error('REMOTE_APP_DIR=/var/www/pay4u');
    process.exit(1);
}

const sftp = new Client();
const ssh = new SSHClient();

async function deploy() {
    try {
        console.log(`Connecting to ${config.host}...`);
        await sftp.connect(config);
        console.log('Connected via SFTP.');

        const backendDir = path.join(__dirname, '..');
        const frontendBuildDir = path.join(__dirname, '../../frontend/build');

        // ensure remote dir exists
        console.log(`Ensuring remote directory ${config.remoteDir} exists...`);
        try {
            await sftp.mkdir(config.remoteDir, true);
        } catch (e) {
            // ignore if exists or error, we'll see soon
            console.log('Note on mkdir:', e.message);
        }

        const remoteBackendDir = path.join(config.remoteDir, 'backend').replace(/\\/g, '/');

        // Upload backend
        console.log(`Backend uploading to ${remoteBackendDir}...`);
        
        try {
             await sftp.mkdir(remoteBackendDir, true);
        } catch (e) {}

        await sftp.uploadDir(backendDir, remoteBackendDir, { 
            filter: (itemPath, isDir) => {
                const basename = path.basename(itemPath);
                if (basename === 'node_modules') return false;
                if (basename === '.git') return false;
                if (basename === '.env') return false;
                if (basename === 'logs') return false;
                if (basename === 'coverage') return false;
                if (basename === 'dist') return false;
                return true;
            }
        });
        console.log('Backend uploaded.');

        // Upload frontend build
        if (fs.existsSync(frontendBuildDir)) {
            console.log('Uploading frontend build...');
            const remoteFrontendDir = path.join(config.remoteDir, 'frontend/build').replace(/\\/g, '/');
            try {
                await sftp.mkdir(remoteFrontendDir, true);
            } catch (e) {}
            
            await sftp.uploadDir(frontendBuildDir, remoteFrontendDir);
            console.log('Frontend uploaded.');
        } else {
            console.warn('Frontend build directory not found. Skipping frontend upload. Run "npm run build" in frontend folder first.');
        }

        await sftp.end();
        console.log('SFTP connection closed.');

        // Connect via SSH to run commands
        console.log('Connecting via SSH to run post-deployment commands...');
        await new Promise((resolve, reject) => {
            ssh.on('ready', () => {
                console.log('SSH Ready');
                // Run commands
                // We use unix style paths for remote
                const remoteBackendPath = `${config.remoteDir}/backend`.replace(/\\/g, '/');
                
                const commands = [
                    `cd ${remoteBackendPath}`,
                    'echo "Installing dependencies..."',
                    'npm install --production',
                    'echo "Dependencies installed."'
                ];
                
                const commandStr = commands.join(' && ');
                console.log('Executing:', commandStr);
                
                ssh.exec(commandStr, (err, stream) => {
                    if (err) return reject(err);
                    stream.on('close', (code, signal) => {
                        console.log('Remote command exited with code ' + code);
                        ssh.end();
                        if (code === 0) resolve();
                        else reject(new Error(`Remote command failed with code ${code}`));
                    }).on('data', (data) => {
                        process.stdout.write('REMOTE: ' + data);
                    }).stderr.on('data', (data) => {
                        process.stderr.write('REMOTE ERR: ' + data);
                    });
                });
            }).on('error', (err) => {
                reject(err);
            }).connect(config);
        });

        console.log('Deployment completed successfully!');
        process.exit(0);

    } catch (err) {
        console.error('Deployment failed:', err);
        try { sftp.end(); } catch(e) {}
        try { ssh.end(); } catch(e) {}
        process.exit(1);
    }
}

deploy();
