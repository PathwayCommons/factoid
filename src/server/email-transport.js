import _ from 'lodash';
import nodemailer from 'nodemailer';

import { SMTP_PORT, SMTP_HOST, SMTP_USER, SMTP_PASSWORD,
  EMAIL_FROM, EMAIL_FROM_ADDR,
  EMAIL_ENABLED,
  EMAIL_VENDOR_MAILJET } from '../config';
import logger from './logger';

const configMap = {
  transportOpts: {
    port: SMTP_PORT,
    host: SMTP_HOST,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  },

  // merged into every message object
  messageOpts: {
    from: {
      name: EMAIL_FROM,
      address: EMAIL_FROM_ADDR
    }
  },

  ALLOWED_MESSAGE_FIELDS: [
    'from', 'to', 'cc', 'bcc', 'replyTo',
    'subject',
    'text', 'html',
    'attachments'
  ],

  NODEMAILER_INFO_FIELDS: [ 'response','messageId', 'accepted', 'rejected' ]
};

const stateMap = {
  send: undefined
};

const handleResponse = res => {
  const info = _.pick( res, configMap.NODEMAILER_INFO_FIELDS );
  _.set( info, 'date', new Date() );
  if( !EMAIL_ENABLED ) _.set( info, 'previewUrl', nodemailer.getTestMessageUrl( res ) );
  logger.info( `Email sent to: ${info.accepted}; ${info.previewUrl ? 'Caught by Ethereal: ' + info.previewUrl: ''}` );
  return info;
};

const handleErr = err => {
  logger.error( `Error encountered in email delivery: ${err.message}` );
  throw err;
};

const getTestAccount = () => nodemailer.createTestAccount();

const getTestTransportOpts = account => ({
  host: account.smtp.host,
  port: account.smtp.port,
  secure: account.smtp.secure,
  auth: {
    user: account.user,
    pass: account.pass
  }
});

const configureMessage = opts => {
  let message = _.pick( opts, configMap.ALLOWED_MESSAGE_FIELDS );
  if( _.has( opts, [ 'template' ] ) ){
    const vendor = _.get( opts, ['template', 'vendor'] );
    switch( vendor ) {
      case EMAIL_VENDOR_MAILJET:
        _.set( message,  'headers', {
          'X-MJ-TemplateID': _.get( opts, ['template', 'id'] ),
          'X-MJ-TemplateLanguage': '1',
          'X-MJ-Vars': JSON.stringify( _.get( opts, ['template', 'vars'] ) )
        });
        break;
      default:
    }

    return message;
  }
};

const createTransporter = ( transportOpts, messageOpts ) => nodemailer.createTransport( transportOpts, messageOpts );
const transportOk = transporter => transporter.verify().then( () => true ).catch( handleErr );
const getSendImpl = transporter => transporter.sendMail.bind( transporter );

const getSend = async () => {
  if( stateMap.send ) return stateMap.send;

  if( !EMAIL_ENABLED ) {
    logger.info( `Mocking email transport` );
    const account = await getTestAccount();
    configMap.transportOpts = getTestTransportOpts( account );
  }
  const transporter = createTransporter( configMap.transportOpts, configMap.messageOpts );
  await transportOk( transporter );
  return stateMap.send = getSendImpl( transporter );
};

const send = message => getSend().then( s => s( message ) );

/**
 * sendMail
 *
 * Email sending service.
 * Configuration: When 'EMAIL_ENABLED' is false, mail will sent diretly to Ethereal, where it can be previewed via URL.
 * Third party email delivery services supported with 'templates' data
 *
 * @param { Object } opts The message data.
 * @param { String | Object | Array } opts.from (formatted and/or comma separated) email address(es)
 *  OR an oject with 'address' and 'name' fields OR a list of any above.
 * @param { Object } opts.to see opts.from
 * @param { Object } opts.cc see opts.from
 * @param { Object } opts.bcc see opts.from
 * @param { Object } opts.replyTo (formatted) email address | { name:, address: }
 * @param { String } opts.subject name, email address
 * @param { String } opts.html html version
 * @param { String } opts.text text version
 * @param { Array } opts.attachments See https://nodemailer.com/message/attachments/
 * @param { Object } opts.template
 * @param { String } opts.template.vendor The name of the vendor, assuming we support it
 * @param { String } opts.template.id The vendor template id
 * @param { Object } opts.template.vars The variables to send to the given template
 *
 * @returns { Object } Information regarding the email delivery:
 *   - { String } response from server
 *   - { Array } accepted email addresses
 *   - { Array } rejected email addresses
 *   - { String } previewUrl for caught emails, when EMAIL_ENABLED is false
 * @throws Error
 */
const sendMail = opts => {
  return Promise.resolve( opts )
    .then( configureMessage )
    .then( send )
    .then( handleResponse )
    .catch( handleErr );
};

export default sendMail;
