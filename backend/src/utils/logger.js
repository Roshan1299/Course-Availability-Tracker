const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    
    return JSON.stringify(logEntry);
  }

  // logger.js - add error handling for file operations
writeToFile(level, formattedMessage) {
  try {
    const filename = `${level}-${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(this.logDir, filename);
    fs.appendFileSync(filepath, formattedMessage + '\n');
  } catch (error) {
    // Fail silently if file writing doesn't work, still log to console
    console.error('Failed to write to log file:', error.message);
  }
}

  log(level, message, data = null) {
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Console output with colors
    const colors = {
      info: '\x1b[36m',    // cyan
      warn: '\x1b[33m',    // yellow
      error: '\x1b[31m',   // red
      debug: '\x1b[37m'    // white
    };
    
    console.log(`${colors[level] || ''}[${level.toUpperCase()}]${'\x1b[0m'} ${message}`, data ? data : '');
    
    // Write to file
    this.writeToFile(level, formattedMessage);
  }

  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
  debug(message, data) { this.log('debug', message, data); }
}

module.exports = new Logger();