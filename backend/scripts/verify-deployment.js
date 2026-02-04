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

async function verify() {
    console.log(`Connecting to ${config.host}...`);
    
    ssh.on('ready', async () => {
        console.log('SSH Ready');
        try {
            console.log('Checking Backend Direct (localhost:5001)...');
            await executeCommand(ssh, 'curl -v http://localhost:5001/api/health');
            
            console.log('\nChecking Nginx Proxy (localhost:8080/api)...');
            await executeCommand(ssh, 'curl -v http://localhost:8080/api/health');

            ssh.end();
        } catch (err) {
            console.error('Verification failed:', err);
            ssh.end();
        }
    }).on('error', (err) => {
        console.error('Connection failed:', err);
    }).connect(config);
}

verify();
