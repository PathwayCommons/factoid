import _ from 'lodash';
import h from 'react-hyperscript';
import queryString from 'query-string';
import io from 'socket.io-client';
import EventEmitter from 'eventemitter3';
import ReactPaginate from 'react-paginate';
import React from 'react';

import { DocumentManagementDocumentComponent } from './document-management-components';
import logger from '../logger';
import DirtyComponent from './dirty-component';
import Document from '../../model/document';
import { tryPromise } from '../../util';
import { makeClassList } from '../dom';
import { checkHTTPStatus } from '../../util';

const DOCUMENT_STATUS_FIELDS = Document.statusFields();
const DEFAULT_STATUS_FIELDS = _.pull( _.values( DOCUMENT_STATUS_FIELDS ), DOCUMENT_STATUS_FIELDS.TRASHED, DOCUMENT_STATUS_FIELDS.INITIATED );

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
    this.idInput = React.createRef();

    // Live Sync
    let docSocket = io.connect('/document');
    this.docSocket = docSocket;
    let eleSocket = io.connect('/element');
    this.eleSocket = eleSocket;
    let logSocketErr = (err) => logger.error('An error occurred during clientside socket communication', err);
    docSocket.on('error', logSocketErr);
    eleSocket.on('error', logSocketErr);

    this.getDocsDebounced = _.debounce(() => {
      this.getDocs();
    }, 1000);

    const urlParams = this.parseUrlParams();
    this.state = _.defaults(
      urlParams,
      {
        validApiKey: false,
        apiKeyError: null,
        docs: [],
        pageCount: 0,
        loading: false,
        searchMode: false,
        page: 1,
        limit: 10,
        apiKey: '',
        status: DEFAULT_STATUS_FIELDS,
        ids: ''
      }
    );

    this.bus = new EventEmitter();

    this.checkApiKey( this.state.apiKey )
      .then( () => this.getDocs() )
      .catch( e => logger.error( 'Failed to load documents', e ) );
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

  parseUrlParams(){
    const params = queryString.parse( this.props.history.location.search );
    const asInt = str => str ? parseInt( str ) : undefined;
    const page = asInt( _.get( params, 'page' ) );
    const limit = asInt( _.get( params, 'limit' ) );
    const apiKey = _.get( params, 'apiKey' );
    const status = _.has( params, 'status' ) ? _.get( params, 'status' ).split(/\s*,\s*/): undefined;
    const ids = _.get( params, 'ids' );
    return { apiKey, page, limit, status, ids };
  }

  getQueryString(){
    const calcOffset = ( page, limit ) => limit * ( page - 1 );
    const { apiKey, searchMode } = this.state;
    const opts = { apiKey };

    if( searchMode ){
      const { ids } = this.state;
      _.assign( opts, { ids } );
    } else {
      const { page, limit, status } = this.state;
      const offset = calcOffset( page, limit );
      _.defaults( opts, { offset, status: status.join(','), limit, page } );
    }
    return queryString.stringify( opts );
  }

  setUrlParams(params){
    this.props.history.push(`/document?${params}`);
  }

  getDocs(){
    const DOCUMENT_BASE_PATH = '/api/document/';
    const queryString = this.getQueryString();
    const url = `${DOCUMENT_BASE_PATH}?${queryString}`;

    return tryPromise( () => new Promise( resolve => this.setState( { loading: true }, resolve ) ) )
      .then( () => fetch( url ) )
      .then( res => {
        const total = res.headers.get('X-Document-Count');
        const pageCount = Math.ceil( total / this.state.limit );
        const update = _.assign({ pageCount });
        return new Promise( resolve => this.setState( update, resolve( res.json() ) ) );
      })
      .then( docJSON => toDocs( docJSON, this.docSocket, this.eleSocket ) )
      .then( docs => {
        docs.forEach( doc => doc.on( 'update', () => this.dirty() ) );
        return new Promise( resolve => this.setState( { docs }, resolve ) );
      })
      .then( () => this.setUrlParams( queryString ) )
      .finally( () => {
        new Promise( resolve => this.setState( { loading: false }, resolve ) );
      });
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

  handleStatusChange( e ){
    const { value, checked } = e.target;
    const status = this.state.status.slice();
    checked ? status.push( value ) : _.pull( status, value );
    this.setState({ status }, () => this.getDocsDebounced() );
  }

  componentDidMount(){
    document.title = `Admin : Biofactoid`;
  }

  componentWillUnmount(){
    const { docs } = this.state;

    docs.elements().forEach( el => el.removeAllListeners() );
    docs.removeAllListeners();
  }

  handlePageClick( data ) {
    const { selected } = data;
    const { limit } = this.state;
    let page = selected + 1;
    let offset = limit * ( page - 1 );
    new Promise( resolve => this.setState( { offset, page }, () => this.getDocs().then( resolve ) ) );
  }

  updateIdSearch( ids ){
    this.setState({ ids });
  }

  doIdSearch( e ){
    e.preventDefault();
    const sanitize = str => str.trim().replace(/[\s,]+/g,',');
    let ids = sanitize( e.target.value );
    if( ids === '' ) return;
    this.setState( { searchMode: true, ids }, () => this.getDocs() );
  }

  clearIdSearch() {
    this.setState( { searchMode: false, ids: '' }, () => this.getDocs() );
  }

  sanitizeIds( ids ){
    return ids.trim().replace(/\s+/g, ',');
  }

  handleIdSearchKeyDown ( e ) {
    if ( e.key === 'Escape' ) {
      this.idInput.current.blur();
    } else if ( e.key === 'Enter' ) {
      this.idInput.current.blur();
      this.doIdSearch( e );
    }
  }

  render(){
    let { docs, apiKey, status, validApiKey, apiKeyError, loading, page } = this.state;
    const hasDocs = docs && docs.length > 0;
    let initialPage = page - 1;

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
      return h( 'div.mute.checkboxSet', checkboxes );
    };

    const IdSearch = () => {
      const { ids } = this.state;
      return h('div.id-search-box', [
        h('input.input-round.id-search', {
          value: ids,
          onChange: e => this.updateIdSearch( e.target.value ),
          type: 'text',
          ref: this.idInput,
          placeholder: `Document IDs`,
          onKeyDown: e => this.handleIdSearchKeyDown( e ),
        }),
        ids !== '' ? h('button', {
          onClick: () => this.clearIdSearch()
        }, [
          h('i.material-icons', 'clear')
        ]) : null
      ]);
    };

    return h('div.document-management.page-content', [
      h('div.document-management-content', [
        h('h1.document-management-header', 'Biofactoid Administration' ),
        h('i.icon.icon-spinner.document-management-spinner', {
          className: makeClassList({ 'document-management-spinner-shown': this.state.loading })
        }),
        h('div.document-management-apiKey', {
          className: makeClassList({ 'document-management-hidden': validApiKey })
        }, [
          h('input', {
            type: 'text',
            value: apiKey,
            placeholder: 'Enter the API Key',
            onChange: e => this.handleApiKeyFormChange( e.target.value )
          }),
          h('div.error', {
            className: makeClassList({ 'document-management-hidden': !apiKeyError })
          }, 'Unable to authorize' ),
          h('button', {
            value: apiKey,
            onClick: e => this.handleApiKeySubmit( e )
          }, 'Submit' )
        ]),
        h('div.document-management-body', {
          className: makeClassList({'document-management-hidden': loading || !validApiKey })
        }, [
          h('div.document-management-document-control-menu', [
            h( 'div.document-management-document-control-menu-item', {
              className: makeClassList({ 'document-management-hidden': this.state.searchMode })
            }, [
              getDocStatusFilter()
            ]),
            h( 'div.document-management-document-control-menu-item', [
              IdSearch()
            ])
          ]),
          h('div.document-management-document-list', [
            h( 'ul', {
              className: makeClassList({
                'document-management-hidden': !hasDocs
              })
            },orderByCreatedDate( docs ).map( doc => {
              return h( 'li', { key: doc.id() },
                [
                  h( DocumentManagementDocumentComponent, { doc, apiKey } ),
                  h( 'hr' )
                ]);
            })),
            h('div.document-management-no-docs', {
              className: makeClassList({
                'document-management-hidden': hasDocs
              })
            }, 'No documents found')
          ])
        ]),
        h('div.document-management-footer', {
          className: makeClassList({
            'document-management-hidden': loading || this.state.searchMode || !validApiKey || !hasDocs
          })
        }, [
          h( 'div.document-management-paginator', [
            h( ReactPaginate, {
              pageCount: this.state.pageCount,
              marginPagesDisplayed: 2,
              pageRangeDisplayed: 5,
              disableInitialCallback: true,
              initialPage,
              onPageChange: data => this.handlePageClick( data )
            })
          ])
        ])
      ])
    ]);
  }
}

export default DocumentManagement;
