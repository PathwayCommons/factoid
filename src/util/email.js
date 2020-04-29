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

const msgFactory = ( emailType, doc ) => {
  const { authorEmail, context } = doc.correspondence();

  const {
    title = 'Untitled',
    reference = ''
  } = doc.citation();
  const citation = _.compact([title, reference]).join(' ');
  const privateUrl = `${BASE_URL}${doc.privateUrl()}`;
  const publicUrl =  `${BASE_URL}${doc.publicUrl()}`;
  const imageUrl = `${BASE_URL}/api${doc.publicUrl()}.png`;

  const explore = {
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

  const emailType_invite_config = {
    [EMAIL_CONTEXT_SIGNUP]: {
      subject: `Welcome to Biofactoid`,
      vars: _.assign({
        main: {
          title:  `We're ready for you to add your article's pathway`,
          body: ``,
          footer: ``
        },
        cta: {
          title: `START BIOFACTOID`,
          body: `You are contributing for ${citation}`,
          footer: `You can also begin by pasting the following into your browser ${privateUrl}`
        }
      }, { explore } )
    },

    [EMAIL_CONTEXT_JOURNAL]: {
      subject: `Connect your article's information with others through Biofactoid`,
      vars:  _.assign({
        main: {
          title: `Let researchers find and explore the key biological interactions in your research article`,
          body: `Molecular Cell is collaborating with Biofactoid, a website that assists authors in composing a 'digital summary' consisting of key biological interactions (e.g. binding, gene expression, post-translational modification) present in their published research article. Digital records are attributed to authors and associated with an article, providing verification of scientific accuracy. All data is freely shared with the scientific community. Molecular Cell is inviting authors to contribute to Biofactoid. Participation is voluntary; no account is required.`,
          footer: ``
        },
        cta: {
          title: `START BIOFACTOID`,
          body: `You are contributing for ${citation}`,
          footer: `You can also begin by pasting the following into your browser  ${privateUrl}`
        }
      }, { explore } )
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
        citation
      }
    }
  };

  const data = {};
  switch( emailType ) {
    case EMAIL_TYPE_INVITE:
      _.set( data, 'subject', _.get( emailType_invite_config, [context, 'subject'] ) );
      _.set( data, ['template', 'id'], MAILJET_TMPLID_INVITE );
      _.set( data, ['template', 'vars'], _.assign({
        privateUrl,
        context
      }, _.get( emailType_invite_config, [context, 'vars'] ) ) );
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