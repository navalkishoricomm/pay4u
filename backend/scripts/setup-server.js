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

const nginxConfig = `
server {
    listen 8080;
    server_name _;

    root /var/www/pay4u/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

function executeCommand(conn, command) {
    return new Promise((resolve, reject) => {
        console.log(`Executing: ${command}`);
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            let error = '';
            stream.on('close', (code, signal) => {
                if (code === 0) resolve(output);
                else reject(new Error(`Command failed with code ${code}: ${error}`));
            }).on('data', (data) => {
                output += data;
                process.stdout.write(data);
            }).stderr.on('data', (data) => {
                error += data;
                process.stderr.write(data);
            });
        });
    });
}

async function setup() {
    console.log(`Connecting to ${config.host}...`);
    
    ssh.on('ready', async () => {
        console.log('SSH Ready');
        try {
            // 1. Install PM2 if not present
            console.log('\n--- Checking/Installing PM2 ---');
            await executeCommand(ssh, 'npm list -g pm2 || npm install -g pm2');

            // 2. Start/Restart Backend with PM2
            console.log('\n--- Configuring PM2 for Backend ---');
            // Check if process exists
            const pm2Command = `
                cd /var/www/pay4u/backend && 
                npm install --production && 
                (pm2 describe pay4u-backend > /dev/null && pm2 restart pay4u-backend) || 
                pm2 start server.js --name pay4u-backend --env production
            `;
            await executeCommand(ssh, pm2Command);
            await executeCommand(ssh, 'pm2 save');

            // 3. Configure Nginx
            console.log('\n--- Configuring Nginx ---');
            // Write config file (using echo and redirection, might be tricky with newlines, so we use printf or base64)
            // Safest way is to base64 encode and decode on server
            const b64Config = Buffer.from(nginxConfig).toString('base64');
            await executeCommand(ssh, `echo "${b64Config}" | base64 -d > /etc/nginx/sites-available/pay4u`);
            
            // Enable site
            await executeCommand(ssh, 'ln -sf /etc/nginx/sites-available/pay4u /etc/nginx/sites-enabled/');
            
            // Test and Reload Nginx
            await executeCommand(ssh, 'nginx -t && systemctl reload nginx');

            console.log('\n--------------------------------------------------');
            console.log('Setup Completed Successfully!');
            console.log(`Your app should be accessible at: http://${config.host}:8080`);
            console.log('--------------------------------------------------');
            
            ssh.end();
        } catch (err) {
            console.error('Setup failed:', err);
            ssh.end();
            process.exit(1);
        }
    }).on('error', (err) => {
        console.error('Connection failed:', err);
        process.exit(1);
    }).connect(config);
}

setup();
