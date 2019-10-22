import _ from 'lodash';
import React from 'react';
import h from 'react-hyperscript';
import queryString from 'query-string';
import { Link } from 'react-router-dom';

//import { tryPromise } from '../../util';
import MainMenu from './main-menu';

const encodeApiKey = secret => secret ? secret: '%27%27';
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
    if( query.apiKey ) this.updateDocs( encodeApiKey( query.apiKey ) ); // for convenience, put it as query param
  }

  updateDocs( apiKey = this.state.apiKey ){
    getDocs( encodeApiKey( apiKey ) )
      .then( res => res.json() )
      .then( docs => new Promise( resolve => {
          this.setState({
            validApiKey: true, // no error means its good
            error: null,
            docs }, resolve);
        })
      )
      .then( () => this.props.history.push(`/document?apiKey=${apiKey}`) )
      .catch( e => {
        this.setState( { error: e, validApiKey: false } );
        return;
      });
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

    const header = h('div.page-content-header', [
      h( MainMenu, { history, admin: true } ),
      h('h1', 'Document management panel')
    ]);

    // Authorization
    const apiKeyForm =
    h('form', [
      h('label.document-management-text-label', 'API key'),
      h('input', {
        type: 'text',
        value: this.state.apiKey,
        onChange: e => this.handleFormChange( e.target.value )
      }),
      this.state.error ? h('div.error', 'Unable to authorize' ): null,
      h('button', {
        onClick: e => this.handleSubmit( e )
      }, 'Submit' )
    ]);

    // Article Information
    const articleInfo = doc => {
      return  [
        h('h3', withDefault( doc, 'title' ) ),
        h( 'span', [
          h('p', withDefault( doc, 'authors' ) ),
          h('p', [
            h( 'span', `${doc.journalName}` )
          ])
        ])
      ];
    };

    // Contributor info
    // const contributorActions = doc => {
    //   return [
    //     h( 'span', {
    //         href: ``
    //       }, h( 'button', { disabled: true }, 'Action1' ) )
    //   ];
    // };
    const contributorInfo = doc => {
      return [
        h( 'p', `Contributor: ${doc.contributorName} (${doc.contributorEmail})` )
        // TODO: [Send invite], ...
      ];
    };

    // Document Status
    const hasSubmitted = o => _.has( o, ['data', 'submitted'] );
    const submitDate = doc => {
      if ( _.has( doc, 'submitted' ) ) {
        const submitOp = _.find( doc._ops, hasSubmitted );
        const submitDate = formatDate( _.get( submitOp, 'timestamp' ) );
        return h( 'p.emphasize', { key: 'submitted' }, `Submitted: ${submitDate}` );
      }
      return null;
    };

    const documentStatus = doc => {
      return [
        h( 'p', { key: '_creationTimestamp' }, `Created: ${formatDate( doc._creationTimestamp )}` ),
        submitDate( doc )
        // TODO: [Last updated], ...
      ];
    };

    // Document -- Action
    const documentAction = doc => {
      return [
        h( Link, {
            to: `/document/${doc.id}`,
            target: '_blank'
          }, h( 'button', ['View'] ) )
      ];
    };

    const documentList = h( 'ul', [
      docs.map( doc =>
        h( 'li', { key: doc.id }, [
          h( 'div.document-management-document-section', articleInfo( doc ) ),
          h( 'div.document-management-document-section', documentStatus( doc ) ),
          h( 'div.document-management-document-section', contributorInfo( doc ) ),
          h( 'div.document-management-document-section', documentAction( doc ) )
        ]
      ))
    ]);


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
