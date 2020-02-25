import _ from 'lodash';
import h from 'react-hyperscript';
import { Component } from 'react';
import Popover from './popover/popover';
import { makeClassList, tryPromise } from '../../util';
import EventEmitter from 'eventemitter3';

import { EMAIL_CONTEXT_SIGNUP, TWITTER_ACCOUNT_NAME, NODE_ENV } from '../../config';

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
    const { paperId, authorEmail } = this.state;
    const { emailAddress, isEmailValid } = authorEmail;

    if( !paperId || !emailAddress ){
      this.setState({ errors: { incompleteForm: true } });

    } else if( !isEmailValid ){
      this.setState({ errors: { incompleteForm: false, email: true } });

    } else {
      const url = 'api/document';
      const data = _.assign( {}, {
        paperId: _.trim( paperId ),
        authorEmail: emailAddress,
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
          placeholder: 'Article title',
          onChange: e => this.updateForm({ paperId: e.target.value }),
          value: this.state.paperId
        }),
        h('input', {
          type: 'text',
          placeholder: 'Email address',
          onChange: e => this.updateForm({
            authorEmail: {
              emailAddress: e.target.value,
              isEmailValid: e.target.validity.valid
            }
          }),
          value: this.state.authorEmail.value
        }),
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

// N.b. scroller lists any doc in debug mode
class Scroller extends Component {
  constructor(props){
    super(props);

    this.state = {
      pagerLeftAvailable: false,
      pagerRightAvailable: false,
      docs: []
    };

    this.onScrollExplore = _.debounce(() => {
      this.updatePagerAvailability();
    }, 40);
  }

  componentDidMount(){
    this.refreshDocs().then(() => this.onScrollExplore());
  }

  scrollExplore(factor = 1){
    if( this.exploreDocsContainer ){
      const container = this.exploreDocsContainer;
      const padding = parseInt(getComputedStyle(container)['padding-left']);
      const width = container.clientWidth - 2*padding;

      this.exploreDocsContainer.scrollBy({
        left: width * factor,
        behavior: 'smooth'
      });
    }
  }

  scrollExploreLeft(){
    this.scrollExplore(-1);
  }

  scrollExploreRight(){
    this.scrollExplore(1);
  }

  updatePagerAvailability(){
    if( this.exploreDocsContainer ){
      const haveNoDocs = this.state.docs.length === 0;
      const { scrollLeft, scrollWidth, clientWidth } = this.exploreDocsContainer;
      const allTheWayLeft = scrollLeft === 0;
      const allTheWayRight = scrollLeft + clientWidth >= scrollWidth;
      let leftAvail = !allTheWayLeft && !haveNoDocs;
      let rightAvail = !allTheWayRight && !haveNoDocs;

      this.setState({
        pagerLeftAvailable: leftAvail,
        pagerRightAvailable: rightAvail
      });
    }
  }

  refreshDocs(){
    const url = `/api/document`;

    const toJson = res => res.json();
    const update = docs => new Promise(resolve => this.setState({ docs }, () => resolve(docs)));
    const doFetch = () => fetch(url);

    return tryPromise(doFetch).then(toJson).then(update);
  }

  render(){
    const exploreDocEntry = doc => {
      const Article = doc.article.MedlineCitation.Article;
      const title = Article.ArticleTitle;
      let authorNames = Article.AuthorList.map(a => a.LastName ? `${a.ForeName} ${a.LastName}` : a.CollectiveName );
      const journalName = Article.Journal.ISOAbbreviation;
      const id = doc.id;
      const link = doc.publicUrl;

      if( authorNames.length > 3 ){
        authorNames = authorNames.slice(0, 3).concat([ '...', authorNames[authorNames.length - 1] ]);
      }

      return h('div.scroller-doc', {
      }, [
        h('a', {
          href: link,
          target: '_blank',
          onTouchStart: e => e.preventDefault()
        }, [
          h('div.scroller-doc-descr', [
            h('div.scroller-doc-title', title),
            h('div.scroller-doc-authors', authorNames.map((name, i) => h(`span.scroller-doc-author.scroller-doc-author-${i}`, name))),
            h('div.scroller-doc-journal', journalName)
          ]),
          h('div.scroller-doc-figure', {
            style: {
              backgroundImage: `url('/api/document/${id}.png')`
            }
          }),
          h('div.scroller-doc-journal-banner')
        ])
      ]);
    };

    const docPlaceholders = () => {
      const numPlaceholders = 20;
      const placeholders = [];

      for( let i = 0; i < numPlaceholders; i++ ){
        const p = h('div.scroller-doc.scroller-doc-placeholder');

        placeholders.push(p);
      }

      return placeholders;
    };

    const isPublished = doc => doc.status.toLowerCase() === 'published';
    const docs = this.state.docs.filter(isPublished);

    return h('div.scroller', [
      h('div.scroller-pager.scroller-pager-left', {
        className: makeClassList({
          'scroller-pager-available': this.state.pagerLeftAvailable
        }),
        onClick: () => this.scrollExploreLeft()
      }, [
        h('i.scroller-pager-icon.material-icons', 'chevron_left')
      ]),
      h('div.scroller-pager.scroller-pager-right', {
        className: makeClassList({
          'scroller-pager-available': this.state.pagerRightAvailable
        }),
        onClick: () => this.scrollExploreRight()
      }, [
        h('i.scroller-pager-icon.material-icons', 'chevron_right')
      ]),
      h('div.scroller-content', {
        className: makeClassList({
          'scroller-content-only-placeholders': docs.length === 0
        }),
        onScroll: () => this.onScrollExplore(),
        ref: el => this.exploreDocsContainer = el
      }, (docs.length > 0 ? docs.map(exploreDocEntry) : docPlaceholders()).concat([
        h('div.scroller-doc-spacer')
      ]))
    ]);
  }
}

class Home extends Component {
  constructor(props){
    super(props);

    this.bus = new EventEmitter();
  }

  componentDidMount(){
    document.title = 'Biofactoid';
  }

  render(){
    const CTA = () => {
      return h(Popover, {
        tippy: {
          html: h(RequestForm, { bus: this.bus }),
          onHidden: () => this.bus.emit('closecta'),
          placement: 'top'
        }
      }, [
        h('button.home-cta-button.salient-button', 'Get started')
      ]);
    };

    return h('div.home', [
      h('div..home-section.home-figure-section.home-banner', [
        h('div.home-figure.home-figure-0'),
        h('div.home-figure.home-figure-banner-bg'),
        h('div.home-caption.home-banner-caption', [
          h('div.home-banner-logo', [
            h('h1.home-banner-title', 'Biofactoid')
          ]),
          h('div.home-banner-tagline', 'Explore the biological pathway in an article, shared by the author')
        ]),
        h('div.home-explore#home-explore', [
          h('h2', 'Recently shared articles'),
          h(Scroller)
        ])
      ]),
      h('div.home-section.home-figure-section', [
        h('div.home-figure.home-figure-1'),
        h('div.home-caption', [
          h('p', [
            `Compose your pathway by adding the key interactions`, h('sup', '*'), ` you researched.  `,
            `Share so everyone else can explore it and link to your article.`
          ]),
          h('p', `Our mission is to integrate published pathway knowledge and make it freely available to researchers.`),
          h('p.home-figure-footnote', [
            h('sup', '*'),
            `Add interactions such as binding, post-translational modification, and transcription.  Add chemicals or genes from human, mouse, rat, S. cervisiae, D. melanogaster, E. coli, C. elegans, D. rerio, and A. thaliana.`
          ])
        ]),
        h('div.home-cta', [
          h(CTA)
        ]),

        h('div.home-figure-footer', [
          h('div.home-nav', [
            h('a.home-nav-link', [
              h(Popover, {
                tippy: {
                  html: h('div.home-contact-info', [
                    h('p', [
                      'Biofactoid is freely brought to you in collaboration with ',
                      h('a.plain-link', { href: 'https://baderlab.org' }, 'Bader Lab at the University of Toronto'),
                      ', ',
                      h('a.plain-link', { href: 'http://sanderlab.org' }, 'Sander Lab at Harvard'),
                      ', and the ',
                      h('a.plain-link', { href: 'https://www.ohsu.edu/people/emek-demir/AFE06DC89ED9AAF1634F77D11CCA24C3' }, 'Pathway and Omics Lab at the University of Oregon'),
                      '.'
                    ]),
                    h('p', [
                      `Contact us at `,
                      h('a.plain-link', { href: 'mailto:info@biofactoid.org' }, 'info@biofactoid.org'),
                      `.`
                    ])
                  ])
                }
              }, [
                'Contact'
              ])
            ]),
            h('a.home-nav-link', { href: `https://twitter.com/${TWITTER_ACCOUNT_NAME}` }, 'Twitter'),
            h('a.home-nav-link', { href: 'https://github.com/PathwayCommons/factoid' }, 'GitHub')
          ]),
          h('div.home-credit-logos', [
            h('i.home-credit-logo'),
          ])
        ])
      ])
    ]);
  }
}

export default Home;
