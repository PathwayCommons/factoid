const nodemailer = require('nodemailer');
const { SMTP_PORT, SMTP_HOST, SMTP_USER, SMTP_PASSWORD } = require('../config');

const transport = nodemailer.createTransport({
  port: SMTP_PORT,
  host: SMTP_HOST,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD
  }
});

module.exports = transport;