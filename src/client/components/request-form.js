import { Component } from 'react';
import h from 'react-hyperscript';
import _ from 'lodash';
import { makeClassList } from '../dom';
import { truncateString } from '../../util';
import { DOI_LINK_BASE_URL } from '../../config';

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
      submitting: false,
      done: false,
      docJSON: undefined,
      errors: {
        incompleteForm: false,
        network: false
      }
    };

    this.onCloseCTA = () => this.reset();
  }

  getFormField( fieldName ){
    const { formFields } = this.props;
    return _.get( formFields, fieldName, '' );
  }

  reset(){
    this.setState({
      paperId: this.getFormField( 'paperId' ),
      authorEmail: this.getFormField( 'authorEmail' ),
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
  }

  componentWillUnmount(){
    this.bus.removeListener('closecta', this.onCloseCTA);
  }

  updateForm(fields){
    this.setState(fields);
  }

  submitRequest(){
    const { paperId, authorEmail } = this.state;

    if( !paperId || !authorEmail ){
      this.setState({ errors: { incompleteForm: true } });

    } else {
      const url = 'api/document';
      const data = _.assign( {}, {
        paperId: _.trim( paperId ),
        authorEmail
      });
      const fetchOpts = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
      };

      this.setState({ submitting: true, errors: { incompleteForm: false, network: false } });

      ( fetch( url, fetchOpts )
        .then( checkStatus )
        .then( response => response.json() )
        .then( docJSON => new Promise( resolve => {
          window.open(docJSON.privateUrl);

          this.setState({ done: true, docJSON }, resolve );
        } ) )
        .catch( () => new Promise( resolve => this.setState({ errors: { network: true } }, resolve ) ) )
        .finally( () => new Promise( resolve => this.setState({ submitting: false }, resolve ) ) )
      );
    }
  }

  render(){
    const { done, docJSON } = this.state;
    const { submitBtnText } = this.props;

    if( done && docJSON ){
      const { privateUrl, citation: { doi, title, reference } } = docJSON;
      const displayTitle = truncateString( title );

      return h('div.home-request-form-container', [
        h('div.home-request-form-done', [
          h( 'a.home-request-form-done-button', { href: privateUrl, target: '_blank', }, 'Start Biofactoid' ),
          h( 'div.home-request-form-done-title', [
            h('span', 'Title: ' ),
            h( doi ? 'a.plain-link': 'span', (doi ? { href: `${DOI_LINK_BASE_URL}${doi}`, target: '_blank'}: {}), displayTitle )
          ]),
          reference ? h( 'div.home-request-form-done-info', reference ) : null
        ])
      ]);
    }

    return h('div.home-request-form-container', [
      h('div.home-request-form-description', `Enter your article information`),
      h('i.icon.icon-spinner.home-request-spinner', {
        className: makeClassList({ 'home-request-spinner-shown': this.state.submitting })
      }),
      h('div.home-request-form', {
        className: makeClassList({ 'home-request-form-submitting': this.state.submitting })
      }, [
        h('input', {
          type: 'text',
          placeholder: `Article title`,
          onChange: e => this.updateForm({ paperId: e.target.value }),
          value: this.state.paperId
        }),
        h('input', {
          type: 'text',
          placeholder: `Email address`,
          onChange: e => this.updateForm({
            authorEmail: e.target.value
          }),
          value: this.state.authorEmail,
          spellCheck: false
        }),
        h( 'div.home-request-form-footer', `A private editing link will be sent to your email. Email addresses are never shared.` ),
        h('div.home-request-error', {
          className: makeClassList({ 'home-request-error-message-shown': this.state.errors.incompleteForm })
        }, 'Fill out everything above, then try again.'),
        h('div.home-request-error', {
          className: makeClassList({ 'home-request-error-message-shown': this.state.errors.network })
        }, 'Please try again later'),
        h('button.super-salient-button.home-request-submit', {
          onClick: () => this.submitRequest()
        }, submitBtnText)
      ])
    ]);
  }
}

export default RequestForm;
