import { Component } from 'react';
import h from 'react-hyperscript';
import _ from 'lodash';
import { makeClassList } from '../dom';
import { truncateString } from '../../util';
import { DOI_LINK_BASE_URL } from '../../config';
import { focusDomElement } from '../dom';

const checkStatus = response => {
  if ( response.status >= 200 && response.status < 300 ) {
    return response;
  } else {
    var error = new Error( response.statusText );
    error.response = response;
    throw error;
  }
};

class RequestForm extends Component {
  constructor(props){
    super(props);

    this.bus = this.props.bus;

    this.state = {
      paperId: this.getFormField( 'paperId' ),
      authorEmail: this.getFormField( 'authorEmail' ),
      authorName: this.getFormField( 'authorName' ),
      submitting: false,
      done: false,
      docJSON: undefined,
      errors: {
        incompleteForm: false,
        network: false
      }
    };

    this.focusTitle = _.debounce(() => {
      const titleEl = window.document.querySelector('.request-form-field-title');

      if(titleEl){
        focusDomElement(titleEl);
      }
    }, 50);

    this.onCloseCTA = () => {};
    this.onOpenCTA = () => this.focusTitle();
  }

  getFormField( fieldName ){
    const { formFields = {} } = this.props;
    return _.get( formFields, fieldName, '' );
  }

  reset(){
    this.setState({
      paperId: this.getFormField( 'paperId' ),
      authorEmail: this.getFormField( 'authorEmail' ),
      authorName: this.getFormField( 'authorName' ),
      submitting: false,
      done: false,
      docJSON: undefined,
      errors: {
        incompleteForm: false,
        network: false
      }
    });
  }

  componentDidMount(){
    this.bus.on('closecta', this.onCloseCTA);
    this.bus.on('opencta', this.onOpenCTA);
  }

  componentWillUnmount(){
    this.bus.removeListener('closecta', this.onCloseCTA);
    this.bus.removeListener('opencta', this.onOpenCTA);
  }

  updateForm(fields){
    this.setState(fields);
  }

  submitRequest(){
    let { paperId, authorEmail, authorName } = this.state;
    const { checkIncomplete = true, doc = null } = this.props;

    // if doc property is not set create a document else edit the existing one
    let createDoc = ( doc == null );

    if( checkIncomplete && ( !paperId || !authorEmail || !authorName ) ){
      this.setState({ errors: { incompleteForm: true } });

    } else {
      paperId = _.trim( paperId ) || undefined;
      authorEmail = authorEmail || undefined;
      authorName = authorName || undefined;

      let fcn = () => {
        if ( createDoc ) {
          const url = 'api/document';

          const data = _.assign( {}, {
            paperId,
            authorEmail,
            authorName
          });
          const fetchOpts = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( data )
          };

          return fetch( url, fetchOpts )
            .then( checkStatus )
            .then( response => response.json() )
            .then( docJSON => new Promise( resolve => {
              window.open(docJSON.privateUrl);

              this.setState({ done: true, docJSON }, resolve );
            } ) );
        }
        else {
          let existingTitle = doc.citation().title;
          let existingName = doc.provided().name;
          let existingEmail = doc.correspondence();

          const data = [];
          const provided = {};

          if ( paperId && paperId != existingTitle ) {
            provided['paperId'] = paperId;
            data.push({ path: 'article', op: 'replace' });
          }
          if ( authorName && authorName != existingName ) {
            provided['name'] = authorName;
          }
          if ( authorEmail && authorEmail != existingEmail ) {
            provided['authorEmail'] = authorEmail;
            data.push({ path: 'correspondence', op: 'replace' });
          }

          let docId = doc.id();
          let docSecret = doc.secret();

          const url = `/api/document/${docId}/${docSecret}`;
          const fetchOpts = {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( data )
          };

          return doc.provided( provided )
            .then( () => fetch( url, fetchOpts ) )
            .then( checkStatus )
            .then( response => response.json() )
            .then( docJSON => new Promise( resolve => {
              this.bus.emit('updatetitle');
              this.setState({ done: true, docJSON }, resolve );
            } ) );
        }
      };

      this.setState({ submitting: true, errors: { incompleteForm: false, network: false } });

      const emitAndResolve = resolve => {
        this.bus.emit( 'requestBtnClick' );
        resolve();
      };

      ( fcn()
        .catch( () => new Promise( resolve => this.setState({ errors: { network: true } }, resolve ) ) )
        .finally( () => new Promise( resolve => this.setState({ submitting: false }, () => emitAndResolve( resolve ) ) ) )
      );
    }
  }

  render(){
    const { done, docJSON } = this.state;
    const { submitBtnText, doc, addClasses } = this.props;
    let createDoc = ( doc == null );
    let showDescription = _.defaultTo(this.props.showDescription, true);
    let showTitle = _.defaultTo(this.props.showTitle, true);

    if( done && docJSON ){
      const { privateUrl, citation: { doi, title, reference } } = docJSON;
      const displayTitle = title ? truncateString( title  ) : null;
      return h('div.request-form-container', [
        h('div.request-form-done', [
          createDoc ? h( 'a.request-form-done-button', { href: privateUrl, target: '_blank', }, 'Start Biofactoid' ) : null,
          displayTitle ? h( 'div.request-form-done-title', [
            h('span', 'Title: ' ),
            h( doi ? 'a.plain-link': 'span', (doi ? { href: `${DOI_LINK_BASE_URL}${doi}`, target: '_blank'}: {}), displayTitle )
          ]) : null,
          reference ? h( 'div.request-form-done-info', reference ) : null
        ])
      ]);
    }

    const isFormFieldPredefined = field => {
      const val = _.get(this.props, ['formFields', field]);

      return val != null && val != '';
    };

    return h('div.request-form-container' + (addClasses ? addClasses : ''), [
      showTitle ? h('div.request-form-description', `Enter your article information`) : null,
      h('i.icon.icon-spinner.request-spinner', {
        className: makeClassList({ 'request-spinner-shown': this.state.submitting })
      }),
      h('div.request-form', {
        className: makeClassList({ 'request-form-submitting': this.state.submitting })
      }, [
        h('input.request-form-field-title', {
          type: 'text',
          placeholder: `Article title (or PMID/DOI)`,
          onChange: e => this.updateForm({ paperId: e.target.value }),
          value: this.state.paperId
        }),
        h('input.request-form-field-name', {
          type: 'text',
          placeholder: `Your name`,
          onChange: e => this.updateForm({
            authorName: e.target.value
          }),
          value: this.state.authorName,
          spellCheck: false,
          className: makeClassList({ 'request-form-provided': isFormFieldPredefined('authorName') })
        }),
        h('input.request-form-field-email', {
          type: 'text',
          placeholder: `Your email address`,
          onChange: e => this.updateForm({
            authorEmail: e.target.value
          }),
          value: this.state.authorEmail,
          spellCheck: false,
          className: makeClassList({ 'request-form-provided': isFormFieldPredefined('authorEmail') }),
        }),
        showDescription ? h( 'div.request-form-footer', `A private editing link will be sent to your email. Email addresses are never shared.` ) : null,
        h('div.request-error', {
          className: makeClassList({ 'request-error-message-shown': this.state.errors.incompleteForm })
        }, 'Fill out everything above, then try again.'),
        h('div.request-error', {
          className: makeClassList({ 'request-error-message-shown': this.state.errors.network })
        }, 'Please try again later'),
        h('button.super-salient-button.request-submit', {
          onClick: () => this.submitRequest()
        }, submitBtnText)
      ])
    ]);
  }
}

export default RequestForm;
