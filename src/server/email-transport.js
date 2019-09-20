import _ from 'lodash';
import nodemailer from 'nodemailer';

import { SMTP_PORT, SMTP_HOST, SMTP_USER, SMTP_PASSWORD, 
  EMAIL_FROM, EMAIL_FROM_ADDR, 
  EMAIL_ENABLED } from '../config';

import logger from './logger';

const logInfo = info => {
  logger.info( `Email sent: ${info.messageId}` );
  if( !EMAIL_ENABLED ) logger.info( `Preview URL: ${nodemailer.getTestMessageUrl( info )}` );
};
const logErr = err => logger.error( `Error: ${err.message}` );

let transporter;
async function getTransporter(){
  
  if( transporter ) return transporter;
  
  let transport = {
    port: SMTP_PORT,
    host: SMTP_HOST,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  };

  const messageDefaults = {
    from: {
      name: EMAIL_FROM,
      address: EMAIL_FROM_ADDR
    }
  };
  
  try {
    // Mock out email transport with Ethereal when !EMAIL_ENABLED
    if( !EMAIL_ENABLED ){
      logger.info( `Mocking email transport` );
      const account = await nodemailer.createTestAccount();
      logger.info( `Mock email account created`);
      transport = {
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass
        }
      };
    }

    return transporter = nodemailer.createTransport( transport, messageDefaults );

  } catch( err ) { 
    logErr( err ) 
  }
   
};

const sendMail = opts => {

  const message = _.pick( opts, [ 'from', 'to', 'cc', 'bcc', 'subject', 'text', 'html', 'attachments' ] );

  // MailJet-specific: must use a validated domain 
  if( _.has( opts, 'template' ) ){
    _.set( message, 'headers', {
      'X-MJ-TemplateID': _.get( opts, ['template', 'id'] ),
      'X-MJ-TemplateLanguage': '1',
      'X-MJ-Vars': JSON.stringify( _.get( opts, ['template', 'vars'] ) )
    });
  }

  return getTransporter()
    .then( transporter => transporter.sendMail( message ) )
    .then( logInfo )
    .catch( logErr );
};

export default sendMail;
