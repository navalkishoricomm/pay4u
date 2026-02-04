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

function execRemote(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        if (code === 0) resolve({ stdout, stderr });
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

(async () => {
  const conn = new Client();
  conn.on('ready', async () => {
    try {
      await execRemote(conn, 'ls -la /etc/letsencrypt/live/pay4u.co.in/');
      await execRemote(conn, 'curl -Ik https://pay4u.co.in --max-time 10');
      await execRemote(conn, 'curl -Ik https://hisab.pay4u.co.in --max-time 10');
      conn.end();
      process.exit(0);
    } catch (err) {
      console.error('Verification failed:', err.message || err);
      conn.end();
      process.exit(1);
    }
  }).on('error', (err) => {
    console.error('SSH Error:', err.message || err);
    process.exit(1);
  }).connect(config);
})(); 
