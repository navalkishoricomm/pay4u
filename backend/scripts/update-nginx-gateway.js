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

const nginxConfig = `
# --- UPSTREAMS ---
upstream pay4u_backend {
    server localhost:5001;
}

upstream amul_backend {
    server localhost:4000;
}

upstream hisab_backend {
    server localhost:5002;
}

# --- PAY4U.CO.IN (Main) ---
server {
    listen 80;
    server_name pay4u.co.in www.pay4u.co.in;

    # Frontend Static Files
    root /var/www/pay4u/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://pay4u_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.io
    location /socket.io {
        proxy_pass http://pay4u_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# --- AMUL.PAY4U.CO.IN ---
server {
    listen 80;
    server_name amul.pay4u.co.in;

    location / {
        proxy_pass http://amul_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# --- HISAB.PAY4U.CO.IN ---
server {
    listen 80;
    server_name hisab.pay4u.co.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name hisab.pay4u.co.in;
    
    ssl_certificate /etc/letsencrypt/live/hisab.pay4u.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hisab.pay4u.co.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://hisab_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

const conn = new Client();

conn.on('ready', () => {
    console.log('SSH Client :: ready');
    
    // Encode config to avoid shell issues
    const b64Config = Buffer.from(nginxConfig).toString('base64');
    
    const cmds = [
        // 1. Write new config
        `echo "${b64Config}" | base64 -d > /etc/nginx/sites-available/pay4u_gateway`,
        
        // 2. Backup existing mobilehisab if it's a file
        'if [ -f /etc/nginx/sites-enabled/mobilehisab ] && [ ! -L /etc/nginx/sites-enabled/mobilehisab ]; then mv /etc/nginx/sites-enabled/mobilehisab /etc/nginx/sites-available/mobilehisab.old; fi',
        
        // 3. Remove existing links
        'rm -f /etc/nginx/sites-enabled/mobilehisab',
        'rm -f /etc/nginx/sites-enabled/pay4u',
        'rm -f /etc/nginx/sites-enabled/default',
        
        // 4. Link new config
        'ln -sf /etc/nginx/sites-available/pay4u_gateway /etc/nginx/sites-enabled/pay4u_gateway',
        
        // 5. Test and Reload
        'nginx -t && service nginx reload'
    ];

    const command = cmds.join(' && ');
    console.log('Executing Nginx update...');
    
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            process.stderr.write('STDERR: ' + data);
        });
    });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect(config);
