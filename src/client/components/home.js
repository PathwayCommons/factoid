import _ from 'lodash';
import h from 'react-hyperscript';
import { Component } from 'react';
import Popover from './popover/popover';
import { makeClassList } from '../../util';
import EventEmitter from 'eventemitter3';

import { EMAIL_CONTEXT_SIGNUP } from '../../config';

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
      paperId: '',
      authorEmail: {
        emailAddress: '',
        isEmailValid: false
      },
      isCorrespondingAuthor: true,
      submitting: false,
      done: false,
      errors: {
        incompleteForm: false,
        email: false,
        network: false
      }
    };

    this.onCloseCTA = () => this.reset();
  }

  reset(){
    this.setState({
      paperId: '',
      authorEmail: {
        emailAddress: '',
        isEmailValid: false 
      },
      isCorrespondingAuthor: true,
      submitting: false,
      done: false,
      errors: {
        incompleteForm: false,
        email: false,
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
    const { paperId, authorEmail, isCorrespondingAuthor } = this.state;
    const { emailAddress, isEmailValid } = authorEmail;
        
    if( !paperId || !emailAddress ){
      this.setState({ errors: { incompleteForm: true } });

    } else if( !isEmailValid ){
      this.setState({ errors: { incompleteForm: false, email: true } });
  
    } else {
      const url = 'api/document';
      const data = _.assign( {}, { 
        paperId, 
        authorEmail: emailAddress, 
        isCorrespondingAuthor,
        context: EMAIL_CONTEXT_SIGNUP
      });
      const fetchOpts = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
      };

      this.setState({ submitting: true, errors: { incompleteForm: false, email: false, network: false } });
      fetch( url, fetchOpts )
        .then( checkStatus )
        .then( () => new Promise( resolve => this.setState({ done: true }, resolve ) ) )
        .catch( () => new Promise( resolve => this.setState({ errors: { network: true } }, resolve ) ) )
        .finally( () => new Promise( resolve => this.setState({ submitting: false }, resolve ) ) );
    }
  }

  render(){
    if( this.state.done ){
      return h('div.home-request-form-container', [
        h('div.home-request-form-done', [
          h('div.home-request-form-done-icon', [ h('i.material-icons', 'check') ]),
          h('div.home-request-form-done-descr', 'Thank you for your request!  We will contact you soon with next steps.')
        ])
      ]);
    }

    return h('div.home-request-form-container', [
      h('div.home-request-form-description', 'Claim your article'),
      h('i.icon.icon-spinner.home-request-spinner', {
        className: makeClassList({ 'home-request-spinner-shown': this.state.submitting })
      }),
      h('div.home-request-form', {
        className: makeClassList({ 'home-request-form-submitting': this.state.submitting })
      }, [
        h('input', {
          type: 'text',
          placeholder: 'PubMed link',
          onChange: e => this.updateForm({ paperId: e.target.value }),
          value: this.state.paperId
        }),
        h('input', {
          type: 'email',
          placeholder: 'Email address',
          onChange: e => this.updateForm({ 
            authorEmail: { 
              emailAddress: e.target.value, 
              isEmailValid: e.target.validity.valid 
            } 
          }),
          value: this.state.authorEmail.value
        }),
        h('div.home-request-form-author', [
          h('span', 'Are you the corresponding author for the article?'),
          h('input', {
            type: 'radio',
            name: 'corrauth',
            id: 'coreauthtrue',
            checked: this.state.isCorrespondingAuthor,
            onChange: e => this.updateForm({ isCorrespondingAuthor: e.target.value === 'on' })
          }),
          h('label', { htmlFor: 'coreauthtrue' }, 'Yes'),
          h('input', {
            type: 'radio',
            name: 'corrauth',
            id: 'coreauthfalse',
            checked: !this.state.isCorrespondingAuthor,
            onChange: e => this.updateForm({ isCorrespondingAuthor: e.target.value !== 'on' })
          }),
          h('label', { htmlFor: 'coreauthfalse' }, 'No')
        ]),
        h('div.home-request-error', {
          className: makeClassList({ 'home-request-error-message-shown': this.state.errors.incompleteForm })
        }, 'Fill out everything above, then try again.'),
        h('div.home-request-error', {
          className: makeClassList({ 'home-request-error-message-shown': !this.state.errors.paperId && this.state.errors.email })
        }, 'Please enter a valid email'),
        h('div.home-request-error', {
          className: makeClassList({ 'home-request-error-message-shown': this.state.errors.network })
        }, 'Please try again later'),
        h('button.salient-button.home-request-submit', {
          onClick: () => this.submitRequest()
        }, 'Request an invitation')
      ])
    ]);
  }
}

class Home extends Component {
  constructor(props){
    super(props);

    this.bus = new EventEmitter();
  }

  render(){
    const CTA = () => {
      return h(Popover, {
        tippy: {
          html: h(RequestForm, { bus: this.bus }),
          onHidden: () => this.bus.emit('closecta')
        }
      }, [
        h('button.home-cta-button.salient-button', 'Get started')
      ]);
    };

    return h('div.home', [
      h('div.home-banner', [
        h('div.home-banner-overlay'),
        h('div.home-corner-logo'),
        h('div.home-banner-logo', [
          h('h1.home-banner-title', 'Biofactoid'),
          h('div.home-banner-tagline', 'Summarise.  Share.  Discover.')
        ]),
        h('div.home-cta.home-banner-cta', [
          h(CTA)
        ])
      ]),
      h('div.home-section.home-figure-section', [
        h('div.home-figure.home-figure-summarize'),
        h('div.home-caption', [
          h('h2', 'Summarize'),
          h('p', `Create a cloud-computable summary of your subcellular biology article with the easy-to-use Biofactoid app.  It takes only a few minutes, and it allows you to clearly and concisely summarize the heart of your article.`)
        ])
      ]),
      h('div.home-section.home-figure-section', [
        h('div.home-figure.home-figure-share'),
        h('div.home-caption', [
          h('h2', 'Share'),
          h('p', `Share a compelling visual abstract that researchers can grasp at a glance.  Things like attributions and cross-references are all automatically handled for you.  Best of all, you and your colleagues can share your article's summary with just one click.`)
        ])
      ]),
      h('div.home-section.home-figure-section', [
        h('div.home-figure.home-figure-discover'),
        h('div.home-caption', [
          h('h2', 'Discover'),
          h('p', `Find relevant articles and others in the community with shared interests.  Each article on Biofactoid is automatically semantically represented, indexed, and cross-referenced.  Biofactoid will allow researchers like you to explore subcellular research freely and seamlessly.`)
        ])
      ]),
      h('div.home-section.home-text-section', [
        h('div.home-cta.home-footer-cta', [
          h(CTA)
        ]),
        h('div.home-credits', [
          h('p.home-credit-logos', [
            h('i.home-credit-logo'),
          ]),
          h('p.home-credit-text', [
            'Biofactoid is freely brought to you in collaboration with ',
            h('a.plain-link', { href: 'https://baderlab.org' }, 'Bader Lab at the University of Toronto'),
            ', ',
            h('a.plain-link', { href: 'https://sanderlab.org' }, 'Sander Lab at Harvard'),
            ', and the ',
            h('a.plain-link', { href: 'https://sanderlab.org' }, 'Pathway and Omics Lab at the University of Oregon'),
            '.  ',
            ''
          ])
        ])
      ])
    ]);
  }
}

export default Home;
