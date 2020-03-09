import _ from 'lodash';
import h from 'react-hyperscript';
import queryString from 'query-string';
import io from 'socket.io-client';
import EventEmitter from 'eventemitter3';

import { DocumentManagementDocumentComponent } from './document-management-components';
import logger from '../logger';
import DirtyComponent from './dirty-component';
import Document from '../../model/document';
import { tryPromise } from '../../util';
import Popover from './popover/popover';
import { checkHTTPStatus } from '../../util';
import { EMAIL_CONTEXT_JOURNAL } from '../../config';
import { RequestForm } from './home';

const DOCUMENT_STATUS_FIELDS = Document.statusFields();
const DEFAULT_STATUS_FIELDS = _.pull( _.values( DOCUMENT_STATUS_FIELDS ), DOCUMENT_STATUS_FIELDS.TRASHED );

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
      apiKeyError: null,
      docs: [],
      status
    };

    this.bus = new EventEmitter();

    this.checkApiKey( apiKey )
      .then( () => this.getDocs() )
      .catch( () => {} ); //swallow
  }

  checkApiKey( apiKey ){
    const url = '/api/document/api-key-verify';
    const params = queryString.stringify( { apiKey } );

    return fetch(`${url}?${params}`)
      .then( checkHTTPStatus )
      .then( () => new Promise( resolve => this.setState( { apiKeyError: null, validApiKey: true }, resolve ) ))
      .catch( e => {
        this.setState( { apiKeyError: apiKey ? e : null, validApiKey: false }, () => this.props.history.push(`/document`) );
        throw e;
      });
  }

  getUrlParams(){
    const { apiKey, status } = this.state;
    return queryString.stringify( { apiKey, status: status.join(',') } );
  }

  updateUrlParams(){
    const urlParams = this.getUrlParams();
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
      .then( docs => new Promise( resolve => this.setState( { docs }, resolve ) ) )
      .then( () => this.updateUrlParams() );
  }

  handleApiKeyFormChange( apiKey ) {
    this.setState( { apiKey } );
  }

  handleApiKeySubmit( event ){
    event.preventDefault();
    this.checkApiKey( event.target.value )
      .then( () => this.getDocs() )
      .catch( () => {} );
  }

  handleApproveRequest( doc ){
    doc.approve();
  }

  handleStatusChange( e ){
    const { value, checked } = e.target;
    const status = this.state.status.slice();
    checked ? status.push( value ) : _.pull( status, value );
    this.setState({ status }, () => this.getDocs() );
  }

  componentDidMount(){
    document.title = `Admin : Biofactoid`;
  }

  componentWillUnmount(){
    const { docs } = this.state;

    docs.elements().forEach( el => el.removeAllListeners() );
    docs.removeAllListeners();
  }

  render(){
    let { docs, apiKey, status, validApiKey } = this.state;
    const header = h('div.page-content-title', [
      h('h1', 'Document management panel')
    ]);

    const getAddDoc = () => {
      return h( Popover, {
        tippy: {
          html: h( RequestForm, {
            apiKey,
            context: EMAIL_CONTEXT_JOURNAL,
            bus: this.bus
          }),
          onHidden: () => this.bus.emit( 'closecta' ),
          placement: 'top'
        }
      }, [
        h('button', [ h( 'i.material-icons', 'add' ) ])
      ]);
    };

    // Authorization
    const apiKeyForm =
      h('form', [
        h('label.document-management-text-label', 'API key'),
        h('input', {
          type: 'text',
          value: apiKey,
          onChange: e => this.handleApiKeyFormChange( e.target.value )
        }),
        this.state.apiKeyError ? h('div.error', 'Unable to authorize' ): null,
        h('button', {
          value: apiKey,
          onClick: e => this.handleApiKeySubmit( e )
        }, 'Submit' )
      ]);

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
            defaultChecked: _.includes( status, statusVal ),
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
      h( 'div.document-management-document-control-menu-item', [getDocStatusFilter()]),
      h( 'div.document-management-document-control-menu-item', [getAddDoc()])
    ]);

    const documentList = h( 'ul', orderByCreatedDate( docs ).map( doc => {
      return h( 'li', {
          key: doc.id()
        },
        [
          h( DocumentManagementDocumentComponent, { doc, apiKey } ),
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
