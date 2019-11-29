import _ from 'lodash';
import React from 'react';
import h from 'react-hyperscript';
import queryString from 'query-string';
// import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { format, formatDistanceToNow, isThisWeek } from 'date-fns';

import Document from '../../model/document';
import { makeClassList, tryPromise } from '../../util';
import {
  BASE_URL,
  EMAIL_FROM,
  EMAIL_FROM_ADDR,
  EMAIL_VENDOR_MAILJET,
  INVITE_TMPLID,
  EMAIL_CONTEXT_SIGNUP
} from '../../config' ;

const DATE_FORMAT = 'MMMM-dd-yyyy';
const getTimeSince = dateString => formatDistanceToNow( new Date( dateString ), { addSuffix: true } );
const toDateString = dateString => format( new Date( dateString ), DATE_FORMAT );
const toPeriodOrDate = dateString => {
  const d = new Date( dateString );
  return isThisWeek( d ) ? getTimeSince( d ) : toDateString( d );
};

const sanitizeKey = secret => secret === '' ? '%27%27': secret;

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
  });
};

const msgFactory = doc => {

  const msgOpts = {
    to: {
      address: `${doc.contributorEmail}`
    },
    subject: 'Your invitation to Biofactoid is ready',
    template: {
      id: INVITE_TMPLID,
      vars: {
        citation: `${doc.title}\n${doc.authors}\n${doc.journalName}`,
        privateUrl: `${BASE_URL}/document/${doc.id}/${doc.secret}`,
        context: EMAIL_CONTEXT_SIGNUP
      }
    }
  };

  return msgOpts;
};

const orderByCreatedDate = docs => _.orderBy( docs, [ doc => new Date( _.get( doc, ['status', 'createdDate'] ) ) ], ['desc'] );

const toDocs = ( docJSON, docSocket, eleSocket ) => {
  
  const docPromises = docJSON.map( data => {
    const { id, secret } = data;
    const doc = new Document({
      socket: docSocket,
      factoryOptions: { socket: eleSocket },
      data: { id, secret }
    });

    doc.on( 'load', () => console.log( 'loaded' ) );
    
    return tryPromise( () => doc.load() )
      .then( () => doc.synch( true ) )
      .then( () => doc );
  });

  return Promise.all( docPromises );
};

class DocumentManagement extends React.Component {
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
      error: undefined
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
      .then( docJSON => toDocs( docJSON, this.docSocket, this.elSocket ) )
      .then( docs => new Promise( resolve => {
        console.log( docs );
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

  handleEmail( mailOpts ) {
    sendMail( mailOpts, this.state.apiKey )
      .then( info => info );
  }

  handleApiKeyFormChange( apiKey ) {
    this.setState( { apiKey } );
  }

  handleApiKeySubmit( event ){
    event.preventDefault();
    this.updateDocs();
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

    // Article
    const getDocumentArticle = doc => {
      const { authors, title, reference, url } = doc.citation();
      return  [
        h('h3', [
          h( 'a.plain-link', {
            href: url,
            target: '_blank'
          }, title )
        ] ),
        h('p', `${authors}. ${reference}` )
      ];
    };

    // // Network
    // const getDocumentNetwork = network => {
    //   const { summaryPath, editablePath } = network;
    //   return [
    //     h( 'div.document-management-horizontal-list', [
    //       h( 'div.document-management-text-label', ''),
    //       h( 'ul', [
    //         h( 'li', [
    //           h( Link, {
    //             to: summaryPath,
    //             target: '_blank',
    //           }, 'Summary' )
    //         ]),
    //         h( 'li', [
    //           h( Link, {
    //             to: editablePath,
    //             target: '_blank'
    //           }, 'Editable' )
    //         ])
    //       ])
    //     ])
    //   ];
    // };

    //  // Correspondence
    //  const getDocumentCorrespondence = ( correspondence, status ) => {
    //   const { email, mailOpts } = correspondence;
    //   const { submitted } = status;
    //   return [
    //     h( 'div.document-management-horizontal-list', [
    //       h( 'div.document-management-text-label', `Correspondence (${email.address})`),
    //       h( 'ul', [
    //         h( 'li', [
    //           h( 'button', {
    //             disabled: submitted,
    //             onClick: () => this.handleEmail( mailOpts )
    //           }, 'Email Invite' )
    //         ])
    //       ])
    //     ])
    //   ];
    // };

    // Document Header & Footer
    const getDocumentHeader = status => [
      h( 'i.material-icons', {
        className: makeClassList({ 'on-submit': !status.submitted })
      }, 'check_circle' )
    ];
    const getDocumentStatus = doc => {
      const { createdDate, lastEditedDate } = doc.status();
      console.log( new Date( createdDate ) );
      console.log(lastEditedDate);
      return [
        h( 'ul.mute', [
          h( 'li', { key: 'created' }, `Created ${createdDate}` ),
          h( 'li', { key: 'modified' }, `Modified ${lastEditedDate}` )
        ])
      ];
    };

    const documentList = h( 'ul', orderByCreatedDate( docs ).map( ( doc, i ) => {
        return h( 'li', {
          className: makeClassList( { 'is-submitted': status.submitted } ),
          key: i
        },
        [
          // h( 'div.document-management-document-meta', getDocumentHeader( status ) ),
          h( 'div.document-management-document-section', getDocumentArticle( doc ) ),
          // h( 'div.document-management-document-section', getDocumentNetwork( network ) ),
          // h( 'div.document-management-document-section', getDocumentCorrespondence( correspondence, status ) ),
          h( 'div.document-management-document-meta', getDocumentStatus( doc ) ),
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
