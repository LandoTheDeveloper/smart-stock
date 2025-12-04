module.exports = {
  apps: [{
    name: 'smartstock-api',
    script: 'npx',
    args: 'ts-node --files src/index.ts',
    cwd: '/var/www/smart-stock/server',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
