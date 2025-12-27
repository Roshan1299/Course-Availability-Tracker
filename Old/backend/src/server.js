const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const CONFIG = require('./config');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
function startServer() {
  if (fs.existsSync(CONFIG.SSL_CERT_PATH) && fs.existsSync(CONFIG.SSL_KEY_PATH)) {
    // HTTPS server
    const httpsOptions = {
      key: fs.readFileSync(CONFIG.SSL_KEY_PATH),
      cert: fs.readFileSync(CONFIG.SSL_CERT_PATH)
    };
    
    https.createServer(httpsOptions, app).listen(CONFIG.HTTPS_PORT, '0.0.0.0', () => {
      logger.info(`HTTPS Course monitor server running on port ${CONFIG.HTTPS_PORT}`);
      logger.info(`Health check: https://your-domain:${CONFIG.HTTPS_PORT}/health`);
    });
  } else {
    logger.warn('SSL certificates not found. Generate them with:');
    logger.warn('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes');
    
    // Fallback to HTTP
    app.listen(CONFIG.PORT, '0.0.0.0', () => {
      logger.info(`HTTP Course monitor server running on port ${CONFIG.PORT}`);
      logger.warn('WARNING: Running HTTP server. HTTPS recommended for production.');
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();