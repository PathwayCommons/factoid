import _ from 'lodash';
import React from 'react';
import h from 'react-hyperscript';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isThisWeek } from 'date-fns';

import { makeClassList } from '../../util';
import {
  BASE_URL,
  PUBMED_LINK_BASE_URL,
  EMAIL_FROM,
  EMAIL_FROM_ADDR,
  EMAIL_VENDOR_MAILJET,
  INVITE_TMPLID,
  EMAIL_CONTEXT_SIGNUP
} from '../../config' ;
//import { tryPromise } from '../../util';
// import MainMenu from './main-menu';

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

const sortByCreated = docs => _.orderBy( docs, [ doc => new Date( _.get( doc, '_creationTimestamp' ) ) ], ['desc'] );

class DocumentManagement extends React.Component {
  constructor( props ){
    super( props );

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
    // let { history } = this.props;
    let { docs, validApiKey } = this.state;
    
    const header = h('div.page-content-title', [
      // h( MainMenu, { history, admin: true } ),
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

    // // Article
    // const getDocumentArticle = article => {
    //   const { title, articleUrl, authors, journal } = article;
    //   return  [
    //     h('h3', [
    //       h( 'a.plain-link', {
    //         href: articleUrl,
    //         target: '_blank'
    //       }, title )
    //     ] ),
    //     h( 'span', [
    //       h('p', authors ),
    //       h('p', [
    //         h( 'span', journal )
    //       ])
    //     ])
    //   ];
    // };

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

    // // Document Header & Footer
    // const getDocumentHeader = status => [
    //   h( 'i.material-icons', {
    //     className: makeClassList({ 'on-submit': !status.submitted })
    //   }, 'check_circle' )
    // ];
    // const getDocumentStatus = status => {
    //   const { created, modified } = status;
    //   return [
    //     h( 'ul.mute', [
    //       h( 'li', { key: 'created' }, `Created ${toPeriodOrDate( created )}` ),
    //       h( 'li', { key: 'modified' }, `Modified ${toPeriodOrDate( modified )}` )
    //     ])
    //   ];
    // };

    const documentList = h( 'ul', sortByCreated( docs ).map( doc => {
        // const { article, network, correspondence, status } = doc;
        return h( 'li', {
          className: makeClassList( { 'is-submitted': status.submitted } ),
          key: doc.id
        },
        [
          // h( 'div.document-management-document-meta', getDocumentHeader( status ) ),
          // h( 'div.document-management-document-section', getDocumentArticle( article ) ),
          // h( 'div.document-management-document-section', getDocumentNetwork( network ) ),
          // h( 'div.document-management-document-section', getDocumentCorrespondence( correspondence, status ) ),
          // h( 'div.document-management-document-meta', getDocumentStatus( status ) ),
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
