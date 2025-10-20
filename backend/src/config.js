// config.js - make dotenv optional
let dotenv;
try {
  dotenv = require('dotenv');
  dotenv.config();
} catch (e) {
  console.log('dotenv not found, using environment variables directly');
}

const CONFIG = {
  // Server settings
  PORT: process.env.PORT || 3000,
  HTTPS_PORT: process.env.HTTPS_PORT || 3443,
  
  // Authentication
  AUTH_USER: process.env.AUTH_USER || 'courseadmin',
  AUTH_PASS: process.env.AUTH_PASS || 'A1b2C3d4!',
  
  // Email settings
  SMTP_USER: process.env.SMTP_USER || 'your-email@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'your-app-password',
  NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
  
  // Rate limiting
  ALERT_COOLDOWN: parseInt(process.env.ALERT_COOLDOWN) || 5 * 60 * 1000, // 5 minutes
  
  // SSL
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || './cert.pem',
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || './key.pem'
};

module.exports = CONFIG;