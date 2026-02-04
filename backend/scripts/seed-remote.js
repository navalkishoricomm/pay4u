const { Client } = require('ssh2');
const ClientSFTP = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    host: process.env.SSH_HOST,
    port: process.env.SSH_PORT || 22,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD,
    remoteDir: process.env.REMOTE_APP_DIR || '/var/www/pay4u',
};

if (!config.host) {
    console.error('Missing SSH_HOST in .env');
    process.exit(1);
}

async function uploadFiles() {
    const sftp = new ClientSFTP();
    try {
        console.log(`Connecting via SFTP to ${config.host}...`);
        await sftp.connect(config);
        console.log('Connected via SFTP.');

        const remoteBackendDir = path.join(config.remoteDir, 'backend').replace(/\\/g, '/');
        const localScriptsDir = path.join(__dirname);
        const remoteScriptsDir = path.join(remoteBackendDir, 'scripts').replace(/\\/g, '/');
        
        // Ensure remote scripts dir exists
        try {
            await sftp.mkdir(remoteScriptsDir, true);
        } catch (e) {}

        // Upload specific seed scripts
        const scriptsToUpload = [
            'seedAllOperators.js',
            'seedBrandVouchers.js',
            'seedGiftVouchers.js',
            'seedElectricityOperators.js',
            'seedBBPSOperators.js',
            'seedPaysprintProvider.js'
        ];

        for (const script of scriptsToUpload) {
            const localPath = path.join(localScriptsDir, script);
            const remotePath = path.join(remoteScriptsDir, script).replace(/\\/g, '/');
            if (fs.existsSync(localPath)) {
                console.log(`Uploading ${script}...`);
                await sftp.put(localPath, remotePath);
            } else {
                console.warn(`Warning: ${script} not found locally.`);
            }
        }

        // Upload models to ensure schema consistency
        const localModelsDir = path.join(__dirname, '../models');
        const remoteModelsDir = path.join(remoteBackendDir, 'models').replace(/\\/g, '/');
        
        if (fs.existsSync(localModelsDir)) {
             console.log('Uploading models...');
             await sftp.uploadDir(localModelsDir, remoteModelsDir);
        }

        await sftp.end();
        console.log('SFTP upload complete.');
    } catch (err) {
        console.error('SFTP Error:', err);
        throw err;
    }
}

function execRemote(conn, command) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let stdout = '';
            let stderr = '';
            stream.on('close', (code) => {
                if (code === 0) resolve(stdout);
                else reject(new Error(stderr || `Command failed with code ${code}`));
            }).on('data', (data) => {
                stdout += data.toString();
                process.stdout.write(data.toString());
            }).stderr.on('data', (data) => {
                stderr += data.toString();
                process.stderr.write(data.toString());
            });
        });
    });
}

async function runSeeds() {
    const conn = new Client();
    
    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('SSH Ready');
            try {
                const remoteBackendPath = `${config.remoteDir}/backend`.replace(/\\/g, '/');
                
                console.log('Running seedAllOperators.js...');
                await execRemote(conn, `cd ${remoteBackendPath} && node scripts/seedAllOperators.js`);
                
                console.log('Running seedBrandVouchers.js...');
                await execRemote(conn, `cd ${remoteBackendPath} && node scripts/seedBrandVouchers.js`);
                
                // Check if seedGiftVouchers.js exists locally before trying to run it
                if (fs.existsSync(path.join(__dirname, 'seedGiftVouchers.js'))) {
                    console.log('Running seedGiftVouchers.js...');
                    await execRemote(conn, `cd ${remoteBackendPath} && node scripts/seedGiftVouchers.js`);
                }

                console.log('Running seedElectricityOperators.js...');
                await execRemote(conn, `cd ${remoteBackendPath} && node scripts/seedElectricityOperators.js`);

                console.log('Running seedBBPSOperators.js...');
                // Check if seedBBPSOperators.js exists locally before trying to run it
                if (fs.existsSync(path.join(__dirname, 'seedBBPSOperators.js'))) {
                     await execRemote(conn, `cd ${remoteBackendPath} && node scripts/seedBBPSOperators.js`);
                }

                console.log('Running seedPaysprintProvider.js...');
                await execRemote(conn, `cd ${remoteBackendPath} && node scripts/seedPaysprintProvider.js`);

                conn.end();
                resolve();
            } catch (err) {
                conn.end();
                reject(err);
            }
        }).on('error', (err) => {
            reject(err);
        }).connect(config);
    });
}

async function main() {
    try {
        await uploadFiles();
        await runSeeds();
        console.log('Remote seeding completed successfully.');
    } catch (err) {
        console.error('Remote seeding failed:', err);
        process.exit(1);
    }
}

main();
