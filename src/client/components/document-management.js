import _ from 'lodash';
import React from 'react';
import h from 'react-hyperscript';
import queryString from 'query-string';
import { Link } from 'react-router-dom';

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

  handleEmail( mailOpts ) {  
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

    const formatDate = dateString => ( new Date( dateString ) ).toLocaleDateString( LOCALE, _.assign( DEFAULT_DATE_OPTS, DEFAULT_TIME_OPTS ) );
    const lastModDate = doc => {
      const sorted = _.sortBy( doc._ops, [o => new Date( _.get( o , 'timestamp' ) )] );
      return _.get( _.last( sorted ), 'timestamp' );
    };
    
    // Do all data mapping in one place
    const dataFromDoc = doc => {
      const data = {
        article: {
          title: _.get( doc, 'title' ),
          authors: _.get( doc, 'authors' ).split(','),
          journal: _.get( doc, 'journalName' ),
          articleUrl: `${PUBMED_LINK_BASE_URL}${_.get( doc, 'trackingId' )}`,
          volume: '',
          issue: '',
          pubDate: ''
        },
        network: {
          summaryPath: `/document/${doc.id}`,
          editablePath: `/document/${doc.id}/${doc.secret}`
        },
        correspondence: {
          email: _.get( doc, 'contributorEmail' ),
          mailOpts: msgFactory( doc ),
          context: '',
          invite: '', 
          reminder: '',
          submit: ''
        },
        status: {
          created: formatDate( doc._creationTimestamp ),
          lastModified: formatDate( lastModDate( doc ) ),
          submitted: _.get( doc, 'submitted' )
        }
      };
      return data;
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

    // Article 
    const getDocumentArticle = article => {
      const { title, articleUrl, authors, journal } = article;
      return  [
        h('h3', [
          h( 'a.plain-link', {
            href: articleUrl,
            target: '_blank'
          }, title )
        ] ),
        h( 'span', [
          h('p', authors ),
          h('p', [
            h( 'span', journal )
          ])
        ])
      ];
    };

    // Network 
    const getDocumentNetwork = network => {
      const { summaryPath, editablePath } = network;
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
                to: editablePath,
                target: '_blank'
              }, 'Editable' )
            ])
          ])
        ])
      ];
    };

     // Correspondence
     const getDocumentCorrespondence = correspondence => {
      const { email, mailOpts } = correspondence;
      return [
        h( 'div.document-management-horizontal-list.hide-on-submit', [  
          h( 'div.document-management-text-label', `Correspondence (${email})`),
          h( 'ul', [
            h( 'li', [ 
              h( 'button', {
                onClick: () => this.handleEmail( mailOpts )
              }, 'Email Invite' )
            ])
          ])
        ])
      ];
    };

    // Document Header & Footer
    const getDocumentHeader = () => [ h( 'i.material-icons.show-on-submit', 'check_circle' ) ];
    const getDocumentStatus = status => {
      const { created, modified } = status;
      return [
        h( 'ul.mute', [
          h( 'li', { key: 'created' }, `Created: ${created}` ),
          h( 'li', { key: 'modified' }, `Last Modified: ${modified}` )
        ])
      ];
    };

    const documentList = h( 'ul', [
      docs.map( doc => {
        const { article, network, correspondence, status } = dataFromDoc( doc );
        return h( 'li', { 
          className: makeClassList({'is-submitted': _.has( doc, 'submitted' ) }),
          key: doc.id 
        }, 
        [
          h( 'div.document-management-document-meta', getDocumentHeader() ),
          h( 'div.document-management-document-section', getDocumentArticle( article ) ),
          h( 'div.document-management-document-section', getDocumentNetwork( network ) ),
          h( 'div.document-management-document-section', getDocumentCorrespondence( correspondence ) ),
          h( 'div.document-management-document-meta', getDocumentStatus( status ) ),
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
