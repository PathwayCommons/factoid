import _ from 'lodash';
import React from 'react';
import h from 'react-hyperscript';
import { Link } from 'react-router-dom';

import { tryPromise } from '../../util';
import MainMenu from './main-menu';

import queryString from 'query-string';
const LOCALE = 'en-US';
const DEFAULT_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const DEFAULT_TIME_OPTS = { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };

const getDocs = apiKey => {
  const url = '/api/document';
  const params = { apiKey };
  const paramsString = queryString.stringify( params );
  return fetch(`${url}?${paramsString}`);
};

class DocumentManagement extends React.Component {
  constructor( props ){
    super( props );
    
    this.state = {
      apiKey: '',
      validApiKey: false,
      docs: [],
      error: undefined
    };
  }

  componentDidMount(){
    const query = queryString.parse( this.props.history.location.search );
    if( query.apiKey ) this.updateDocs( query.apiKey ); // for convenience, put it as query param
  }

  updateDocs( apiKey = this.state.apiKey ){
    getDocs( apiKey )
      .then( res => res.json() )
      .then( docs => new Promise( resolve => {console.log(docs);
          this.setState({ 
            validApiKey: true, // no error means its good
            docs }, resolve);
        })
      )
      .then( () => this.props.history.push(`/document?apiKey=${apiKey}`) )
      .catch( e => this.setState( { error: e, validApiKey: false } ) );
  }

  handleFormChange( apiKey ) {
    this.setState( { apiKey } );
  }

  handleSubmit( event ){
    event.preventDefault();
    this.updateDocs();
  }

  render(){
    let { history } = this.props;
    let { docs, validApiKey } = this.state;

    const withDefault = ( o, k ) => _.get( o, k ) ? _.get( o, k ) : `No ${k}`;
    const formatDate = dString => {
      const d = new Date(dString);
      return d.toLocaleDateString( LOCALE, _.assign( DEFAULT_DATE_OPTS, DEFAULT_TIME_OPTS ) );
    };

    const hasSubmitted = o => _.has( o, ['data', 'submitted'] );
    const submitDate = doc => {
      const isSubmitted = _.has( doc, 'submitted' );
      if ( isSubmitted ) {
        const submitOp = _.find( doc._ops, hasSubmitted );
        const submitDate = formatDate( _.get( submitOp, 'timestamp' ) );
        return h( 'li.submitted', { key: 'submitted' }, `Submitted: ${submitDate}` );
      } 
      return null;
    };

    const header = h('div.page-content-title', [
      h( MainMenu, { history, admin: true } ),
      h('h1', 'Document management panel')
    ]);

    const apiKeyForm = 
    h('form.document-management-api-key-form', [ 
      h('label.document-management-text-label', 'API key'),
      h('input', {
        type: 'text',
        value: this.state.apiKey,
        onChange: e => this.handleFormChange( e.target.value )
      }),
      h('button', {
        onClick: e => this.handleSubmit( e )
      }, 'Submit' )
    ]);

    const docCitation = doc => {
      return  h('div.citation-components', [
        h('div.citation-components-title', withDefault( doc, 'title' ) ),
        h('div.citation-components-authors', withDefault( doc, 'authors' ) ),
        h('div.citation-components-journal', [
          h( 'span', `${doc.journalName}` )
        ])
      ])
    };

    const docDates = doc => {
      return h( 'ul.docDates', [
        h( 'li', { key: '_creationTimestamp' }, `Created: ${formatDate( doc._creationTimestamp )}` ),
        submitDate( doc )
      ]);
    };

    const docLinks = doc => {
      return h( 'div.docLinks', [
          h( Link, { 
            to: `/document/${doc.id}`, 
            target: '_blank' 
          }, h( 'button', ['View'] ) ) 
      ]);
    };

    const docList = h('ul.body.doc-list', [
      docs.map(doc => (
        h('li', {
            key: doc.id
          },[ 
          docCitation( doc ),
          docDates( doc ),
          docLinks( doc )
        ])
      ))
    ]);
    
    let body = validApiKey ? docList: apiKeyForm;

    return h('div.document-management.page-content', [ 
      h('div.document-management-content', [
        header,
        body
      ])
    ]);
  }
}

export default DocumentManagement;
