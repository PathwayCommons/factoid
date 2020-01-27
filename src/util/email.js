import _ from 'lodash';
import { tryPromise } from './promise';

import {
  BASE_URL,
  EMAIL_FROM,
  EMAIL_FROM_ADDR,
  EMAIL_VENDOR_MAILJET,
  MAILJET_TMPLID_INVITE,
  MAILJET_TMPLID_FOLLOWUP,
  EMAIL_TYPE_INVITE,
  EMAIL_TYPE_FOLLOWUP,
  EMAIL_SUBJECT_INVITE,
  EMAIL_SUBJECT_FOLLOWUP
} from '../config' ;


const msgFactory = ( emailType, doc ) => {
  const { authorEmail, context } = doc.correspondence();
  const { title, authors, reference } = doc.citation();

  const DEFAULTS = {
    from: {
      name: EMAIL_FROM,
      address: EMAIL_FROM_ADDR
    },
    to: {
      address: `${authorEmail}`
    },
    template: {
      vendor: EMAIL_VENDOR_MAILJET,
      vars: {
        citation: `${title} ${authors}. ${reference}.`
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

const toJSON = res => res.json();
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

const handleMailResponse = ( response, doc, emailType ) => {
  const { statusText, ok, status } = response;
  if ( !ok ) {
    const info = _.assign( {}, response, {
      error: { statusText, status },
      date: new Date()
    });
    return updateCorrespondence( doc, info, emailType )
      .then( () => { throw Error( response.statusText ); } );
  }
  return response;
};

/**
 * sendMail
 *
 * Client-side helper to send email and update doc state
 *
 * @param {String} emailType one of the recognized types to configure email template
 * @param {object} doc the model object
 * @param {string} apiKey to validate against protected routes
 */
const sendMail = ( emailType, doc, apiKey ) => {
  const url = '/api/document/email';
  const getDocKeys = doc => Promise.all([ doc.id(), doc.secret() ]);

  return getDocKeys( doc )
    .then( ( [id, secret ] ) => fetch( url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify( { apiKey, emailType, id, secret } )
      })
    )
    .then( response => handleMailResponse( response, doc, emailType ) )
    .then( toJSON )
    .then( info => updateCorrespondence( doc, info, emailType ) );
};

export { sendMail, msgFactory, updateCorrespondence };