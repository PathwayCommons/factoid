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
const getTestAccount = () => nodemailer.createTestAccount();
const parseTestAccount = account => ({
  host: account.smtp.host,
  port: account.smtp.port,
  secure: account.smtp.secure,
  auth: {
    user: account.user,
    pass: account.pass
  } 
});
const createTransporter = ( transportOpts, messageOpts ) => nodemailer.createTransport( transportOpts, messageOpts );

const addHeaders = ( message, opts ) => {
  if( _.has( opts, 'mailJet' ) ){
    const mailJet = _.get( opts, 'mailJet' );
    return _.assign( {}, message, { headers: {
      'X-MJ-TemplateID': _.get( mailJet, ['template', 'id'] ),
      'X-MJ-TemplateLanguage': '1',
      'X-MJ-Vars': JSON.stringify( _.get( mailJet, ['template', 'vars'] ) )
    }});
  }
};

const email = {

  transportDefaults: {
    port: SMTP_PORT,
    host: SMTP_HOST,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  },
  
  messageDefaults: {
    from: {
      name: EMAIL_FROM,
      address: EMAIL_FROM_ADDR
    }
  },

  getTransporter: async function(){
    if( this.transporter ){
      return this.transporter;
    } else {
      let transportOpts = _.assign( {}, this.transportDefaults );
      let messageOpts = _.assign( {}, this.messageDefaults );
      if( !EMAIL_ENABLED ) {
        logger.info( `Mocking email transport` );
        const account = await getTestAccount();
        _.assign( transportOpts, parseTestAccount( account ) );
      }
      return this.transporter = createTransporter( transportOpts, messageOpts );
    }
  },

  sendMail: function( message ) {
    return this.getTransporter().then( t => t.sendMail( message ) );
  }
};

const sendMail = opts => {

  let message = _.pick( opts, [ 'from', 'to', 'cc', 'bcc', 'subject', 'text', 'html', 'attachments' ] );
  message = addHeaders( message, opts );
  return email.sendMail( message )
    .then( logInfo )
    .catch( logErr );
};

export default sendMail;
