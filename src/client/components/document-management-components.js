import _ from 'lodash';
import h from 'react-hyperscript';
import React from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isThisMonth } from 'date-fns';

import Document from '../../model/document';
import {
  tryPromise,
  sendMail,
  makeClassList
} from '../../util';
import logger from '../logger';
import DirtyComponent from './dirty-component';
import {
  PUBMED_LINK_BASE_URL,
  DOI_LINK_BASE_URL,
  EMAIL_TYPE_INVITE,
  EMAIL_TYPE_FOLLOWUP
} from '../../config' ;

const DOCUMENT_STATUS_FIELDS = Document.statusFields();

const hasIssues = doc => _.values( doc.issues() ).some( i => !_.isNull( i ) );
const hasIssue = ( doc, key ) => _.has( doc.issues(), key ) && !_.isNull( _.get( doc.issues(), key ) );

class SendingComponent extends React.Component {
  constructor( props ){
    super( props );
  }

  render() {
    return h('small.mute', [
      h('span', ` ${this.props.workingMessage}` || ' Working...'),
      h('i.icon.icon-spinner.document-seeder-submit-spinner')
    ]);
  }
}

class DocumentButtonComponent extends DirtyComponent {
  constructor( props ){
    super( props );

    this.state = {
      sending: false
    };
  }

  doWork( params, value ) {
    return Promise.resolve( { params, value } );
  }

  onDoneWork() {
    return null;
  }

  handleClick( params, value ) {
    tryPromise( () => new Promise( resolve => {
      this.setState({ sending: true }, resolve );
    }))
    .then(() => this.doWork( params, value ) )
    .finally( () => new Promise( resolve => {
      this.setState({ sending: false }, resolve );
    }));
  }

  render(){
    let { label, disableWhen, params, buttonKey: key, value, className, title, workingMessage } = this.props;
    return h( 'span', { key, className }, [
      h( 'button', {
        title,
        value,
        onClick: e => this.handleClick( params, e.target.value ),
        disabled: this.state.sending || disableWhen
      }, [ label ]),
      this.state.sending ? h( SendingComponent, { workingMessage }): this.onDoneWork( params, value )
    ]);
  }
}

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

class DocumentEmailButtonComponent extends DocumentButtonComponent {
  constructor( props ){
    super( props );
  }

  doWork( params, value ) {
    const emailType = value;
    const { doc, apiKey } = params;
    return sendMail( emailType, doc, apiKey );
  }

  onDoneWork( params, value ){
    const { doc } = params;
    const { emails } = doc.correspondence();
    const infos = _.filter( emails, { 'emailType': value } );
    const last = toPeriodOrDate( _.get( _.last( infos ), 'date' ) );
    const error = _.get( _.last( infos ), 'error' );
    if( _.size( infos ) ){
      return h( 'small.mute', [
        h('span', ` ${_.size( infos )}`),
        h('span', ` | ${last}`),
        error ? h('span.invalid', ` | ${error.statusText}`): null
      ]);
    } else {
      return null;
    }
  }
}

class DocumentRefreshButtonComponent extends DocumentButtonComponent {
  constructor( props ){
    super( props );
  }

  doWork( params ) {
    const url = '/api/document';
    return fetch( url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( params )
    });
  }
}

class TextEditableComponent extends React.Component {

  constructor( props ) {
    super();
    this.ESCAPE_KEY = 27;
    this.ENTER_KEY = 13;
    this.state = {
      editText: props.initial,
      editing: false
    };
  }

  handleEdit () {
    return () => this.setState({
      editing: !this.state.editing
    });
  }

  handleChange ( e ) {
    this.setState({ editText: e.target.value });
  }

  handleSubmit () {
    new Promise( resolve => {
      this.setState({
        editing: false
      }, resolve );
    })
    .then( () => {
      const { doc } = this.props;
      const paperId = this.state.editText.trim();
      return doc.provided({ paperId })
       .then( () => doc );
    })
    .then( doc => {
      const params = {
        id: doc.id(),
        secret: doc.secret(),
        apiKey: this.props.apiKey
      };
      const url = '/api/document';
      return fetch( url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( params )
      });
    });
  }

  reset() {
    this.setState({
      editText: this.props.initial,
      editing: false
    });
  }

  handleKeyDown ( e ) {
    const { keyCode } = e;
    if ( keyCode  === this.ESCAPE_KEY ) {
      this.reset();
    } else if ( keyCode === this.ENTER_KEY ) {
      this.handleSubmit( e );
    }
  }

  render() {
    const { doc } = this.props;

    return h('div.document-management-text-editable', [
      h('input', {
        className: makeClassList({
          'hide-by-default': true,
          'show': this.state.editing
        }),
        value: this.state.editText,
        onChange: e => this.handleChange( e ),
        onBlur: e => this.reset( e ),
        onKeyDown: e => this.handleKeyDown( e ),
        id: `document-management-text-editable-${doc.id()}`,
      }),
      h('label', {
        htmlFor: `document-status-radio-${doc.id()}`,
        className: makeClassList({
          'hide-by-default': true,
          'show': !this.state.editing
        }),
        onDoubleClick: this.handleEdit()
      }, this.state.editText )
    ]);
  }
}

class DocumentManagementDocumentComponent extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { doc, apiKey } = this.props;

    // Document Header & Footer
    const getDocumentHeader = doc => {
      return h( 'div.document-management-document-section.meta', [
        h( 'div.document-management-document-section-items', [
          h( 'div', [
            h( 'i.material-icons.hide-by-default.invalid', {
              className: makeClassList({ 'show': hasIssues( doc ) })
            }, 'warning' ),
            h( 'i.material-icons.hide-by-default.mute', {
              className: makeClassList({ 'show': doc.approved() })
            }, 'thumb_up' ),
            h( 'i.material-icons.hide-by-default.complete', {
              className: makeClassList({ 'show': doc.submitted() })
            }, 'check_circle' ),
            h( 'i.material-icons.hide-by-default.mute', {
              className: makeClassList({ 'show': doc.trashed() })
            }, 'delete' )
          ]),

        ])
      ]);
    };

    // Article
    const getDocumentArticle = doc => {
      let items = null;
      // const { paperId: initial } = doc.provided();
      // let labelContent = labelContent = h( TextEditableComponent, {
      //   doc, initial, apiKey
      // });

      if( hasIssue( doc, 'paperId' ) ){
        const { paperId: paperIdIssue } = doc.issues();
        items = [
          h( 'div', [
            h( 'i.material-icons', 'error_outline' ),
            h( 'span', ` ${paperIdIssue}` )
          ])
        ];

      } else {
        const { authors, contacts, title, reference, pmid, doi } = doc.citation();
        const contactList = contacts.map( contact => `${contact.email} <${contact.name}>` ).join(', ');
        items =  [
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
          ];
      }

      return h( 'div.document-management-document-section', [
        h( 'div.document-management-document-section-label', {
          className: makeClassList({ 'issue': hasIssue( doc, 'paperId' ) })
        }, [
          h( 'div.document-management-document-section-label-text', 'Article:')
        ]),
        h( 'div.document-management-document-section-items', items )
      ]);
    };

    // Document
    const getDocumentInfo = doc => {
      return h( 'div.document-management-document-section', [
          h( 'div.document-management-document-section-label', [
            h( 'div.document-management-document-section-label-text', 'Document:'),
            h( 'div.document-management-document-section-label-content', [
              h( DocumentRefreshButtonComponent, {
                workingMessage: 'Refreshing',
                disableWhen: doc.trashed(),
                buttonKey: doc.id(),
                params: { id: doc.id(), secret: doc.secret(), apiKey },
                value: 'refresh',
                title: 'Refresh document data',
                label: h( 'i.material-icons', 'refresh' )
              })
            ])
          ]),
          h( 'div.document-management-document-section-items', [
            h( 'div.document-management-document-section-items-row', [
              h( Link, {
                className: 'plain-link',
                to: doc.publicUrl(),
                target: '_blank',
              }, 'Summary' ),
              h( Link, {
                className: 'plain-link',
                to: doc.privateUrl(),
                target: '_blank'
              }, 'Editable' )
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
      if( isCorrespondingAuthor ) element.push( h( 'small', '(Corresponding)' ) );
      return element;
    };

    const getDocumentCorrespondence = doc => {
      let content = null;
      if( hasIssue( doc, 'authorEmail' ) ){
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
          h( DocumentEmailButtonComponent, {
            params: { doc, apiKey },
            workingMessage: 'Sending...',
            buttonKey: EMAIL_TYPE_INVITE,
            value: EMAIL_TYPE_INVITE,
            label: _.capitalize( EMAIL_TYPE_INVITE ),
            disableWhen: doc.requested() || doc.trashed()
          }),
          h( DocumentEmailButtonComponent, {
            params: { doc, apiKey },
            workingMessage: 'Sending...',
            buttonKey: EMAIL_TYPE_FOLLOWUP,
            value: EMAIL_TYPE_FOLLOWUP,
            label: _.upperFirst( EMAIL_TYPE_FOLLOWUP.replace(/([A-Z])/g, (match, letter) => '-' + letter) ),
            disableWhen: doc.requested() || doc.trashed()
          })
        ]);
      }

      return h( 'div.document-management-document-section', [
        h( 'div.document-management-document-section-label', {
          className: makeClassList({ 'issue': hasIssue( doc, 'authorEmail' ) })
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

    return h('div.document-management-document', [
      getDocumentHeader( doc ),
      getDocumentArticle( doc ),
      getDocumentInfo( doc ),
      getDocumentCorrespondence( doc ),
      getDocumentStats( doc )
    ]);
  }
}


export {
  DocumentManagementDocumentComponent
};