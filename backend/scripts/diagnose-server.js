const { Client: SSHClient } = require('ssh2');
require('dotenv').config();

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

const ssh = new SSHClient();

function executeCommand(conn, command) {
    return new Promise((resolve, reject) => {
        console.log(`\n> ${command}`);
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('close', (code, signal) => {
                resolve({ code, output });
            }).on('data', (data) => {
                output += data;
                process.stdout.write(data);
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
            });
        });
    });
}

async function diagnose() {
    console.log(`Connecting to ${config.host}...`);
    
    ssh.on('ready', async () => {
        console.log('SSH Ready');
        try {
            // Check PM2 status
            await executeCommand(ssh, 'pm2 list');
            
            // Check specific app logs
            await executeCommand(ssh, 'pm2 logs pay4u-backend --lines 50 --nostream');

            // Check if MongoDB is running
            await executeCommand(ssh, 'systemctl status mongod --no-pager || systemctl status mongodb --no-pager');

            // Check if .env exists
            await executeCommand(ssh, 'ls -la /var/www/pay4u/backend/.env');

            ssh.end();
        } catch (err) {
            console.error('Diagnosis failed:', err);
            ssh.end();
        }
    }).on('error', (err) => {
        console.error('Connection failed:', err);
    }).connect(config);
}

diagnose();
