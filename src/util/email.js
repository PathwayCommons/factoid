import _ from 'lodash';
import { tryPromise } from './promise';
import emailRegex from 'email-regex';
import {
  BASE_URL,
  EMAIL_FROM,
  EMAIL_FROM_ADDR,
  EMAIL_VENDOR_MAILJET,
  MAILJET_TMPLID_INVITE,
  MAILJET_TMPLID_FOLLOWUP,
  MAILJET_TMPLID_REQUEST_ISSUE,
  EMAIL_TYPE_INVITE,
  EMAIL_TYPE_FOLLOWUP,
  EMAIL_TYPE_REQUEST_ISSUE,
  EMAIL_SUBJECT_INVITE,
  EMAIL_SUBJECT_FOLLOWUP,
  EMAIL_SUBJECT_REQUEST_ISSUE
} from '../config' ;


const msgFactory = ( emailType, doc ) => {
  const { authorEmail, context } = doc.correspondence();

  const {
    title = 'Untitled',
    reference = ''
  } = doc.citation();

  const DEFAULTS = {
    from: {
      name: EMAIL_FROM,
      address: EMAIL_FROM_ADDR
    },
    to: authorEmail,
    template: {
      vendor: EMAIL_VENDOR_MAILJET,
      vars: {
        baseUrl: BASE_URL,
        citation: _.compact([title, reference]).join(' ')
      }
    }
  };

  const data = {};
  switch( emailType ) {
    case EMAIL_TYPE_INVITE:
      _.set( data, 'subject', EMAIL_SUBJECT_INVITE );
      _.set( data, ['template', 'id'], MAILJET_TMPLID_INVITE );
      _.set( data, ['template', 'vars'], {
        privateUrl: `${BASE_URL}${doc.privateUrl()}`,
        context
      });
      break;
    case EMAIL_TYPE_REQUEST_ISSUE:
      _.set( data, 'subject', EMAIL_SUBJECT_REQUEST_ISSUE );
      _.set( data, ['template', 'id'], MAILJET_TMPLID_REQUEST_ISSUE );
      break;
    case EMAIL_TYPE_FOLLOWUP:
      _.set( data, 'subject', EMAIL_SUBJECT_FOLLOWUP );
      _.set( data, ['template', 'id'], MAILJET_TMPLID_FOLLOWUP );
      _.set( data, ['template', 'vars'], {
        publicUrl: `${BASE_URL}${doc.publicUrl()}`,
        hasTweet: `${doc.hasTweet()}`,
        tweetUrl: doc.tweetUrl()
      });
      break;
    default:
  }

  const mailOpts = _.defaultsDeep( data, DEFAULTS );
  return mailOpts;
};

/**
 * updateCorrespondence
 *
 * Helper method to update the document mode object correspondence state
 * @param {*} doc the model object
 * @param {*} info the response from email transport
 * @param {*} emailType one of the recognized types to configure email template
 */
const updateCorrespondence = ( doc, info, emailType ) => {
  return tryPromise( () => doc.correspondence( ) )
    .then( correspondence => {
      const update = _.assign( {}, info, { emailType });
      correspondence.emails.push( update );
      return correspondence;
    })
    .then( update => doc.correspondence( update ) );
};

/**
 * findEmailAddress
 *
 * Helper method to extract email addresses from strings and address objects supported by [Nodemailer]{@link https://nodemailer.com/message/addresses/}
 * @param {*} address a string, Object, or mixed array of string[], Object[]
 * @returns {*} an array of email addresses, possibly empty
 * @throws {TypeError}
 */
const findEmailAddress = address => {

  const fromString = str => {
    let output = [];
    const addr = str.replace(/,/g, ' ').match( emailRegex() );
    if( addr ) output = addr;
    return output;
  };
  const fromPlainObject = obj => {
    let output = [];
    if( _.has( obj, 'address' ) ) output = _.get( obj, 'address', '' ).match( emailRegex() );
    return output;
  };
  const fromArray = arr => {
    const address = arr.map( elt => {
      if( _.isString( elt ) ){
        return fromString( elt );
      } else if ( _.isPlainObject( elt ) ){
        return fromPlainObject( elt );
      } else {
        return null;
      }
    });
    return _.uniq( _.compact( _.flatten( address ) ) );
  };

  const type = typeof address;
  switch ( type ) {
    case 'string':
      return fromString( address );
    case 'object':
      if( _.isArray( address ) ) {
        return fromArray( address );
      } else if ( _.isPlainObject( address ) ) {
        return fromPlainObject( address );
      } else {
        throw new TypeError('Invalid address');
      }
    default:
      throw new TypeError('Invalid address');
  }
};

/**
 * EmailError
 *
 * Class representing an EmailError formatting error
 */
class EmailError extends Error {
  constructor( message, address ) {
    super( message );
    this.address = address;
    this.name = 'EmailError';
  }
}

export { msgFactory, updateCorrespondence, findEmailAddress, EmailError };