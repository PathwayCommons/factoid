import _ from 'lodash';
import nodemailer from 'nodemailer';

import { SMTP_PORT, SMTP_HOST, SMTP_USER, SMTP_PASSWORD, 
  EMAIL_FROM, EMAIL_FROM_ADDR, 
  EMAIL_ENABLED } from '../config';
import logger from './logger';

const MSG_FIELDS = [ 'from', 'to', 'cc', 'bcc', 'subject', 'text', 'html', 'attachments' ];

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

const configureMessage = opts => {
  let message = _.pick( opts, MSG_FIELDS );  
  if( _.has( opts, [ 'template' ] ) ){
    const vendor = _.get( opts, ['template', 'vendor'] );
    
    switch( vendor ) {
      case 'Mailjet':
        message = _.assign( {}, message, { headers: {
          'X-MJ-TemplateID': _.get( opts, ['template', 'id'] ),
          'X-MJ-TemplateLanguage': '1',
          'X-MJ-Vars': JSON.stringify( _.get( ['template', 'vars'] ) )
        }})
        break;
      default:
    }
    
    return message;
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

  send: function( message ) {
    return this.getTransporter().then( t => t.sendMail( message ) );
  }
};

const sendMail = opts => {
  return Promise.resolve( opts )
    .then( configureMessage ) 
    .then( msg => email.send( msg ))  
    .then( logInfo )
    .catch( logErr );
};

export default sendMail;
