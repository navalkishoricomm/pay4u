const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    host: process.env.SSH_HOST,
    port: process.env.SSH_PORT || 22,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD,
    privateKey: process.env.SSH_KEY_PATH ? fs.readFileSync(path.resolve(process.env.SSH_KEY_PATH)) : undefined,
};

if (!config.host) {
    console.error('Missing configuration');
    process.exit(1);
}

const conn = new Client();

conn.on('ready', () => {
    console.log('SSH Client :: ready');
    
    const cmds = [
        'ls -la /var/www/pay4u/frontend/build',
        'ls -la /var/www/pay4u/frontend/build/static/js',
        'chmod -R 755 /var/www/pay4u/frontend/build',
        'service nginx restart' // Requires sudo?
    ];

    // Chain commands
    const command = cmds.join(' && ');
    
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect(config);
