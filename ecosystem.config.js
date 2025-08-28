module.exports = {
  apps: [
    {
      name: 'pay4u-backend',
      script: './backend/server.js',
      cwd: '/opt/pay4u/app',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        MONGO_URI: 'mongodb://localhost:27017/pay4u_production',
        JWT_SECRET: 'your_super_secure_jwt_secret_key_here_change_this_in_production',
        JWT_EXPIRES_IN: 604800
      },
      error_file: '/opt/pay4u/logs/backend-error.log',
      out_file: '/opt/pay4u/logs/backend-out.log',
      log_file: '/opt/pay4u/logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads'
      ],
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      kill_timeout: 5000
    }
  ],

  deploy: {
    production: {
      user: 'pay4u',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/navalkishoricomm/pay4u.git',
      path: '/opt/pay4u/app',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /opt/pay4u/logs'
    }
  }
};