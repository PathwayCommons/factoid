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
  EMAIL_CONTEXT_JOURNAL,
  EMAIL_CONTEXT_SIGNUP
} from '../config' ;

const EMAIL_SUBJECT_FOLLOWUP = 'Thank you for sharing your research with Biofactoid';
const EMAIL_SUBJECT_REQUEST_ISSUE = 'Please re-submit your request to Biofactoid';

const msgFactory = ( emailType, doc ) => {
  const { authorEmail, context } = doc.correspondence();

  const {
    title = 'Untitled',
    reference = ''
  } = doc.citation();
  const citation = _.compact([title, reference]).join(' ');

  const email_contextual_content = {
    [EMAIL_CONTEXT_SIGNUP]: {
      subject: `Welcome to Biofactoid`,
      [EMAIL_TYPE_INVITE]: {
        main: {
          title:  `We're ready for you to add your article's pathway`,
          body: ``,
          footer: ``
        },
        cta: {
          title: `START BIOFACTOID`,
          body: `You are contributing for ${citation}`,
          footer: `You can also begin by pasting the following into your browser ${BASE_URL}${doc.privateUrl()}`
        }
      }
    },
    [EMAIL_CONTEXT_JOURNAL]: {
      subject: `Connect your article's information with others through Biofactoid`,
      [EMAIL_TYPE_INVITE]: {
        main: {
          title: `Let researchers find and explore the key biological interactions in your research article`,
          body: `Molecular Cell is collaborating with Biofactoid, a website that assists authors in composing a 'digital summary' consisting of key biological interactions (e.g. binding, gene expression, post-translational modification) present in their published research article. Digital records are attributed to authors and associated with an article, providing verification of scientific accuracy. All data is freely shared with the scientific community. Molecular Cell is inviting authors to contribute to Biofactoid. Participation is voluntary; no account is required.`,
          footer: ``
        },
        cta: {
          title: `START BIOFACTOID`,
          body: `You are contributing for ${citation}`,
          footer: `You can also begin by pasting the following into your browser  ${BASE_URL}${doc.privateUrl()}`
        }
      }
    }
  };

  const email_explore_content = {
    documents: {
      first: {
        src: 'https://biofactoid.org/api/document/7826fd5b-d5af-4f4c-9645-de5264907272.png',
        publicUrl: 'https://biofactoid.org/document/7826fd5b-d5af-4f4c-9645-de5264907272',
        citation: 'Ritchie et al. SLC19A1 Is an Importer of the Immunotransmitter cGAMP. Mol. Cell 75 (2019)'
      },
      second: {
        src: 'https://biofactoid.org/api/document/8325ea13-4f53-46f1-a27b-c8c32ae17fa6.png',
        publicUrl: 'https://biofactoid.org/document/8325ea13-4f53-46f1-a27b-c8c32ae17fa6',
        citation: `Gruber et al. (2019). HAT1 Coordinates Histone Production and Acetylation via H4 Promoter Binding. Mol. Cell 75.`
      }
    }
  };

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
      _.set( data, 'subject', _.get( email_contextual_content, [context, 'subject'] ) );
      _.set( data, ['template', 'id'], MAILJET_TMPLID_INVITE );
      _.set( data, ['template', 'vars'], _.assign({
        privateUrl: `${BASE_URL}${doc.privateUrl()}`,
        context,
        explore: email_explore_content,
      }, email_contextual_content[context][emailType] ));
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
        tweetUrl: doc.tweetUrl(),
        imageUrl: `${BASE_URL}/api${doc.publicUrl()}.png`,
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