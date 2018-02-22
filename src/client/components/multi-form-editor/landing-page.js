const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const React = require('react');
const ReactDom = require('react-dom');
const { makeClassList } = require('../../../util');
const Promise = require('bluebird');
const anime = require('animejs');

class LandingPage extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      textAreaEnabled: false,
      submitting: false,
      textAreaAnimating: false,
      textAreaHeight: '20em'
    };
  }

  createAndNavigateToDoc(){
    let text = ReactDom.findDOMNode(this).querySelector('.landing-page-text').value;

    let makeRequest = () => fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text })
    });

    let toJson = res => res.json();

    let updateState = documentJson => {
      documentJson.editable = true;

      this.setState({ documentJson, submitting: false });
    };

    let route = () => {
      let { history } = this.props;
      history.replace(this.state.documentJson.privateUrl);
    };

    this.setState({ submitting: true });

    Promise.try( makeRequest ).then( toJson ).then( updateState ).then( route );
  }

  toggleTextArea(){
    // if there is an animation for text area do not allow click event
    if (this.state.textAreaAnimating) {
      return;
    }

    let textArea = ReactDom.findDOMNode(this).querySelector('.landing-page-text');

    let toggleTextAreaState = (() => {
      this.setState({
        textAreaEnabled: !this.state.textAreaEnabled
      });
    });

    this.setState({
      textAreaAnimating: true
    });

    // indicates whether we are opening or closing text area
    let opening = !this.state.textAreaEnabled;

    let animeOpts = {
      targets: textArea,
      height: opening ? [0, this.state.textAreaHeight] : [textArea.style.height, 0],
      duration: 1000,
      easing: 'linear'
    }

    let animePromise;

    // order of toggling state and animation changes according to whether
    // we are opening or closing the text area
    if (opening) {
      toggleTextAreaState();
      animePromise = anime(animeOpts);
    }
    else {
      // need to store height of text area before closing
      this.setState({
        textAreaHeight: textArea.style.height
      });

      animePromise = anime(animeOpts);
      animePromise.finished.then(toggleTextAreaState);
    }

    animePromise.finished.then(() => {
      this.setState({
        textAreaAnimating: false
      });
    });
  }

  render(){
    return h('div.landing-page', [
      h('div.landing-page-center', {
        className: makeClassList({
          'landing-page-center-fit': !this.state.textAreaEnabled
        })
      },[
        h('div.landing-page-intro-row', [
          h('i.landing-page-icon'),
          h('div', [
            h('h1.landing-page-into-header', 'Factoid'),
            h('p.landing-page-intro-desc', 'A project to digitally capture biological data from academic papers')
          ])
        ]),
        h('div.landing-page-mode-area', [
          h('span', {
            className: makeClassList({
              'landing-page-hidden': this.state.textAreaEnabled
            })
          }, 'CREATE'),
          h('button.landing-page-fill-text-btn', {
            className: makeClassList({
              'landing-page-left': this.state.textAreaEnabled,
              'landing-page-no-right-border': !this.state.textAreaEnabled,
              'landing-page-no-bottom-border': this.state.textAreaEnabled,
              'landing-page-round-tl': true,
              'landing-page-round-bl': !this.state.textAreaEnabled,
              'landing-page-round-tr': this.state.textAreaEnabled
            }),
            onClick: () => this.toggleTextArea()
          }, [
            h(Link, { to: '/' }, [
              h('i', 'FROM TEXT')
            ])
          ]),
          h('textarea.landing-page-text', {
            className: makeClassList({
              'landing-page-hidden': !this.state.textAreaEnabled
            })
          }),
          h('button.landing-page-empty-doc-btn', {
            className: makeClassList({
              'landing-page-no-top-border': this.state.textAreaEnabled,
              'landing-page-left': this.state.textAreaEnabled,
              'landing-page-round-tr': !this.state.textAreaEnabled,
              'landing-page-round-br': true,
              'landing-page-round-bl': this.state.textAreaEnabled
            })
          },[
            h(Link, { to: '/debug/new-document' }, [
              h('i', 'BLANK'),
              h('i.fas.fa-angle-right')
            ])
          ]),
          h('button.landing-page-submit-btn', {
            className: makeClassList({
              'landing-page-right': true,
              'landing-page-no-top-border': true,
              'landing-page-hidden': !this.state.textAreaEnabled,
              'landing-page-round-br': true,
              'landing-page-round-bl': true
            }),
            onClick: () => this.createAndNavigateToDoc()
          },[
            h(Link, { to: '/' }, [
              h('i', 'NEXT'),
              h('i.fas.fa-angle-right')
            ])
          ]),
          h('span.icon.icon-spinner.landing-page-submit-spinner', {
            className: makeClassList({
              'landing-page-spinner-submitting': this.state.submitting
            })
          })
        ])
      ]),
      h('div.landing-page-footer', {
        className: makeClassList({
          'landing-page-footer-fit': !this.state.textAreaEnabled
        })
      },[
        h('div.landing-page-section', [
          h('span', 'Factoid is a new bioinformatics technology designed to increase impact of papers by making the genes and interactions that are described by the users easier for others to discover and reuse.'),

          h('p'),

          h('span', 'Factoid utilizes '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://agathon.sista.arizona.edu:8080/odinweb/', target: '_blank' }, 'REACH') ]),
          h('span', ' for extraction of the biomedical information and '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://js.cytoscape.org/', target: '_blank' }, 'Cytoscape.js') ]),
          h('span', ' for network visualization while making use of biological databases such as '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.pathwaycommons.org/pc2/', target: '_blank' }, 'Pathway Commons') ]),
          h('span', ' and '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.uniprot.org/uniprot/', target: '_blank' }, 'Uniprot') ]),
          h('span', '.'),

          h('p'),

          h('span', 'Factoid is being developed by Gary Bader, Max Franz, Dylan Fong, Jeffrey Wong of the '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://baderlab.org/', target: '_blank' }, 'Bader Lab') ]),
          h('span', ' at the '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'https://www.utoronto.ca/', target: '_blank' }, 'University of Toronto') ]),
          h('span', ', Chris Sander, Christian Dallago, Augustin Luna of the '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.sanderlab.org/', target: '_blank' }, 'Sander Lab') ]),
          h('span', ' at the '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.dana-farber.org/', target: '_blank' }, 'Dana-Farber Cancer Institute') ]),
          h('span', ' and '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://hms.harvard.edu/', target: '_blank' }, 'Harvard Medical School') ]),
          h('span', ' and Emek Demir, Funda Durupinar Babur, David Servillo, Metin Can Siper of the Pathways and Omics Lab at '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.ohsu.edu/', target: '_blank' }, 'Oregon Health & Science University') ]),
          h('span', '.'),

          h('p'),

          h('a', { className: 'landing-page-link', href: 'https://github.com/PathwayCommons/factoid', target: '_blank' }, [
            h('i', { className: 'fa-github fa fa-2x' })
          ])
        ]),

      ])
    ]);
  }
}

module.exports = LandingPage;
