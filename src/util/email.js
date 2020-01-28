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
  EMAIL_TYPE_REQUEST_ISSUE,
  EMAIL_SUBJECT_INVITE,
  EMAIL_SUBJECT_FOLLOWUP,
  EMAIL_SUBJECT_REQUEST_ISSUE
} from '../config' ;


const msgFactory = ( emailType, doc ) => {
  const { authorEmail, context } = doc.correspondence();
  const provided = doc.provided();

  const {
    title = 'Untitled',
    reference = ''
  } = doc.citation();

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
        baseUrl: BASE_URL,
        provided,
        citation: `${title} ${reference}`
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

export { msgFactory, updateCorrespondence };