const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const Linkout = require('./document-linkout');
const ReactDom = require('react-dom');
const { makeClassList, tryPromise } = require('../../util');
const anime = require('animejs');
const ReachIntervalHighlighter = require('./reach-interval-highlighter');

const EXAMPLE_TEXT = `Upon detection of DNA damage, the ATM kinase mediates the phosphorylation of the Mdm2 protein to block its interaction with p53. The p53 protein activates the transcription of cyclin-dependent kinase inhibitor, p21. p21 inactivates the CCNE1:Cdk2 complex.`;

class DebugDocumentSeeder extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      submitting: false,
      text: ''
    };
  }

  reset(){
    this.setState({
      submitting: false,
      documentJson: null
    });
  }

  createDoc(){
    let text = this.state.text;

    let makeRequest = () => fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text })
    });

    let toJson = res => res.json();

    let animateResult = () => {
      let linkout = ReactDom.findDOMNode(this).querySelector('.debug-document-seeder-linkout');

      linkout.style.opacity = 0;

      if( linkout ){
        anime({ targets: linkout, opacity: [0, 1], duration: 2000, easing: 'linear' });
      }
    };

    let updateState = documentJson => {
      documentJson.editable = true;

      this.setState({ documentJson, submitting: false }, animateResult);
    };

    this.setState({ submitting: true });

    tryPromise( makeRequest ).then( toJson ).then( updateState );
  }

  getHighlights(){
    let text = this.state.text;

    let makeRequest = () => fetch('/api/document/query-reach', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text })
    });

    let toJson = res => res.json();

    let store = reachResponse => this.setState({ reachResponse });

    return tryPromise( makeRequest ).then( toJson ).then( store );
  }

  useExample(){
    this.setState({ text: EXAMPLE_TEXT });
  }

  render(){
    let { documentJson, reachResponse, text } = this.state;

    let rootChildren = [
      h('h1', 'Textmining debug page'),
      h('p', 'This is a debug page for textmining.  It is for testing purposes only; it is not for users.  This page may be removed at any time.'),
      h('label.debug-document-seeder-text-label', 'Document text'),
      h('textarea.debug-document-seeder-text', {
        onChange: e => this.setState({ text: e.target.value }),
        value: this.state.text
      }),
      h('div.debug-document-seeder-submit-line', [
        h('button.debug-document-seeder-example', {
          onClick: () => { this.useExample(); }
        }, 'Use example'),
        h('button.debug-document-seeder-submit', {
          onClick: () => { this.createDoc(); this.getHighlights(); }
        }, 'Create document'),
        h('span.icon.icon-spinner.debug-document-seeder-submit-spinner', {
          className: makeClassList({
            'debug-document-seeder-spinner-submitting': this.state.submitting
          })
        })
      ])
    ];

    if( documentJson != null ){
      rootChildren.push( h('div.debug-document-seeder-arrow', [
        h('i.material-icons', 'arrow_downward')
      ]) );

      rootChildren.push( h('div.debug-document-seeder-result-title', [
        h(Link, { target: '_blank', to: documentJson.privateUrl }, [
          h('span', 'Open editor '),
          h('i.material-icons', 'open_in_new')
        ])
      ]) );

      rootChildren.push( h('div.debug-document-seeder-linkout', [
        h(Linkout, { documentJson })
      ]) );
    }

    if( documentJson != null && reachResponse != null ){
      rootChildren.push( h('div.debug-document-seeder-result-title', [
        h('form', {
          action: '/api/document/query-reach',
          method: 'post',
          target: '_blank',
          ref: domEl => this.textminingForm = domEl
        }, [
          h('a', {
            onClick: () => this.textminingForm.submit()
          }, [
            h('input', {
              type: 'hidden',
              name: 'text',
              value: text
            }),
            h('span', 'Open textmining response '),
            h('i.material-icons', 'open_in_new')
          ])
        ])
      ]) );

      rootChildren.push( h('div.debug-document-seeder-textmining', [
        h(ReachIntervalHighlighter, { text, reachResponse })
      ]) );
    }

    return h('div.debug-document-seeder', rootChildren);
  }
}

module.exports = DebugDocumentSeeder;
