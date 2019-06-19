import nodemailer from 'nodemailer';
import { SMTP_PORT, SMTP_HOST, SMTP_USER, SMTP_PASSWORD } from '../config';

const transport = nodemailer.createTransport({
  port: SMTP_PORT,
  host: SMTP_HOST,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD
  }
});

export default transport;
