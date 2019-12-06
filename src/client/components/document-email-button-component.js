import _ from 'lodash';
import h from 'react-hyperscript';
import { format, formatDistanceToNow, isThisMonth } from 'date-fns';

import logger from '../logger';
import DirtyComponent from './dirty-component';
import { tryPromise } from '../../util';
import {
  BASE_URL,
  EMAIL_FROM,
  EMAIL_FROM_ADDR,
  EMAIL_VENDOR_MAILJET,
  INVITE_TMPLID,
  SUBMIT_SUCCESS_TMPLID,
  CORRESPONDENCE_INVITE_TYPE,
  CORRESPONDENCE_FOLLOWUP_TYPE
} from '../../config' ;

// Mail
const INVITE_EMAIL_SUBJECT = 'Your invitation to Biofactoid is ready';
const FOLLOWUP_EMAIL_SUBJECT = 'Thank you for sharing your research with Biofactoid';

// Date formatting
const DATE_FORMAT = 'MMMM-dd-yyyy';
const getTimeSince = dateString => formatDistanceToNow( new Date( dateString ), { addSuffix: true } );
const toDateString = dateString => format( new Date( dateString ), DATE_FORMAT );
const toPeriodOrDate = dateString => {
  try {
    if ( !dateString ) return;
    const d = new Date( dateString );
    return isThisMonth( d ) ? getTimeSince( d ) : toDateString( d );
  } catch( e ){
    logger.error( `Error parsing date: ${e}`);
  }
};

const toJSON = res => res.json();

const sendMail = ( docOpts, apiKey ) => {
  const url = '/api/document/email';
  const defaults = {
    from: {
      name: EMAIL_FROM,
      address: EMAIL_FROM_ADDR
    },
    template: {
      vendor: EMAIL_VENDOR_MAILJET
    }
  };

  const opts = _.merge( {}, defaults, docOpts );
  const data = { opts, apiKey };

  return fetch( url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify( data )
  })
  .then( toJSON );
};

const msgFactory = ( correspondenceType, doc ) => {
  const { authorEmail, context } = doc.correspondence();
  const { title, authors, reference } = doc.citation();

  const DEFAULTS = {
    to: {
      address: `${authorEmail}`
    },
    template: {
      vars: {
        citation: `${title} ${authors}. ${reference}.`
      }
    }
  };

  const data = {};
  switch( correspondenceType ) {
    case CORRESPONDENCE_INVITE_TYPE:
      _.set( data, 'subject', INVITE_EMAIL_SUBJECT );
      _.set( data, ['template', 'id'], INVITE_TMPLID );
      _.set( data, ['template', 'vars'], {
        privateUrl: `${BASE_URL}${doc.privateUrl()}`,
        context
      });
      break;
    case CORRESPONDENCE_FOLLOWUP_TYPE:
      _.set( data, 'subject', FOLLOWUP_EMAIL_SUBJECT );
      _.set( data, ['template', 'id'], SUBMIT_SUCCESS_TMPLID );
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

class DocumentEmailButtonComponent extends DirtyComponent {
  constructor( props ){
    super( props );

    this.state = {
      sending: false
    };
  }

  handleEmail( e, doc ) {
    const type = e.target.value;
    const mailOpts = msgFactory( type, doc );

    const correspondence = doc.correspondence();

    tryPromise( () => new Promise( resolve => {
      this.setState({ sending: true }, resolve );
    }))
    .then( () => sendMail( mailOpts, this.props.apiKey ) )
    .then( info => {
      const update = _.assign( {}, info, { type });
      correspondence.emails.push( update );
      doc.correspondence( correspondence );
    })
    .finally( () => new Promise( resolve => {
      this.setState({ sending: false }, resolve );
    }));
  }

  render(){
    let { doc, type, label, className, disableWhen } = this.props;
    const { emails } = doc.correspondence();
    const infos = _.filter( emails, { 'type': type } );
    const last = toPeriodOrDate( _.get( _.last( infos ), 'date' ) );

    return h( 'div', { key: type, className }, [
      h( 'button.email-button', {
        value: type,
        onClick: e => this.handleEmail( e, doc ),
        disabled: this.state.sending || disableWhen
      }, label ),
      this.state.sending ? h('small.mute', [
        h('span', ' Sending mail '),
        h('i.icon.icon-spinner.document-seeder-submit-spinner')
      ]) : _.size( infos ) ? h( 'small.mute', ` ${_.size( infos )} | ${last}` ) : null
    ]);
  }
}

export default DocumentEmailButtonComponent;