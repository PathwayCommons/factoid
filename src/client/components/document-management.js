import _ from 'lodash';
import h from 'react-hyperscript';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { format, formatDistanceToNow, isThisMonth } from 'date-fns';

import EmailButtton from './document-email-button-component';
import logger from '../logger';
import DirtyComponent from './dirty-component';
import Document from '../../model/document';
import { makeClassList, tryPromise } from '../../util';
import {
  PUBMED_LINK_BASE_URL,
  DOI_LINK_BASE_URL,
  CORRESPONDENCE_INVITE_TYPE,
  CORRESPONDENCE_FOLLOWUP_TYPE
} from '../../config' ;

const DOCUMENT_STATUS_FIELDS = Document.statusFields();
const DEFAULT_STATUS_FIELDS = _.pull( _.values( DOCUMENT_STATUS_FIELDS ), DOCUMENT_STATUS_FIELDS.TRASHED );

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
    const status =  _.get( query, 'status' ) ? _.get( query, 'status' ).split(/\s*,\s*/) : DEFAULT_STATUS_FIELDS;

    this.state = {
      apiKey,
      validApiKey: false,
      docs: [],
      error: undefined,
      status
    };

    this.getDocs( apiKey )
      .catch( () => {} ); //swallow
  }

  getUrlParams( opts ){
    const { apiKey, status } = _.defaultsDeep( {}, opts, _.pick( this.state, ['apiKey', 'status'] ) );
    return queryString.stringify( { apiKey, status: status.join(',') } );
  }

  updateUrlParams( opts ){
    const urlParams = this.getUrlParams( opts );
    this.props.history.push(`/document?${urlParams}`);
  }

  getDocs(){
    const url = '/api/document';
    const params = this.getUrlParams();

    return fetch(`${url}?${params}`)
      .then( res => res.json() )
      .then( docJSON => toDocs( docJSON, this.docSocket, this.eleSocket ) )
      .then( docs => {
        docs.forEach( doc => doc.on( 'update', () => this.dirty() ) );
        return docs;
      })
      .then( docs => new Promise( resolve => {
        this.setState({
          validApiKey: true, // no error means its good
          error: null,
          docs }, resolve);
      }))
      .then( () => this.updateUrlParams() );
  }

  updateDocs(){
    this.getDocs()
      .catch( e => {
        this.setState( {
          error: e,
          validApiKey: false,
          apiKey: ''
         }, () => this.props.history.push(`/document`) );
        return;
      });
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

  handleStatusChange( e ){
    const { value, checked } = e.target;
    const status = this.state.status.slice();
    checked ? status.push( value ) : _.pull( status, value );
    this.setState({ status }, () => this.updateDocs() );
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
        h( 'div.document-management-document-section-items', [
          h( 'div', [
            h( 'i.material-icons.by-status.invalid', {
              className: makeClassList({ 'show': doc.issues() })
            }, 'warning' ),
            h( 'i.material-icons.by-status.mute', {
              className: makeClassList({ 'show': doc.approved() })
            }, 'thumb_up' ),
            h( 'i.material-icons.by-status.complete', {
              className: makeClassList({ 'show': doc.submitted() })
            }, 'check_circle' ),
            h( 'i.material-icons.by-status.mute', {
              className: makeClassList({ 'show': doc.trashed() })
            }, 'delete' )
          ])
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
          h( 'div.document-management-document-section-items', [
            h( 'div.row', [
              h( Link, {
                className: 'plain-link',
                to: doc.publicUrl(),
                target: '_blank',
              }, 'Summary' ),
              h( Link, {
                className: 'plain-link',
                to: doc.privateUrl(),
                target: '_blank'
              }, 'Editable' ),
            ])
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
      const element = [ h( 'span', `${authorEmail} ` ) ];
      if( contact ) element.push( h( 'span', ` <${contact.name}> ` ) );
      if( isCorrespondingAuthor ) element.push( h( 'i.material-icons', 'mail_outline' ) );
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

        content = h( 'div.document-management-document-section-items', [
          h( 'div', getAuthorEmail( doc ) ),
          h( EmailButtton, {
            doc,
            type: CORRESPONDENCE_INVITE_TYPE,
            label: _.capitalize( CORRESPONDENCE_INVITE_TYPE ),
            disableWhen: doc.requested() || doc.trashed() || doc.submitted(),
            apiKey: this.state.apiKey
          }),
          h( EmailButtton, {
            doc,
            type: CORRESPONDENCE_FOLLOWUP_TYPE,
            label: _.upperFirst( CORRESPONDENCE_FOLLOWUP_TYPE.replace(/([A-Z])/g, (match, letter) => '-' + letter) ),
            disableWhen: doc.requested() || doc.trashed() || !doc.submitted(),
            apiKey: this.state.apiKey
          })
        ]);
      }

      return h( 'div.document-management-document-section', [
        h( 'div.document-management-document-section-label', {
          className: makeClassList({ 'issue': _.has( doc.issues(), 'authorEmail' ) })
        }, 'Correspondence:' ),
        content
      ]);
    };

    // Status
    const getDocumentStatus = doc => {
      let radios = [];
      let addType = (typeVal, displayName) => {
        radios.push(
          h('input', {
            type: 'radio',
            name: `document-status-${doc.id()}`,
            id: `document-status-radio-${doc.id()}-${typeVal}`,
            value: typeVal,
            defaultChecked: _.get( DOCUMENT_STATUS_FIELDS, typeVal ) === doc.status(),
            onChange: e => {
              let newlySelectedStatus = _.get( DOCUMENT_STATUS_FIELDS, e.target.value );
              doc.status( newlySelectedStatus );
            }
          }),
          h('label', {
            htmlFor: `document-status-radio-${doc.id()}-${typeVal}`
          }, displayName)
        );
      };

      _.toPairs( DOCUMENT_STATUS_FIELDS ).forEach( ([ field, status ]) => addType( field, _.capitalize( status ) ) );
      return h( 'div.radioset', radios );
    };

    // Stats
    const getDocumentStats = doc => {
      const created = toPeriodOrDate( doc.createdDate() );
      const edited = toPeriodOrDate( doc.lastEditedDate() );
      const context = doc.correspondence() ? _.get( doc.correspondence(), 'context' ) : null;
      const source = context ? `via ${context}` : '';
      return h( 'div.document-management-document-section.column.meta', [
          h( 'small.document-management-document-section-items', [
            getDocumentStatus( doc ),
            h( 'div.mute', { key: 'created' }, `Created ${created} ${source}` ),
            h( 'div.mute', { key: 'edited' }, edited ? `Edited ${edited}`: 'Not edited' )
          ])
        ]);
    };


    const getDocStatusFilter = () => {
      let checkboxes = [];
      let DOCUMENT_STATUS_FIELDS = Document.statusFields();
      let addCheckbox = ( statusVal, displayName ) => {
        checkboxes.push(
          h('input', {
            type: 'checkbox',
            name: `document-status-filter`,
            id: `document-status-filter-checkbox-${statusVal}`,
            value: statusVal,
            defaultChecked: _.includes( DEFAULT_STATUS_FIELDS, statusVal ),
            onChange: e => this.handleStatusChange(e)
          }),
          h('label', {
            htmlFor: `document-status-filter-checkbox-${statusVal}`
          }, displayName)
        );
      };

      _.values( DOCUMENT_STATUS_FIELDS ).forEach( status => addCheckbox( status, _.capitalize( status ) ) );
      return h( 'small.mute.checkboxSet', checkboxes );
    };


    const documentMenu = h('div.document-management-document-control-menu', [
      getDocStatusFilter()
    ]);

    const documentList = h( 'ul', orderByCreatedDate( docs ).map( doc => {
      return h( 'li', {
          key: doc.id()
        },
        [
          getDocumentHeader( doc ),
          getDocumentArticle( doc ),
          getDocumentNetwork( doc ),
          getDocumentCorrespondence( doc ),
          getDocumentStats( doc ),
          h( 'hr' )
        ]);
      })
    );

    const documentContainer = h( 'div.document-management-document-container', [
      documentMenu,
      documentList
    ]);


    let body = validApiKey ? documentContainer: apiKeyForm;

    return h('div.document-management.page-content', [
      h('div.document-management-content', [
        header,
        body
      ])
    ]);
  }
}

export default DocumentManagement;
