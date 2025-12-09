const express = require('express');
const mailer = require('./mailer');
const logger = require('./utils/logger');
const CONFIG = require('./config');

const router = express.Router();

// Rate limiting
let lastAlert = null;

// Basic authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  if (username === CONFIG.AUTH_USER && password === CONFIG.AUTH_PASS) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    protocol: 'https'
  });
});

// Main alert endpoint
router.post('/alert', authenticate, async (req, res) => {
  try {
    const courses = req.body;
    
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: 'Invalid course data' });
    }
    
    // Validate course structure
    const isValidCourse = (course) => {
      return course && 
             typeof course.code === 'string' && 
             typeof course.title === 'string' &&
             typeof course.isFull === 'boolean';
    };
    
    if (!courses.every(isValidCourse)) {
      return res.status(400).json({ error: 'Invalid course structure' });
    }
    
    logger.info(`New course availability alert for ${courses.length} courses:`, 
                courses.map(c => c.code));
    
    // Check rate limiting
    const now = Date.now();
    if (lastAlert && (now - lastAlert) < CONFIG.ALERT_COOLDOWN) {
      logger.warn('Alert skipped due to rate limiting');
      return res.json({ 
        message: 'Alert received but skipped due to rate limiting',
        nextAlertAvailableIn: Math.ceil((CONFIG.ALERT_COOLDOWN - (now - lastAlert)) / 1000)
      });
    }
    
    // Send email
    await mailer.sendCourseAlert(courses);
    lastAlert = now;
    
    res.json({ 
      message: 'Alert processed and email sent',
      coursesProcessed: courses.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Alert endpoint error:', error);
    
    if (error.message.startsWith('Email failed:')) {
      res.status(500).json({ 
        error: 'Alert received but email failed to send',
        details: error.message 
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;