import _ from 'lodash';
import h from 'react-hyperscript';
import { Component } from 'react';
import Popover from './popover/popover';
import { makeClassList } from '../../util';
import EventEmitter from 'eventemitter3';
import { truncateString } from '../../util';
import { Carousel, CAROUSEL_CONTENT } from './carousel';

import { TWITTER_ACCOUNT_NAME, DOI_LINK_BASE_URL, SAMPLE_DOC_ID, EMAIL_ADDRESS_INFO } from '../../config';

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
      authorEmail: '',
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

  reset(){
    this.setState({
      paperId: '',
      authorEmail: '',
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
        }, 'Create my article profile')
      ])
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

    const smFigure = document.querySelector('.home-intro-figure-sm-alt');
    const lgFigure = document.querySelector('.home-intro-figure');

    const makeScrollObs = (figure, threshold = 1) => new IntersectionObserver((entries) => {
      if(entries[0].isIntersecting === true)
        figure.classList.add('active');

        setTimeout(() => {
          figure.classList.remove('active');
        }, 16);
    }, { threshold: [threshold] });

    if( smFigure ){
      this.smFigureObs = makeScrollObs(smFigure, 0);
      this.smFigureObs.observe(smFigure);
    }

    if( lgFigure ){
      this.lgFigureObs = makeScrollObs(lgFigure, 0);
      this.lgFigureObs.observe(lgFigure);
    }

    const vid = document.querySelector('.home-fluid-section-laptop-content video');
    
    if( vid ){
      vid.playbackRate = 2;
    }
  }

  componentWillUnmount(){
    if( this.smFigureObs ){
      this.smFigureObs.unobserve();
    }

    if( this.lsFigureObs ){
      this.lgFigureObs.unobserve();
    }
  }

  render(){
    const CTAPopover = props => {
      return h(Popover, {
        tippy: {
          html: h(RequestForm, {
            bus: this.bus
          }),
          onHidden: () => this.bus.emit('closecta'),
          placement: props.placement || 'top'
        }
      }, props.children || []);
    };

    // const CTA = () => {
    //   return h(CTAPopover, [
    //     h('button.home-cta-button.salient-button', 'Get started')
    //   ]);
    // };

    const ContactPopover = (props) => {
      return h(Popover, {
        tippy: {
          html: h('div.home-contact-info', [
            h('p', [
              'Biofactoid is free academic project by: ',
              h('a.plain-link', { href: 'https://baderlab.org', target: '_blank' }, 'Bader Lab at the University of Toronto'),
              ', ',
              h('a.plain-link', { href: 'http://sanderlab.org', target: '_blank' }, 'Sander Lab at Harvard'),
              ', and the ',
              h('a.plain-link', { href: 'https://www.ohsu.edu/people/emek-demir/AFE06DC89ED9AAF1634F77D11CCA24C3', target: '_blank' }, 'Pathway and Omics Lab at the University of Oregon'),
              '. Funding: NIH (U41 HG006623); DARPA Big Mechanism (ARO W911NF-14-C-0119).'
            ]),
            h('p', [
              `Contact us at `,
              h('a.plain-link', { href: `mailto:${EMAIL_ADDRESS_INFO}` }, EMAIL_ADDRESS_INFO),
              `.`
            ])
          ])
        }
      }, [
        props.children || 'Contact'
      ]);
    };

    return h('div.home', [
      h('div..home-section.home-figure-section.home-banner', [
        h('div.home-nav', [
          h('div.home-nav-left', [
            h('div.home-nav-logo')
          ]),
          h('div.home-nav-right', [
            h('a.home-nav-link', [
              h(ContactPopover)
            ]),
            h('a.home-nav-link', { href: `https://twitter.com/${TWITTER_ACCOUNT_NAME}`, target: '_blank' }, 'Twitter')
          ])
        ]),
        h('div.home-intro', [
          h('div.home-intro-title', `Biofactoid creates a digital profile of scientific discoveries in an article and connects it to related research.`),
          h('div.home-intro-copy', [
            `Authors describe the `,
            h(Popover, {
              tippy: {
                placement: 'bottom',
                html: h('div.home-info-popover-content', `Supported interactions include binding, post-translational modification, and transcription.  Chemicals and genes from human, mouse, rat, S. cervisiae, D. melanogaster, E. coli, C. elegans, D. rerio, and A. thaliana are supported.`)
              }
            }, [
              h('span.link-like.plain-link', `molecular interactions`)
            ]),
            ` supported by their results, letting researchers explore a firsthand account of an article’s findings and connect to related articles and knowledge. `
          ]),
          h(CTAPopover, {
            placement: 'bottom'
          }, [
            h('button.home-intro-cta', 'Add my article')
          ])
        ]),
        h('div.home-intro-figure'),
        h('div.home-explore#home-explore', [
          h('h2', 'Recently shared articles'),
          h(Carousel, { content: CAROUSEL_CONTENT.FIGURE })
        ])
      ]),
      h('div.home-section.home-fluid-section.home-intro-figure-sm-alt-section', [
        h('div.home-intro-figure-sm-alt'),
        h(CTAPopover, {
          placement: 'bottom'
        }, [
          h('button.home-intro-cta', 'Add my article')
        ])
      ]),
      h('div.home-section.home-fluid-section', [
        h('div.home-fluid-section-copy', [
          h('h2', `Authors`),
          h('h3', `Simple yet powerful `),
          h('p', [
            `Biofactoid uses advanced technology to make profiling your article a snap. Just draw your `,
            h(Popover, {
              tippy: {
                placement: 'bottom',
                html: h('div.home-info-popover-content', `Add interactions such as binding, post-translational modification, and transcription.  Add chemicals or genes from human, mouse, rat, S. cervisiae, D. melanogaster, E. coli, C. elegans, D. rerio, and A. thaliana.`)
              }
            }, [
              h('span.link-like.plain-link', `interactions`)
            ]),
            ` and Biofactoid automatically takes care of the rest.`
          ]),
          h('h3', `Get connected`),
          h('p', [`
            Your article profile links your research to a wider research audience:  It’s automatically connected to `,
            h(Popover, {
              tippy: {
                placement: 'bottom',
                html: h('div.home-info-popover-content', `Article profiles are automatically shared to our @biofactoid account on Twitter, and you can share an article profile to Twitter, ResearchGate, and other social media platforms.`)
              }
            }, [
              h('span.link-like.plain-link', `social media`)
            ]),
            `, relevant literature, and widely-used biological research apps.  Each profile contains an interactive graphical abstract that researchers use to browse within the article and explore related articles.`
          ]),
          h('h3', `Don’t let your research get left behind`),
          h('p', `Research is increasingly online, interactive, and interconnected. Biofactoid helps you connect your research to the world.`),
          h('p.home-cta-p', [
            h(CTAPopover, {
              placement: 'bottom'
            }, [
              h('button.home-cta-alt-button', 'Add my article')
            ]),
            h('a', {
              target: '_blank',
              href: `/document/${SAMPLE_DOC_ID}`
            }, [
              h('button.home-cta-button', 'See an example')
            ])
          ])
        ]),
        h('div.home-fluid-section-laptop', [
          h('div.home-fluid-sticky', [
            h('div.home-fluid-section-laptop-frame'),
            h('div.home-fluid-section-laptop-content', [
              h('video', {
                src: '/image/sample-editor-screen-fade-to-white.mp4',
                type: 'video/mp4',
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true
              })
            ])
          ]),
          h('p.home-cta-p', [
            h(CTAPopover, {
              placement: 'bottom'
            }, [
              h('button.home-cta-alt-button', 'Add my article')
            ]),
            h('a', {
              target: '_blank',
              href: `/document/${SAMPLE_DOC_ID}`
            }, [
              h('button.home-cta-button', 'See an example')
            ])
          ])
        ])
      ]),
      h('div.home-section.home-fluid-section', [
        h('div.home-fluid-section-copy', [
          h('h2', `Researchers`),
          h('h3', `Yours to explore`),
          h('p', `Know the molecular interactions reported in an article at a glance. Biofactoid’s interactive graphical abstract gives you the big picture, while allowing you to focus on the details that matter to you.`),
          h('h3', `Laser-focussed, relevant articles`),
          h('p', `Harness Biofactoid’s advanced AI to sort through the deluge of literature.  Each article profile in Biofactoid highlights current, related research.  The graphical abstract lets you drill-down to browse articles for the individual interactions and genes that you’re interested in.`),
          h('h3', `Easy sharing `),
          h('p', `Want your colleagues to know about an interesting report? Share an interactive graphical abstract via social media or email with just a click.`),
          h('p.home-cta-p', [
            h(CTAPopover, {
              placement: 'bottom'
            }, [
              h('button.home-cta-alt-button', 'Add my article')
            ]),
            h('a', {
              target: '_blank',
              href: `/document/${SAMPLE_DOC_ID}`
            }, [
              h('button.home-cta-button', 'See an example')
            ])
          ])
        ]),
        h('div.home-fluid-section-phone', [
          h('div.home-fluid-sticky', [
            h('div.home-fluid-section-phone-aoi')
          ]),
          h('p.home-cta-p', [
            h(CTAPopover, {
              placement: 'bottom'
            }, [
              h('button.home-cta-alt-button', 'Add my article')
            ]),
            h('a', {
              target: '_blank',
              href: `/document/${SAMPLE_DOC_ID}`
            }, [
              h('button.home-cta-button', 'See an example')
            ])
          ])
        ])
      ]),
      h('div.home-section.home-fluid-section', [
        h('div.home-fluid-section-copy', [
          h('h2', `Research, connected`),
          h('h3', `Biofactoid enables discoveries to become part of a connected body of biological research knowledge.`),
          h('p', `Biofactoid stores the digital information for every article in a standard data format, making it more shareable, reusable, and discoverable.`)
        ]),
        h('div.home-fluid-section-figure', [
          h('div.home-fluid-sticky', [
            h('div.home-fluid-section-figure-aoi.home-fluid-section-figure-aoi-connect')
          ])
        ])
      ]),
      h('div.home-section.home-fluid-section.home-fluid-section-no-figure', [
        h('div.home-fluid-section-copy', [
          h('h2', `By researchers, for researchers`),
          h('p', [
            `All Biofactoid data is made `,
            h('a.plain-link', { target: '_blank', href: 'https://github.com/PathwayCommons/factoid/blob/unstable/README.md#getting-the-data' }, `freely available to download`),
            ` to the research community.`]),
          h('p', [
            `Biofactoid is an academic project by: `,
              h('a.plain-link', { href: 'https://baderlab.org', target: '_blank' }, 'Bader Lab at the University of Toronto'),
              ', ',
              h('a.plain-link', { href: 'http://sanderlab.org', target: '_blank' }, 'Sander Lab at Harvard'),
              ', and the ',
              h('a.plain-link', { href: 'https://www.ohsu.edu/people/emek-demir/AFE06DC89ED9AAF1634F77D11CCA24C3', target: '_blank' }, 'Pathway and Omics Lab at the University of Oregon'),
              '.'
          ]),
          h('p.home-cta-p.home-cta-p-persistent', [
            // TODO use this one with link:
            // h('a', [
            //   h('button.home-cta-alt-button', 'Read our paper')
            // ]),
            //
            // TODO remove coming soon...
            h(Popover, {
              tippy: {
                placement: 'bottom',
                html: h('div.home-info-popover-content', `Coming soon!`)
              }
            }, [
              h('button.home-cta-alt-button', 'Read our paper')
            ]),
            // END remove coming soon
            //
            h('a', {
              href: `mailto:${EMAIL_ADDRESS_INFO}`
            }, [
              h('button.home-cta-button', 'Contact us')
            ])
          ])
        ])
      ]),
      h('div.home-footer', [
        h('p', [
          h('small', `Funding: NIH (U41 HG006623); DARPA Big Mechanism (ARO W911NF-14-C-0119).`)
        ]),
        h('p.home-credit-logos', [
          h('a', { href: 'https://www.harvard.edu/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-harvardu') ]),
          h('a', { href: 'https://www.ohsu.edu/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-ohsu') ]),
          h('a', { href: 'https://www.utoronto.ca/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-utoronto') ])
        ])
      ])
      // h('div.home-section.home-figure-section.home-figure-section-1', [
      //   h('div.home-figure.home-figure-1'),
      //   h('div.home-caption.home-caption-1', [
      //     h('h2', 'Authors: Add your article'),
      //     h('p', [
      //       `It’s quick and easy to share your published results by drawing the key `,
      //       h(Popover, {
      //         tippy: {
      //           placement: 'bottom',
      //           html: h('div.home-info-popover-content', `Add interactions such as binding, post-translational modification, and transcription.  Add chemicals or genes from human, mouse, rat, S. cervisiae, D. melanogaster, E. coli, C. elegans, D. rerio, and A. thaliana.`)
      //         }
      //       }, [
      //         h('span.link-like.plain-link-dark', `interactions`)
      //       ]),
      //       ` in your pathway in Biofactoid.  `,
      //       `Your results are automatically made available for others to explore and cite.`
      //     ])
      //   ]),
      //   h('div.home-figure-video.home-figure-video-1', [
      //     h('video', {
      //       src: '/image/sample-editor-screen-fade.mp4',
      //       type: 'video/mp4',
      //       autoPlay: true,
      //       loop: true,
      //       muted: true,
      //       playsInline: true
      //     })
      //   ]),
      //   h('div.home-cta', [
      //     h(CTA)
      //   ])
      // ]),
      // h('div.home-section.home-figure-section.home-figure-section-2', [
      //   h('div.home-figure.home-figure-2'),
      //   h('div.home-caption.home-caption-2', [
      //     h('h2', 'Researchers: Yours to explore'),
      //     h('p', [
      //       `We `,
      //       h(Popover, {
      //         tippy: {
      //           placement: 'bottom',
      //           html: h('div.home-info-popover-content', [
      //             h('span', `Submitted pathway data is stored in our database and is made publically available for researchers to browse and download. A pathway summary is also shared on our `),
      //             h('a.plain-link', { href: `https://twitter.com/${TWITTER_ACCOUNT_NAME}`, target: '_blank' }, 'Twitter feed')
      //           ])
      //         }
      //       }, [
      //         h('span.link-like.plain-link-bright', `publish and share`)
      //       ]),
      //       h('span', ' an interactive graphical abstract of your pathway so scientists can find and use the information.')
      //     ])
      //   ]),
      //   h('div.home-figure-fg-2')
      // ]),
      // h('div.home-cta.home-cta-2', [
      //   h(CTA),
      //   h('button.home-cta-alt-button', 'Read the paper')
      // ]),
      // h('div.home-figure-footer', [
      //   h('div.home-nav.home-nav-bottom', [
      //     h('a.home-nav-link', [
      //       h(ContactPopover)
      //     ]),
      //     h('a.home-nav-link', { href: `https://twitter.com/${TWITTER_ACCOUNT_NAME}`, target: '_blank' }, 'Twitter'),
      //     h('a.home-nav-link', { href: 'https://github.com/PathwayCommons/factoid', target: '_blank' }, 'GitHub')
      //   ]),
      //   h('div.home-credit-logos', [
      //     h('a', { href: 'https://www.harvard.edu/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-harvardu') ]),
      //     h('a', { href: 'https://www.ohsu.edu/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-ohsu') ]),
      //     h('a', { href: 'https://www.utoronto.ca/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-utoronto') ])
      //   ])
      // ])
    ]);
  }
}

export { Home as default, RequestForm };
