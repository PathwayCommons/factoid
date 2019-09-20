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
  
  const defaults = {
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

    return transporter = nodemailer.createTransport( transport, defaults );

  } catch( err ) { 
    logErr( err ) 
  }
   
};

const sendMail = ( { to, cc, subject, html, text, templateInfo } ) => {
  const message = { 
    to, cc, subject, html, text
  };
  
  if( templateInfo ){
    const headers = {
      'X-MJ-TemplateID': _.get( templateInfo, 'templateId' ),
      'X-MJ-TemplateLanguage': '1',
      'X-MJ-Vars': JSON.stringify( _.get( templateInfo, 'variables' ) )
    }
    _.assign( message, { headers } );
  }

  return getTransporter()
    .then( transporter => transporter.sendMail( message ) )
    .then( logInfo )
    .catch( logErr );
};

export default sendMail;
