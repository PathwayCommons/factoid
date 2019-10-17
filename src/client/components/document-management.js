import React from 'react';
import h from 'react-hyperscript';
import { Link } from 'react-router-dom';

import { tryPromise } from '../../util';
import MainMenu from './main-menu';

import queryString from 'query-string';

const getDocs = apiKey => {
  console.log(`getDocs called with ${apiKey}`);
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
    if( query.apiKey ) this.updateDocs( query.apiKey ); 
  }

  updateDocs( apiKey = this.state.apiKey ){
    getDocs( apiKey )
      .then( res => res.json() )
      .then( docs => new Promise( resolve => {
          this.setState({ 
            validApiKey: true, // no server error means it was accepted
            docs }, resolve);
        })
      )
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

    const header = h('div.page-content-title', [
      h( MainMenu, { history, admin: true } ),
      h('h1', 'Document management panel')
    ]);

    const apiKeyForm = 
    h('form.document-management-api-key-form', [ 
      h('label.document-management-text-label', 'API key'),
      h('input.document-management-api-key', {
        type: 'text',
        value: this.state.apiKey,
        onChange: e => this.handleFormChange( e.target.value )
      }),
      h('button.document-management-api-key-submit', {
        onClick: e => this.handleSubmit( e )
      }, 'Submit' )
    ]);

    const docList = h('div.document-management-list', [
      docs.map(doc => (
        h('div.document-management-doc', {
          key: doc.id
        }, [
          h('span', doc.id)
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
