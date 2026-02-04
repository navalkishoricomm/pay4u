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

const conn = new Client();

conn.on('ready', () => {
    console.log('SSH Client :: ready');
    
    const cmds = [
        'echo "--- Search Port in Amul ---"',
        'grep -r "listen" /var/www/amuldist/server/ || echo "grep listen failed"',
        'grep -r "PORT" /var/www/amuldist/server/ || echo "grep PORT failed"',
        'echo "--- Cat .env ---"',
        'cat /var/www/amuldist/server/.env || echo "No .env"',
        'echo "--- Certs ---"',
        'ls -F /etc/letsencrypt/live/ || echo "ls certs failed"'
    ];

    const command = cmds.join(' ; ');
    
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code);
            conn.end();
        }).on('data', (data) => {
            output += data;
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        }).on('end', () => {
            console.log(output);
        });
    });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect(config);
