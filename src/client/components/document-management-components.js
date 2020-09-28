import _ from 'lodash';
import h from 'react-hyperscript';
import React from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isThisMonth } from 'date-fns';
import queryString from 'query-string';

import Document from '../../model/document';
import {
  tryPromise,
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

/**
 * sendMail
 *
 * Client-side helper to send email and update doc state
 *
 * @param {String} emailType one of the recognized types to configure email template
 * @param {object} doc the model object
 * @param {string} apiKey to validate against protected routes
 */
const sendMail = ( emailType, doc, apiKey ) => {
  const id = doc.id();
  const secret = doc.secret();
  const url = `/api/document/email/${id}/${secret}/?${queryString.stringify({ apiKey, emailType })}`;

  return fetch( url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
};

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
        error ? h('span.invalid', ` | ${error.code}`): null
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
    const { id, secret } = this.props;
    const url = `/api/document/${id}/${secret}`;
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
    super( props );
    this.ESCAPE_KEY = 27;
    this.ENTER_KEY = 13;
    this.state = {
      editText: props.value,
      editing: false,
      sending: false
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
    const { doc, fieldName, params } = this.props;
    new Promise( resolve => {
      this.setState({
        sending: true,
        editing: false
      }, resolve );
    })
    .then( () => {
      return doc.provided({
        [fieldName]: this.state.editText.trim()
      })
       .then( () => doc );
    })
    .then( doc => {

      const id = doc.id();
      const secret = doc.secret();
      const url = `/api/document/${id}/${secret}`;
      return fetch( url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( params )
      });
    })
    .finally( () => {
      new Promise( resolve => {
        this.setState({
          sending: false
        }, resolve );
      });
    });
  }

  reset() {
    this.setState({
      editText: this.props.value,
      editing: false
    });
  }

  focusInput( c ) {
    if ( c ) c.focus();
  }

  handleKeyDown ( e ) {
    const { keyCode } = e;
    if ( keyCode  === this.ESCAPE_KEY ) {
      this.reset();
    } else if ( keyCode === this.ENTER_KEY ) {
      this.handleSubmit( e );
    }
  }

  handleFocus ( e ) {
    e.target.select();
  }

  render() {
    const { doc, label, fullWidth } = this.props;

    const editContent = h('div.document-management-text-editable', {
      className: makeClassList({
        'full-width': fullWidth
      })
    }, [
      h('input', {
        className: makeClassList({
          'hide-by-default': true,
          'show': this.state.editing
        }),
        autoFocus: true,
        ref: c => this.focusInput( c ),
        value: this.state.editText,
        onChange: e => this.handleChange( e ),
        onFocus: e => this.handleFocus( e ),
        onBlur: e => this.reset( e ),
        onKeyDown: e => this.handleKeyDown( e ),
        id: `document-management-text-editable-${doc.id()}`,
      }),
      h('label', {
        htmlFor: `document-management-text-editable-${doc.id()}`,
        className: makeClassList({
          'hide-by-default': true,
          'show': !this.state.editing
        })
      }, [
        label,
        h( 'i.material-icons', {
          onClick: this.handleEdit()
        }, 'edit' ),
      ])
    ]);

    return this.state.sending ? h( SendingComponent, {
      workingMessage: `Updating ${this.props.fieldName}`
    }): editContent;
  }
}

class DocumentManagementDocumentComponent extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { doc, apiKey } = this.props;

    const getRefreshDocDataButton = doc => {
      return h( DocumentRefreshButtonComponent, {
          id: doc.id(),
          secret: doc.secret(),
          workingMessage: ' Please wait',
          disableWhen: doc.trashed(),
          buttonKey: doc.id(),
          params: [
            { op: 'replace', path: 'article' },
            { op: 'replace', path: 'correspondence' },
            { op: 'replace', path: 'relatedPapers' }
          ],
          value: 'refresh',
          title: 'Refresh document data',
          label: h( 'i.material-icons', 'refresh' )
        });
    };

    // Document Header & Footer
    const getDocumentHeader = doc => {
      return h( 'div.document-management-document-section.meta', [
        h( 'div.document-management-document-section-items', [
          h( 'div', [
            h( 'i.material-icons.hide-by-default.invalid', {
              className: makeClassList({ 'show': hasIssues( doc ) })
            }, 'warning' ),
            h( 'i.material-icons.hide-by-default.complete', {
              className: makeClassList({ 'show': doc.submitted() || doc.isPublic() })
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
      if( hasIssue( doc, 'paperId' ) ){
        const { paperId: paperIdIssue } = doc.issues();
        const paperId = _.get( doc.provided(), 'paperId' );
        items = [
          h( TextEditableComponent, {
            className: 'full-width',
            doc,
            fieldName: 'paperId',
            value: paperId,
            label: h( 'span', `${paperIdIssue.message}` ),
            params: [ { op: 'replace', path: 'article' } ]
          })
        ];

      } else {
        const { authors: { contacts, abbreviation }, title, reference, pmid, doi } = doc.citation();
        const contactList = _.isArray( contacts ) && contacts.map( contact => `${contact.email} <${contact.name}>` ).join(', ');
        const { paperId } = doc.provided();

        items =  [
            h( 'strong', [
              h( 'a.plain-link.section-item-emphasize', {
                href: PUBMED_LINK_BASE_URL + pmid,
                target: '_blank'
              }, title )
            ]),
            h('small.mute', `${abbreviation}. ${reference}` ),
            h( 'small.mute', [
              h( 'a.plain-link', {
                href: DOI_LINK_BASE_URL + doi,
                target: '_blank'
              }, `DOI: ${doi}` )
            ]),
            h('small.mute', contactList),
            h( TextEditableComponent, {
              fullWidth: true,
              doc,
              fieldName: 'paperId',
              value: paperId,
              label: h('small.mute', `${paperId} `),
              params: [ { op: 'replace', path: 'article' } ]
            })
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
            h( 'div.document-management-document-section-label-text', 'Document:')
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
    const getVerified = doc => {
      let radios = [];
      let addType = (typeVal, displayName) => {
        radios.push(
          h('input', {
            type: 'radio',
            name: `document-verified-${doc.id()}`,
            id: `document-verified-radio-${doc.id()}-${displayName}`,
            value: typeVal,
            checked: typeVal === doc.verified(),
            onChange: () => doc.verified( typeVal )
          }),
          h('label', {
            htmlFor: `document-verified-radio-${doc.id()}-${displayName}`
          }, displayName)
        );
      };

      [ [ false, 'unverified' ], [ true, 'verified' ] ].forEach( ([ field, name ]) => addType( field, _.capitalize( name ) ) );
      return h( 'small.radioset', radios );
    };

    const getAuthorEmail = doc => {
      const { authorEmail } = doc.correspondence();
      const element = [`${authorEmail} `];
      return h( TextEditableComponent, {
          doc,
          fieldName: 'authorEmail',
          value: authorEmail,
          label: h( 'span', element ),
          params: [ { op: 'replace', path: 'correspondence' } ]
      });
    };

    const getDocumentCorrespondence = doc => {
      let content = null;
      if( hasIssue( doc, 'authorEmail' ) ){
        const { authorEmail: authorEmailIssue } = doc.issues();
        const authorEmail = _.get( doc.provided(), 'authorEmail' );
        content = h( 'div.document-management-document-section-items', [
          h( TextEditableComponent, {
            doc,
            fieldName: 'authorEmail',
            value: authorEmail,
            label: h( 'span', `${authorEmailIssue.message} `),
            params: [ { op: 'replace', path: 'correspondence' } ]
          })
        ]);

      } else {
        content = h( 'div.document-management-document-section-items', [
          h( 'div.document-management-document-section-items-row', [
            getAuthorEmail( doc ),
            getVerified( doc )
          ]),
          h( DocumentEmailButtonComponent, {
            params: { doc, apiKey },
            workingMessage: 'Sending...',
            buttonKey: EMAIL_TYPE_INVITE,
            value: EMAIL_TYPE_INVITE,
            label: _.capitalize( EMAIL_TYPE_INVITE ),
            disableWhen: doc.initiated() || doc.trashed()
          }),
          h( DocumentEmailButtonComponent, {
            params: { doc, apiKey },
            workingMessage: 'Sending...',
            buttonKey: EMAIL_TYPE_FOLLOWUP,
            value: EMAIL_TYPE_FOLLOWUP,
            label: _.upperFirst( EMAIL_TYPE_FOLLOWUP.replace(/([A-Z])/g, (match, letter) => '-' + letter) ),
            disableWhen: doc.initiated() || doc.trashed()
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

    // Editing
    const getDocumentStatus = doc => {
      let radios = [];
      let addType = (typeVal, displayName) => {
        radios.push(
          h('input', {
            type: 'radio',
            name: `document-status-${doc.id()}`,
            id: `document-status-radio-${doc.id()}-${typeVal}`,
            value: typeVal,
            checked: _.get( DOCUMENT_STATUS_FIELDS, typeVal ) === doc.status(),
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
      let isEdited = doc.lastEditedDate() !== doc.createdDate();
      return h( 'div.document-management-document-section.meta', [
          h( 'small.document-management-document-section-items.pull-right', [
            getDocumentStatus( doc ),
            getRefreshDocDataButton( doc ),
            h( 'div.mute', { key: 'created' }, `Created ${created}` ),
            h( 'div.mute', { key: 'edited' }, isEdited ? `Edited ${edited}`: 'Not edited' )
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