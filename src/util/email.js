import _ from 'lodash';
import { tryPromise } from './promise';

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
  EMAIL_TYPE_REQUEST_ISSUE
} from '../config' ;

const msgFactory = ( emailType, doc ) => {
  const { authorEmail } = doc.correspondence();

  const {
    title = 'Untitled',
    reference = ''
  } = doc.citation();
  const citation = _.compact([title, reference]).join(' ');
  const privateUrl = `${BASE_URL}${doc.privateUrl()}`;
  const publicUrl =  `${BASE_URL}${doc.publicUrl()}`;
  const imageUrl = `${BASE_URL}/api${doc.publicUrl()}.png`;

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
        citation
      }
    }
  };

  const data = {};
  switch( emailType ) {
    case EMAIL_TYPE_INVITE:
      _.set( data, 'subject', 'Welcome to Biofactoid' );
      _.set( data, ['template', 'id'], MAILJET_TMPLID_INVITE );
      _.set( data, ['template', 'vars'], _.assign({}, { privateUrl }) );
      break;
    case EMAIL_TYPE_REQUEST_ISSUE:
      _.set( data, 'subject', `Please re-submit your request to Biofactoid` );
      _.set( data, ['template', 'id'], MAILJET_TMPLID_REQUEST_ISSUE );
      break;
    case EMAIL_TYPE_FOLLOWUP:
      _.set( data, 'subject', `Thank you for sharing your research with Biofactoid` );
      _.set( data, ['template', 'id'], MAILJET_TMPLID_FOLLOWUP );
      _.set( data, ['template', 'vars'], {
        publicUrl,
        hasTweet: `${doc.hasTweet()}`,
        tweetUrl: doc.tweetUrl(),
        imageUrl,
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

export { msgFactory, updateCorrespondence, EmailError };