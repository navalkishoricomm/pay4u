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
    remoteDir: process.env.REMOTE_APP_DIR || '/var/www/pay4u',
};

if (!config.host || !config.username || !config.password) {
    console.error('Error: SSH credentials missing in .env');
    process.exit(1);
}

const sftp = new Client();
const ssh = new SSHClient();

async function executeCommand(conn, command) {
    return new Promise((resolve, reject) => {
        console.log(`\n> ${command}`);
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('close', (code, signal) => {
                if (code !== 0) reject(new Error(`Command failed with code ${code}`));
                else resolve(output);
            }).on('data', (data) => {
                output += data;
                process.stdout.write(data);
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
            });
        });
    });
}

async function run() {
    try {
        console.log(`Connecting to ${config.host}...`);
        await sftp.connect(config);
        
        const localScriptPath = path.join(__dirname, 'createAdmin.js');
        const remoteScriptPath = `${config.remoteDir}/backend/scripts/createAdmin.js`.replace(/\\/g, '/');
        
        console.log(`Uploading ${localScriptPath} to ${remoteScriptPath}...`);
        await sftp.put(localScriptPath, remoteScriptPath);
        console.log('Upload complete.');
        
        await sftp.end();

        console.log('Connecting via SSH to execute script...');
        
        await new Promise((resolve, reject) => {
            ssh.on('ready', async () => {
                try {
                    const remoteBackendPath = `${config.remoteDir}/backend`.replace(/\\/g, '/');
                    // We need to pass the environment variables explicitly or rely on .env being there.
                    // Since .env is there, we just run node scripts/createAdmin.js
                    await executeCommand(ssh, `cd ${remoteBackendPath} && node scripts/createAdmin.js`);
                    ssh.end();
                    resolve();
                } catch (e) {
                    ssh.end();
                    reject(e);
                }
            }).on('error', reject).connect(config);
        });

        console.log('Admin seeding completed successfully.');

    } catch (err) {
        console.error('Operation failed:', err);
        process.exit(1);
    }
}

run();
