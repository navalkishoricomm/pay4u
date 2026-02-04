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

async function run() {
  const conn = new Client();
  conn.on('ready', async () => {
    try {
      // 1) Install certbot if missing
      await execRemote(conn, 'which certbot || (apt-get update && apt-get install -y certbot python3-certbot-nginx)');

      // 2) Prepare temporary HTTP config to serve ACME challenge via webroot
      const tempHttpConfig = `
server {
    listen 80;
    server_name pay4u.co.in www.pay4u.co.in;

    root /var/www/pay4u/frontend/build;
    index index.html;

    location /.well-known/acme-challenge/ {
        allow all;
    }

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
      const tempB64 = Buffer.from(tempHttpConfig).toString('base64');
      await execRemote(conn, `echo "${tempB64}" | base64 -d > /etc/nginx/sites-available/pay4u_temp_http`);
      await execRemote(conn, 'ln -sf /etc/nginx/sites-available/pay4u_temp_http /etc/nginx/sites-enabled/pay4u_temp_http');
      await execRemote(conn, 'nginx -t');
      await execRemote(conn, 'service nginx reload');

      // 3) Obtain certificate for pay4u.co.in and www.pay4u.co.in via webroot
      await execRemote(
        conn,
        'certbot certonly --webroot -w /var/www/pay4u/frontend/build --non-interactive --agree-tos --register-unsafely-without-email -d pay4u.co.in'
      );

      // 3) Write updated nginx config with HTTPS for pay4u
      const nginxConfig = `
upstream pay4u_backend {
    server localhost:5001;
}
upstream amul_backend {
    server localhost:4000;
}
upstream hisab_backend {
    server localhost:5002;
}

# Redirect HTTP to HTTPS for pay4u
server {
    listen 80;
    server_name pay4u.co.in;
    return 301 https://$host$request_uri;
}

# HTTPS for pay4u
server {
    listen 443 ssl;
    server_name pay4u.co.in;

    ssl_certificate /etc/letsencrypt/live/pay4u.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pay4u.co.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/pay4u/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://pay4u_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://pay4u_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Amul (HTTP only as requested)
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

# Hisab: keep HTTPS (already has certs) and redirect HTTP to HTTPS
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

      const b64 = Buffer.from(nginxConfig).toString('base64');
      await execRemote(conn, `echo "${b64}" | base64 -d > /etc/nginx/sites-available/pay4u_gateway`);

      // 4) Enable config and reload nginx
      await execRemote(conn, 'ln -sf /etc/nginx/sites-available/pay4u_gateway /etc/nginx/sites-enabled/pay4u_gateway');
      // Remove temporary HTTP config
      await execRemote(conn, 'rm -f /etc/nginx/sites-enabled/pay4u_temp_http');
      await execRemote(conn, 'nginx -t');
      await execRemote(conn, 'service nginx reload');

      // 5) Verify with curl (ignore certificate errors during propagation if any)
      await execRemote(conn, 'curl -I https://pay4u.co.in --max-time 10');
      await execRemote(conn, 'curl -I https://hisab.pay4u.co.in --max-time 10');

      conn.end();
      process.exit(0);
    } catch (err) {
      console.error('Provisioning failed:', err.message || err);
      conn.end();
      process.exit(1);
    }
  }).on('error', (err) => {
    console.error('SSH Error:', err.message || err);
    process.exit(1);
  }).connect(config);
}

run();
