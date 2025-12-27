const nodemailer = require('nodemailer');
const CONFIG = require('./config');
const logger = require('./utils/logger');

class Mailer {
 // mailer.js - add initialization check
constructor() {
  try {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: CONFIG.SMTP_USER,
        pass: CONFIG.SMTP_PASS
      }
    });
  } catch (error) {
    console.error('Failed to initialize mailer:', error);
    throw error;
  }
}

  async sendCourseAlert(courses) {
    const courseList = courses.map(c => `${c.code}: ${c.title}`).join('\n');
    const emailSubject = courses.length === 1 
      ? `🚨 UAlberta Course Available: ${courses[0].code}`
      : `🚨 ${courses.length} UAlberta Courses Available`;
          
    const emailText = `Course spots now available!\n\n${courseList}\n\nTime: ${new Date().toLocaleString()}\n\nCheck BearTracks immediately!`;
    
    try {
      await this.transporter.sendMail({
        from: CONFIG.SMTP_USER,
        to: CONFIG.NOTIFICATION_EMAIL,
        subject: emailSubject,
        text: emailText
      });

      logger.info('Email notification sent successfully');
      return { success: true };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error(`Email failed: ${error.message}`);
    }
  }
}

module.exports = new Mailer();