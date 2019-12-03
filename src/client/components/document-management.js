import _ from 'lodash';
import h from 'react-hyperscript';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { format, formatDistanceToNow, isThisMonth } from 'date-fns';

import logger from '../logger';
import DirtyComponent from './dirty-component';
import Document from '../../model/document';
import { makeClassList, tryPromise } from '../../util';
import {
  BASE_URL,
  EMAIL_FROM,
  EMAIL_FROM_ADDR,
  EMAIL_VENDOR_MAILJET,
  INVITE_TMPLID,
  SUBMIT_SUCCESS_TMPLID,
  PUBMED_LINK_BASE_URL,
  DOI_LINK_BASE_URL
} from '../../config' ;

// Mail
const INVITE_EMAIL_LABEL = 'Invite';
const FOLLOWUP_EMAIL_LABEL = 'Follow-Up';
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

const sanitizeKey = secret => secret === '' ? '%27%27': secret;
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

const msgFactory = ( label, doc ) => {
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
  switch( label ) {
    case INVITE_EMAIL_LABEL:
      _.set( data, 'subject', INVITE_EMAIL_SUBJECT );
      _.set( data, ['template', 'id'], INVITE_TMPLID );
      _.set( data, ['template', 'vars'], {
        privateUrl: `${BASE_URL}/${doc.privateUrl()}`,
        context  
      });
      break;
    case FOLLOWUP_EMAIL_LABEL:
      _.set( data, 'subject', FOLLOWUP_EMAIL_SUBJECT );
      _.set( data, ['template', 'id'], SUBMIT_SUCCESS_TMPLID );
      _.set( data, ['template', 'vars'], {
        publicUrl: `${BASE_URL}/${doc.publicUrl()}`,
        hasTweet: `${doc.hasTweet()}`,
        tweetUrl: `${BASE_URL}/${doc.publicUrl()}`
      });
      break;
    default:
  } 
  
  const mailOpts = _.defaultsDeep( data, DEFAULTS );
  return mailOpts;
};

const orderByCreatedDate = docs => _.orderBy( docs, [ doc => doc.createdDate() ], ['desc'] );

const toDocs = ( docJSON, docSocket, eleSocket ) => {

  const docPromises = docJSON.map( data => {
    const { id, secret } = data;
    const doc = new Document({
      socket: docSocket,
      factoryOptions: { socket: eleSocket },
      data: { id, secret }
    });

    return tryPromise( () => doc.load() )
      .then( () => doc.synch( true ) )
      .then( () => doc );
  });

  return Promise.all( docPromises );
};

class DocumentManagement extends DirtyComponent {
  constructor( props ){
    super( props );

    // Live Sync
    let docSocket = io.connect('/document');
    this.docSocket = docSocket;
    let eleSocket = io.connect('/element');
    this.eleSocket = eleSocket;
    let logSocketErr = (err) => logger.error('An error occurred during clientside socket communication', err);
    docSocket.on('error', logSocketErr);
    eleSocket.on('error', logSocketErr);

    // API Key
    const query = queryString.parse( this.props.history.location.search );
    const apiKey =  _.get( query, 'apiKey', '' );

    this.state = {
      apiKey,
      validApiKey: false,
      docs: [],
      error: undefined,
      emailing: false
    };

    this.getDocs( apiKey )
      .then( () => this.props.history.push(`/document?apiKey=${sanitizeKey(apiKey)}`) )
      .catch( () => {} ); //swallow
  }
 
  getDocs( apiKey ){
    const url = '/api/document';
    const params = { apiKey };
    const paramsString = queryString.stringify( params );

    return fetch(`${url}?${paramsString}`)
      .then( res => res.json() )
      .then( docJSON => toDocs( docJSON, this.docSocket, this.eleSocket ) )
      .then( docs => {
        docs.forEach( doc => doc.on( 'update', () => this.dirty()) );
        return docs;
      })
      .then( docs => new Promise( resolve => {
        this.setState({
          validApiKey: true, // no error means its good
          apiKey,
          error: null,
          docs }, resolve);
      }));
  }

  updateDocs( apiKey = this.state.apiKey ){
    this.getDocs( apiKey )
      .then( () => this.props.history.push(`/document?apiKey=${sanitizeKey(apiKey)}`) )
      .catch( e => {
        this.setState( {
          error: e,
          validApiKey: false,
          apiKey: ''
         }, () => this.props.history.push(`/document`) );
        return;
      });
  }

  handleEmail( e, doc ) {
    const label = e.target.textContent;
    const mailOpts = msgFactory( label, doc );

    const data = doc.correspondence();

    tryPromise( () => new Promise( resolve => {
      this.setState({ emailing: true }, resolve );
    }))
    .then( () => sendMail( mailOpts, this.state.apiKey ) )
    .then( info => {
      _.set( info, 'date', new Date() );
      data.invite.push( info );
      doc.correspondence( data );
    })
    .finally( () => new Promise( resolve => {
      this.setState({ emailing: false }, resolve );
    }));
  }

  handleApiKeyFormChange( apiKey ) {
    this.setState( { apiKey } );
  }

  handleApiKeySubmit( event ){
    event.preventDefault();
    this.updateDocs();
  }

  handleApproveRequest( doc ){
    doc.approve();
  }

  componentWillUnmount(){
    const { docs } = this.state;

    docs.elements().forEach( el => el.removeAllListeners() );
    docs.removeAllListeners();
  }

  render(){
    let { docs, validApiKey } = this.state;

    const header = h('div.page-content-title', [
      h('h1', 'Document management panel')
    ]);

    // Authorization
    const apiKeyForm =
      h('form', [
        h('label.document-management-text-label', 'API key'),
        h('input', {
          type: 'text',
          value: this.state.apiKey,
          onChange: e => this.handleApiKeyFormChange( e.target.value )
        }),
        this.state.error ? h('div.error', 'Unable to authorize' ): null,
        h('button', {
          onClick: e => this.handleApiKeySubmit( e )
        }, 'Submit' )
      ]);

    // Document Header & Footer
    const getDocumentHeader = doc => {
      return h( 'div.document-management-document-section.meta', [
        h( 'div.document-management-document-section-items.row', [
          h( 'i.material-icons.by-status.invalid', {
            className: makeClassList({ 'show': doc.issues() })
          }, 'warning' ),
          h( 'i.material-icons.by-status.mute', {
            className: makeClassList({ 'show': doc.approved() && !doc.submitted() })
          }, 'thumb_up' ),
          h( 'i.material-icons.by-status.complete', {
            className: makeClassList({ 'show': doc.approved() && doc.submitted() })
          }, 'check_circle' ),
          h('button.by-status', {
            className: makeClassList({ 'show': !doc.issues() && !doc.approved() }),
            onClick: () => this.handleApproveRequest( doc )
          }, 'Approve' )
        ])
      ]);
    };

    // Article
    const getDocumentArticle = doc => {
      let content = null;

      if( _.has( doc.issues(), 'paperId' ) ){
        const { paperId } = doc.issues();
        content = h( 'div.document-management-document-section-items', [
          h( 'div', [
            h( 'i.material-icons', 'error_outline' ),
            h( 'span', ` ${paperId}` )
          ])
        ]);

      } else {
        const { authors, contacts, title, reference, pmid, doi } = doc.citation();
        const contactList = contacts.map( contact => `${contact.email} <${contact.name}>` ).join(', ');
        content =  h( 'div.document-management-document-section-items', [
            h( 'strong', [
              h( 'a.plain-link.section-item-emphasize', {
                href: PUBMED_LINK_BASE_URL + pmid,
                target: '_blank'
              }, title )
            ]),
            h('small.mute', `${authors}. ${reference}` ),
            h( 'small.mute', [
              h( 'a.plain-link', {
                href: DOI_LINK_BASE_URL + doi,
                target: '_blank'
              }, `DOI: ${doi}` )
            ]),
            h('small.mute', contactList)
          ]);
      }

      return h( 'div.document-management-document-section', [
        h( 'div.document-management-document-section-label', {
          className: makeClassList({ 'issue': _.has( doc.issues(), 'paperId' ) })
        }, 'Article:' ),
        content
      ]);
    };

    // Network
    const getDocumentNetwork = doc => {
      return h( 'div.document-management-document-section', [
          h( 'div.document-management-document-section-label', 'Document:' ),
          h( 'div.document-management-document-section-items.row', [
            h( Link, {
              className: 'plain-link',
              to: doc.publicUrl(),
              target: '_blank',
            }, 'Summary' ),
            h( Link, {
              className: 'plain-link',
              to: doc.privateUrl(),
              target: '_blank'
            }, 'Editable' )
          ])
        ]);
    };

     // Correspondence
     const getContact = doc => {
      const { authorEmail } = doc.correspondence();
      const { contacts } = doc.citation();
      return _.find( contacts, contact => _.indexOf( _.get( contact, 'email' ), authorEmail ) > -1 );
     };

     const getAuthorEmail = doc => {
      const { authorEmail, isCorrespondingAuthor } = doc.correspondence();
      let contact = getContact( doc );
      const element = [ h( 'span', ` ${authorEmail}` ) ];
      if( contact && isCorrespondingAuthor ){
        element.push( h( 'span', ` <${contact.name}>` ) );
        element.push( h( 'i.material-icons', 'email' ) );
      }
      return element;
     };

     const getDocumentCorrespondence = doc => {
      let content = null;

      if( _.has( doc.issues(), 'authorEmail' ) ){
        const { authorEmail } = doc.issues();
        content = h( 'div.document-management-document-section-items', [
          h( 'div', [
            h( 'i.material-icons', 'error_outline' ),
            h( 'span', ` ${authorEmail}` )
          ])
        ]);

      } else {
        const { invite, followUp } = doc.correspondence();
        const numInvites = _.size( invite );
        const lastInviteDate = toPeriodOrDate( _.get( _.last( invite ), 'date' ) );
        const numFollowUps = _.size( followUp );
        const lastFollowUpDate = toPeriodOrDate( _.get( _.last( followUp ), 'date' ) );

        content = h( 'div.document-management-document-section-items', [
          h( 'div', getAuthorEmail( doc ) ),
          h( 'div.by-status', {
              className: makeClassList({ 'show': doc.approved() })
            }, [
            h( 'button.document-management-document-section-button', {
              onClick: e => this.handleEmail( e, doc ),
              disabled: this.state.emailing
            }, INVITE_EMAIL_LABEL ),
            this.state.emailing ? h('small.mute', [
              h('span', ' Sending mail '),
              h('i.icon.icon-spinner.document-seeder-submit-spinner')
            ]) : numInvites ? h( 'small.mute', ` ${numInvites} | ${lastInviteDate}` ) : null  
          ]),
          h( 'div.by-status', {
              className: makeClassList({ 'show': doc.approved() })
            }, [
            h( 'button.document-management-document-section-button', {
              onClick: e => this.handleEmail( e, doc ),
              disabled: this.state.emailing
            }, FOLLOWUP_EMAIL_LABEL ),
            this.state.emailing ? h('small.mute', [
              h('span', ' Sending mail '),
              h('i.icon.icon-spinner.document-seeder-submit-spinner')
            ]) : numFollowUps ? h( 'small.mute', ` ${numFollowUps} | ${lastFollowUpDate}` ) : null  
          ])
        ]);
      }

      return h( 'div.document-management-document-section', [
        h( 'div.document-management-document-section-label', {
          className: makeClassList({ 'issue': _.has( doc.issues(), 'authorEmail' ) })
        }, 'Correspondence:' ),
        content
      ]);
    };

    const getDocumentStatus = doc => {
      const created = toPeriodOrDate( doc.createdDate() );
      const modified = toPeriodOrDate( doc.lastEditedDate() );
      return h( 'div.document-management-document-section.column.meta', [
          h( 'div.document-management-document-section-items', [
            h( 'small.mute', { key: 'created' }, `Created ${created}` ),
            h( 'small.mute', { key: 'modified' }, modified ? `Modified ${modified}`: 'Unmodified' )
          ])
        ]);
    };

    const documentList = h( 'ul', orderByCreatedDate( docs ).map( doc => {
      return h( 'li', {
          key: doc.id()
        },
        [
          getDocumentHeader( doc ),
          getDocumentArticle( doc ),
          getDocumentNetwork( doc ),
          getDocumentCorrespondence( doc ),
          getDocumentStatus( doc ),
          h( 'hr' )
        ]);
      })
    );


    let body = validApiKey ? documentList: apiKeyForm;

    return h('div.document-management.page-content', [
      h('div.document-management-content', [
        header,
        body
      ])
    ]);
  }
}

export default DocumentManagement;
