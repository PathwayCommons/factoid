const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix'
});

module.exports = transport;