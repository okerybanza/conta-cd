module.exports = {
  apps: [
    {
      name: 'conta-backend',
      script: './backend/dist/server.js',
      cwd: '/home/conta/conta.cd-prod',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001  // PORT FIXE PRODUCTION - NE PAS CHANGER
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
