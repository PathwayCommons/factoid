import _ from 'lodash';
import React from 'react';
import h from 'react-hyperscript';
import queryString from 'query-string';
import { Link } from 'react-router-dom';

import { makeClassList } from '../../util';
import { 
  BASE_URL,
  EMAIL_FROM,
  EMAIL_FROM_ADDR,
  EMAIL_VENDOR_MAILJET,
  INVITE_TMPLID,
  EMAIL_CONTEXT_SIGNUP
} from '../../config' ;
//import { tryPromise } from '../../util';
import MainMenu from './main-menu';

const sanitize = secret => secret === '' ? '%27%27': secret;
const LOCALE = 'en-US';
const DEFAULT_DATE_OPTS = { year: 'numeric', month: 'long', day: 'numeric' };
const DEFAULT_TIME_OPTS = { hour12: false, hour: '2-digit', minute: 'numeric', second: 'numeric' };

const getDocs = apiKey => {
  const url = '/api/document';
  const params = { apiKey };
  const paramsString = queryString.stringify( params );
  return fetch(`${url}?${paramsString}`);
};

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
      .then( docs => new Promise( resolve => {
          this.setState({
            validApiKey: true, // no error means its good
            apiKey,
            error: null,
            docs }, resolve);
        })
      )
      .then( () => this.props.history.push(`/document?apiKey=${sanitize(apiKey)}`) )
      .catch( e => {
        this.setState( { 
          error: e, 
          validApiKey: false,
          apiKey: ''
         }, () => this.props.history.push(`/document`) );
        return;
      });
  }

  handleEmail( doc ) {  
    const mailOpts = msgFactory( doc );
    sendMail( mailOpts, this.state.apiKey )
      .then( info => info );// TODO should hide if invited (update with state)
  }

  handleApiKeyFormChange( apiKey ) {
    this.setState( { apiKey } );
  }

  handleApiKeySubmit( event ){
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

    const header = h('div.page-content-title', [
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
          onChange: e => this.handleApiKeyFormChange( e.target.value )
        }),
        this.state.error ? h('div.error', 'Unable to authorize' ): null,
        h('button', {
          onClick: e => this.handleApiKeySubmit( e )
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

    // Contributor    
    const correspondence = doc => {
      return [
        h( 'div.document-management-horizontal-list.hide-on-submit', [  
          h( 'div.document-management-text-label', `Correspondence (${doc.contributorEmail})`),
          h( 'ul', [
            h( 'li', [ 
              h( 'button', {
                onClick: () => this.handleEmail( doc )
              }, 'Email Invite' )
            ])
          ])
        ])
      ];
    };

    // Document -- Views
    const documentViews = doc => {
      const summaryPath = `/document/${doc.id}`;
      const editPath = `${summaryPath}/${doc.secret}`;
      return [
        h( 'div.document-management-horizontal-list', [
          h( 'div.document-management-text-label', ''),
          h( 'ul', [
            h( 'li', [ 
              h( Link, {
                to: summaryPath,
                target: '_blank',
              }, 'Summary' )
            ]),
            h( 'li', [ 
              h( Link, {
                to: editPath,
                target: '_blank'
              }, 'Editable' )
            ])
          ])
        ])
      ];
    };

    // Document Header & Footer
    const lastModDate = doc => {
      const sorted = _.sortBy( doc._ops, [o => new Date( _.get( o , 'timestamp' ) )] );
      return _.get( _.last( sorted ), 'timestamp' );
    };
    const documentHeader = () => [ h( 'i.material-icons.show-on-submit', 'check_circle' ) ];
    const documentFooter = doc => {
      return [
        h( 'ul.mute', [
          h( 'li', { key: 'created' }, `Created: ${formatDate( doc._creationTimestamp )}` ),
          h( 'li', { key: 'modified' }, `Last Modified: ${formatDate( lastModDate( doc ) )}` )
        ])
      ];
    };

    const documentList = h( 'ul', [
      docs.map( doc => {
        return h( 'li', { 
          className: makeClassList({'is-submitted': _.has( doc, 'submitted' ) }),
          key: doc.id 
        }, 
        [
          h( 'div.document-management-document-meta', documentHeader( doc ) ),
          h( 'div.document-management-document-section', articleInfo( doc ) ),
          h( 'div.document-management-document-section', documentViews( doc ) ),
          h( 'div.document-management-document-section', correspondence( doc ) ),
          h( 'div.document-management-document-meta', documentFooter( doc ) ),
          h( 'hr' )
        ]);
      })
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
