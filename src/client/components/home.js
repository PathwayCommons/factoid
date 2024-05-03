import h from 'react-hyperscript';
import { Component } from 'react';
import Popover from './popover/popover';
import { makeClassList } from '../dom';
import EventEmitter from 'eventemitter3';
import { Carousel, CAROUSEL_CONTENT } from './carousel';
import { tryPromise } from '../../util';
import { formatDistanceToNow } from 'date-fns';
import DocumentSearch from '../document-search';
import Accordion from './accordion.js';

import { TWITTER_ACCOUNT_NAME, SAMPLE_DOC_ID, EMAIL_ADDRESS_INFO } from '../../config';
import _ from 'lodash';

const checkStatus = response => {
  if ( response.status >= 200 && response.status < 300 ) {
    return response;
  } else {
    var error = new Error( response.statusText );
    error.response = response;
    throw error;
  }
};

class RequestBiopaxForm extends Component {
  constructor(props){
    super(props);

    this.bus = this.props.bus;

    this.state = {
      submitting: false,
      url: undefined,
      done: false,
      errors: {
        incompleteForm: false,
        network: false
      }
    };

    this.onCloseCTA = () => this.reset();
  }

  reset(){
    this.setState({
      submitting: false,
      url: undefined,
      done: false,
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
    const { url } = this.state;

    if( !url ){
      this.setState({ errors: { incompleteForm: true } });
    }
    else{
      const fetchOpts = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({url})
      };

      this.setState({ submitting: true, errors: { incompleteForm: false, network: false } });
      const apiUrl = 'api/document/from-url';
      ( fetch( apiUrl, fetchOpts )
        .then( checkStatus )
        .then( () => new Promise( resolve => this.setState({ done: true }, resolve ) ) )
        .catch( () => new Promise( resolve => this.setState({ errors: { network: true } }, resolve ) ) )
        .finally( () => new Promise( resolve => this.setState({ submitting: false }, resolve ) ) )
      );
    }
  }

  render(){
    const { done } = this.state;
    if( done ){
      return h('div.request-form-container', [
        h('div.request-form-done', [
          h( 'div.request-form-done-title', [
            h('span', 'Articles are created from the biopax file!' )
          ])
        ])
      ]);
    }

    return h('div.request-form-container', [
      h('div.request-form-description', `Enter Biopax file url`),
      h('i.icon.icon-spinner.request-spinner', {
        className: makeClassList({ 'request-spinner-shown': this.state.submitting })
      }),
      h('div.request-form', {
        className: makeClassList({ 'request-form-submitting': this.state.submitting })
      }, [
        h('input', {
          type: 'text',
          placeholder: `Biopax url`,
          onChange: e => this.updateForm({ url: e.target.value }),
          value: this.state.url
        }),
        h('div.request-error', {
          className: makeClassList({ 'request-error-message-shown': this.state.errors.incompleteForm })
        }, 'Fill out everything above, then try again.'),
        h('div.request-error', {
          className: makeClassList({ 'request-error-message-shown': this.state.errors.network })
        }, 'Please try again later'),
        h('button.super-salient-button.request-submit', {
          onClick: () => this.submitRequest()
        }, 'Create articles')
      ])
    ]);
  }
}

class Home extends Component {
  constructor(props){
    super(props);

    this.bus = new EventEmitter();

    this.state = {
      query: '',
      searchMode: false
    };

    this.debouncedSearch = _.debounce(() => {
      this.search();
    }, 500);

    this.docSearch = new DocumentSearch();

    this.docSearchFetch = this.docSearch.fetch('/api/document');

    this.docSearchFetch.then(docs => this.setState({ allDocs: docs, searchDocs: docs }));
  }

  componentDidMount(){
    document.title = 'Biofactoid';

    const smFigure = document.querySelector('.home-intro-figure-sm-alt');
    const lgFigure = document.querySelector('.home-intro-figure');

    // const makeScrollObs = (figure, threshold = 1) => new IntersectionObserver((entries) => {
    //   const entry = entries[0];

    //   if( entry.isIntersecting)
    //     figure.classList.add('active');

    //     if( this.figTo ){
    //       clearTimeout(this.figTo);
    //     }

    //     this.figTo = setTimeout(() => {
    //       figure.classList.remove('active');
    //     }, 500);
    // }, { threshold: [threshold] });

    this.onFigClick = e => {
      e.target.classList.add('active');

      if( this.figTo ){
        clearTimeout(this.figTo);
      }

      this.figTo = setTimeout(() => {
        e.target.classList.remove('active');
      }, 500);
    };

    if( smFigure ){
      // this.smFigureObs = makeScrollObs(smFigure, 0);
      // this.smFigureObs.observe(smFigure);

      smFigure.addEventListener('mousedown', this.onFigClick);
      smFigure.addEventListener('touchstart', this.onFigClick);
    }

    if( lgFigure ){
      // this.lgFigureObs = makeScrollObs(lgFigure, 0);
      // this.lgFigureObs.observe(lgFigure);

      lgFigure.addEventListener('mousedown', this.onFigClick);
      lgFigure.addEventListener('touchstart', this.onFigClick);
    }

    const vid = document.querySelector('.home-fluid-section-laptop-content video');

    if( vid ){
      vid.playbackRate = 2;
    }

    const banner = document.querySelector('.home-banner');

    if( banner ){
      this.updateBannerH = () => {
        banner.style.height = `${window.innerHeight}px`;
      };

      this.updateBannerH();
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

  activateSearchMode() {
    this.setState({ searchMode: true });
  }

  deactivateSearchMode() {
    if (this.state.query) {
      // keep in search mode
    } else {
      this.setState({ searchMode: false, query: '', searchDocs: this.state.allDocs });
    }
  }

  updateSearchQuery(query) {
    this.setState({ query });

    if (query) {
      this.activateSearchMode();

      this.debouncedSearch();
    } else {
      this.setState({ searchDocs: this.state.allDocs });
    }
  }

  clearSearchQuery() {
    this.setState({ query: '', searchDocs: this.state.allDocs, searchMode: false });
  }

  search() {
    const q = this.state.query;
    if( !q ) return;

    const waitForFetch = () => this.docSearchFetch;
    const doQuery = () => this.docSearch.search(q);

    this.setState({ searching: true });

    (tryPromise(waitForFetch)
      .then(doQuery)
      .then(docs => {
        this.setState({ searchDocs: docs, searching: false });
      })
    );
  }

  render(){
    const CTA = h('a', { href: 'document/new', target: '_blank' },[ h('button.home-intro-cta', 'Add my article') ]);

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

    const docCard = doc => {
      const { title, authors: { authorList }, reference: journalName } = doc.citation;
        let authorNames = authorList.map( a => a.name );
        const id = doc.id;
        const link = doc.publicUrl;

        if( authorNames.length > 3 ){
          authorNames = authorNames.slice(0, 2).concat([ '...', authorNames[authorNames.length - 1] ]);
        }

        const figureDiv = h('div.home-search-doc-figure', {
          style: {
            backgroundImage: `url('/api/document/${id}.png')`
          }
        });

        return h('div.home-search-doc',  [
          h('a', {
            href: link,
            target: '_blank'
          }, [
            h('div.home-search-doc-descr', [
              h('div.home-search-doc-title', title),
              h('div.home-search-doc-meta', [
                h('div.home-search-doc-authors', authorNames.map((name, i) => h(`span.home-search-doc-author.home-search-doc-author-${i}`, name))),
                h('div.home-search-doc-journal', journalName)
              ]),
              h('div.home-search-doc-footer', [
                h('div.home-search-doc-text', doc.text),
                h('div.home-search-doc-datestamp', formatDistanceToNow( new Date( doc.lastEditedDate || 0 ), { addSuffix: true } ))
              ]),
            ]),
            figureDiv,
            h('div.home-search-doc-journal-banner')
          ])
        ]);
    };

    return h('div.home', {
      className: makeClassList({
        'home-search-mode': this.state.searchMode,
        'home-search-focus': this.state.searchFocus
      })
    }, [
      h('div.home-section.home-figure-section.home-banner', [
        h('div.home-nav', [
          h('div.home-nav-left', [
            h('div.home-nav-logo')
          ]),
          h('div.home-nav-right', [
            h('span.home-nav-link.home-search-box-area', [
              h('input.home-search-box.input-round.input-joined', {
                value: this.state.query,
                onChange: event => this.updateSearchQuery(event.target.value),
                type: 'text',
                placeholder: 'Search',
                onFocus: () => {
                  this.setState({ searchFocus: true });

                  this.activateSearchMode();
                },
                onBlur: () => {
                  this.setState({ searchFocus: false });
                }
              }),
              h('button', {
                onClick: () => this.clearSearchQuery()
              }, [
                h('i.material-icons', 'clear')
              ])
            ]),
            h('a.home-nav-link', [
              h(ContactPopover)
            ]),
            h('a.home-nav-link', { href: `https://twitter.com/${TWITTER_ACCOUNT_NAME}`, target: '_blank' }, 'Twitter'),
            h('a.home-nav-link', { href: '#faq' }, 'FAQ')
          ])
        ]),
        h('div.home-intro', [
          h('div.home-intro-title', `Biofactoid creates a digital profile of scientific discoveries in an article and connects it to related research.`),
          h('div.home-intro-copy', [
            `Authors describe the `,
            h(Popover, {
              tippy: {
                placement: 'bottom',
                html: h('div.home-info-popover-content', `Supported interactions include binding, post-translational modification, and transcription.  Chemicals and genes from human, mouse, SARS-CoV-2, rat, S. cervisiae, D. melanogaster, E. coli, C. elegans, D. rerio, and A. thaliana are supported.`)
              }
            }, [
              h('span.link-like.plain-link', `molecular interactions`)
            ]),
            ` supported by their results, letting researchers explore a firsthand account of an article’s findings and connect to related articles and knowledge. `
          ]),
          CTA
        ]),
        h('div.home-intro-figure'),
        h('div.home-explore#home-explore', [
          h('h2', 'Recently shared articles'),
          h(Carousel, { content: CAROUSEL_CONTENT.FIGURE })
        ])
      ]),
      h('div.home-section.home-fluid-section.home-intro-figure-sm-alt-section', [
        h('div.home-intro-figure-sm-alt'),
        CTA
      ]),
      h('div.home-section.home-fluid-section', [
        h('div.home-fluid-section-copy', [
          h('h2', `Authors`),
          h('h3', `Simple yet powerful `),
          h('p', [
            `Biofactoid uses advanced technology to make creating your article profile a snap. Just draw your `,
            h(Popover, {
              tippy: {
                placement: 'bottom',
                html: h('div.home-info-popover-content', `Add interactions such as binding, post-translational modification, and transcription.  Add chemicals or genes from human, mouse, SARS-CoV-2, rat, S. cervisiae, D. melanogaster, E. coli, C. elegans, D. rerio, and A. thaliana.`)
              }
            }, [
              h('span.link-like.plain-link', `interactions`)
            ]),
            ` and Biofactoid automatically takes care of the rest.`
          ]),
          h('a', {
            target: '_blank',
            href: `/demo`
          }, [
            h('button.home-cta-button', 'Demo')
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
            CTA,
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
                src: '/image/sample-editor-screen-ras-raf.mp4',
                type: 'video/mp4',
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true
              })
            ])
          ]),
          h('p.home-cta-p', [
            CTA,
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
            CTA,
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
            CTA,
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
            ` to the research community under a public domain-equivalent license `,
            h('a.plain-link', { target: '_blank', href: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode' }, `(Creative Commons CC0 license)`),
            `.`
          ]),
          h('p', [
            `Biofactoid is an academic project by: `,
              h('a.plain-link', { href: 'https://baderlab.org', target: '_blank' }, 'Bader Lab at the University of Toronto'),
              ', ',
              h('a.plain-link', { href: 'http://sanderlab.org', target: '_blank' }, 'Sander Lab at Harvard'),
              ', and the ',
              h('a.plain-link', { href: 'https://www.ohsu.edu/people/emek-demir/AFE06DC89ED9AAF1634F77D11CCA24C3', target: '_blank' }, 'Pathway and Omics Lab at the Oregon Health & Science University'),
              '.'
          ]),
          h('p.home-cta-p.home-cta-p-persistent', [
            // TODO use this one with link:
            h('a', { href: 'https://elifesciences.org/articles/68292', target: '_blank' },
            [
              h('button.home-cta-alt-button', 'Read our paper')
            ]),
            h('a', {
              href: `mailto:${EMAIL_ADDRESS_INFO}`
            }, [
              h('button.home-cta-button', 'Contact us')
            ])
          ])
        ])
      ]),
      h('div.home-section.home-fluid-section.home-fluid-section-no-figure', [
        h('div.home-fluid-section-copy', [
          h( Accordion, {
            title: [ h('span', { id: 'faq' }, 'Frequently Asked Questions')],
            items: [
              { title: 'What is Biofactoid?', description: [
                h('p', [
                  'A tool to map ',
                  h('a.plain-link', { href: 'https://en.wikipedia.org/wiki/Biological_pathway', target: '_blank' }, 'biological pathways'),
                  ' assembled from author-curated results in papers.'
                ])
              ]},
              { title: 'What problem does Biofactoid help solve?', description: [
                  h('p', 'Think about the last time you snapped a photo of your friends or family (or your pet). Your phone automatically identified and focused on all the faces, but, whether you were aware of it or not, it also labelled those faces (and cars, food, cute babies) so that it could organise your album by the places, people, pets and things within the images.'),
                  h('p', 'Wouldn’t it be great if all of the scientific details in a paper were readily identifiable by  computers so that information across the literature could be precisely related and combined?'),
                  h('p', [
                    'Despite the fact that scientific papers are distributed digitally, the content itself -- plain text and images -- remains rooted in the print era. Unfortunately, knowledge in the text and figures in papers is extremely challenging for computers to accurately extract and use. We traditionally rely on expert curators at biological resources (e.g., ',
                    h('a.plain-link', { href: 'https://www.uniprot.org/', target: '_blank' }, 'UniProt'),
                    ') to read papers and enter the information in a format that a computer can work with. However, this is expensive and there are too many papers for expert curators to handle at the same time.'
                  ]),
                  h('p', 'Biofactoid rethinks the way information in papers is captured by enabling curation by authors of scientific articles, which is accurate, since authors are authoritative experts on their studies, and scales to support comprehensive, up-to-the-minute coverage of the literature.')
              ]},
              { title: 'What kind of information does Biofactoid contain?', description: 'Functional relationships (e.g., binding, transcription) between molecules and chemicals. For instance, "NAD+ binds to mouse PARP1".'},
              { title: 'Which species does Biofactoid support?', description: [
                h('p', [
                  'Humans and major model organisms including: ',
                  h('em', 'M. musculus'), ', ',
                  h('em', 'R. norvegicus'), ', ',
                  h('em', 'S. cerevisiae'), ', ',
                  h('em', 'D. melanogaster'), ', ',
                  h('em', 'E. coli'), ', ',
                  h('em', 'C. elegans'), ', ',
                  h('em', 'D. rerio'), ', ',
                  h('em', 'A. thaliana'), ', as well as ',
                  h('em', 'SARS-CoV-2.')
                ])
              ]},
              { title: 'Can anyone submit an article?', description: [
                h('p', [
                  h('span', 'Any author of a primary research article is welcome to submit content to Biofactoid. Authors access the curation tool via a private web link. Author names and emails are associated with Biofactoid records and matched against corresponding author and '),
                  h('a.plain-link', { href: 'https://orcid.org/', target: '_blank' }, 'Open Researcher and Contributor ID (ORCID)'),
                  h('span', ' information (when available) for each article. The Biofactoid website displays the name of the author who created the record, linked to their ORCID.')
                ])
              ]},
              { title: 'How long does it take?', description: 'A typical author spends a total of 6 minutes to add information from a paper; this usually involves 3 interactions. More than a quarter of users finish in less than 3 minutes.' },
              { title: 'Do I need to create an account?', description: 'No. All Biofactoid data is freely and openly available for all to use, download and redistribute without restriction. Authors curate their paper by following a private web link. Email addresses remain private and are never shared.' },
              { title: 'How does Biofactoid compare to other pathway databases like Reactome or STRING?', description: [
                h('p', 'Biofactoid collects pathway and network data and makes it available as a resource to support many different uses. Biofactoid data can be searched as is, as a knowledge resource. It can also provide input data for pathway and network analyses, such as the following:'),
                h('ul', [
                  h('li', [
                    'STRING collects data from other sources, such as Biocarta, BioCyc, Gene Ontology, KEGG, and Reactome; ',
                    h('u', 'Biofactoid is a primary source of curated data')
                  ]),
                  h('li', 'Reactome curates a defined set of human pathways from select papers, focusing on a consensus (i.e. "textbook") interpretation of biological processes; Biofactoid supports author-curation of all papers with pathway results')
                ])
              ]},
              { title: 'How is Biofactoid data is used?', description: [
                h('p', 'Biofactoid collects pathway and network data and makes it available as a resource to support many different uses. Biofactoid data can be searched as is, as a knowledge resource. It can also provide input data for pathway and network analyses, such as the following:'),
                h('ul', [
                  h('li', [
                    h('b', 'Interpreting long lists of genes from large-scale experiments'),
                    h('ul', [
                      h('p', 'Comprehensive quantification of DNA, RNA and proteins in biological samples yields long lists of measured entities (e.g. differentially expressed genes) which are difficult to interpret. Pathway enrichment analysis summarises gene lists as a smaller, more easily interpretable list of affected pathways. Pathway data is obtained from manually curated resources.'),
                      h('li', [
                        h('a.plain-link', { href: 'https://www.science.org/doi/full/10.1126/scisignal.aan3580', target: '_blank' }, 'Integrated in vivo multiomics analysis identifies p21-activated kinase signaling as a driver of colitis.'),
                        ' Sci. Signal 11 (2018)'
                      ]),
                      h('li', [
                        h('a.plain-link', { href: 'https://www.nature.com/articles/nature13108', target: '_blank' }, 'Epigenomic alterations define lethal CIMP-positive ependymomas of infancy.'),
                        ' Nature 506 (2014)'
                      ]),
                      h('li', [
                        h('a.plain-link', { href: 'https://www.nature.com/articles/nature13483', target: '_blank' }, 'DNA-damage-induced differentiation of leukaemic cells as an anti-cancer barrier.'),
                        ' Nature 514 (2014)'
                      ])
                    ])
                  ]),
                  h('li', [
                    h('b', 'Exploring the mechanistic neighbourhood of a gene or drug'),
                    h('ul', [
                      h('p', 'Functional screens (e.g., RNAi) and genetic screens can implicate one or a few genes in a phenotype. However, complex cellular networks of gene products and chemicals underlie most genotype-to-phenotype relationships. An integrated resource of curated biological relationships enables researchers to explore a  neighbourhood of direct and indirect mechanistic interactions for a protein (or drug) of interest.'),
                      h('li', [
                          'Search engines: ',
                          h('a.plain-link', { href: 'https://string-db.org/', target: '_blank' }, 'STRING'),
                          h('span', ', '),
                          h('a.plain-link', { href: 'https://genemania.org/', target: '_blank' }, 'GeneMANIA'),
                          h('span', ', '),
                          h('a.plain-link', { href: 'https://apps.pathwaycommons.org/', target: '_blank' }, 'Pathway Commons Search')
                      ])
                    ]),
                  ]),
                  h('li', [
                    h('b', 'Network analysis'),
                    h('ul', [
                    h('p', 'The research community has used pathway and interaction data in a wide variety of computational analyses:'),
                      h('li', [
                        h('em', 'Constructing quantitative dynamical models from curated pathways'),
                        h('ul', [
                          h('li', [
                            h('a.plain-link', { href: 'https://pubmed.ncbi.nlm.nih.gov/24273241/', target: '_blank' }, 'Pathway Commons at virtual cell: use of pathway data for mathematical.'),
                            ' Bioinformatics 15:30 (2014)'
                          ])
                        ]),
                      ]),
                      h('li', [
                        h('em', 'Using curated pathways to assemble a kinase signalling network that explains kinase data'),
                        h('ul', [
                          h('li', [
                            h('a.plain-link', { href: 'https://www.nature.com/articles/nmeth.3773', target: '_blank' }, 'DREAM Challenge: Hill, S. M. et al. Inferring causal molecular networks: empirical assessment through a community-based effort.'),
                            ' Nat. Methods 13 (2016)'
                          ])
                        ]),
                      ]),
                      h('li', [
                        h('em', 'Using curated pathways to explain mutually exclusive mutations in cancer'),
                        h('ul', [
                          h('li', [
                            h('a.plain-link', { href: 'https://genomebiology.biomedcentral.com/articles/10.1186/s13059-015-0612-6', target: '_blank' }, 'Systematic identification of cancer driving signaling pathways based on mutual exclusivity of genomic alterations.'),
                            ' Genome Biology 16:45 (2015)'
                          ])
                        ]),
                      ])
                    ])
                  ])
                ])
              ]}
            ]
          })
        ])
      ]),
      h('div.home-section.home-search-results', [
        this.state.searchMode ? (
          this.state.searching ? (
            h('div.home-search-results-searching', [
              h('i.icon.icon-spinner')
            ])
          ) : (
            this.state.searchDocs ?
            (
              this.state.searchDocs.length > 0 ? (
                h('div.home-search-results-docs', this.state.searchDocs.map(docCard))
              ) : (
                h('div.home-search-results-none', 'There are no results for your search.')
              )
            )
            : h('div.home-search-results-searching', [
              h('i.icon.icon-spinner')
            ])
          )
        ) : null
      ]),
      h('div.home-footer', [
        h('p', [
          h('small', [
            h('a.plain-link', { href: 'https://github.com/PathwayCommons/factoid/blob/unstable/PRIVACY_POLICY.md', target: '_blank' }, 'Privacy Policy'),
          ])
        ]),
        h('p', [
          h('small', `Funding: NIH (U41 HG006623); DARPA Big Mechanism (ARO W911NF-14-C-0119).`)
        ]),
        h('p.home-credit-logos', [
          h('a', { href: 'https://www.harvard.edu/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-harvardu') ]),
          h('a', { href: 'https://www.ohsu.edu/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-ohsu') ]),
          h('a', { href: 'https://www.utoronto.ca/', target: '_blank' }, [ h('i.home-credit-logo.home-credit-logo-utoronto') ])
        ])
      ])
    ]);
  }
}

export { Home as default, RequestBiopaxForm };
