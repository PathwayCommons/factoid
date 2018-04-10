const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const Linkout = require('./document-linkout');
const Promise = require('bluebird');
const ReactDom = require('react-dom');
const { makeClassList } = require('../../util');
const anime = require('animejs');

class DebugDocumentSeeder extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      submitting: false
    };
  }

  reset(){
    this.setState({
      submitting: false,
      documentJson: null
    });
  }

  createDoc(){
    let text = ReactDom.findDOMNode(this).querySelector('.debug-document-seeder-text').value;

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

    Promise.try( makeRequest ).then( toJson ).then( updateState );
  }

  render(){
    let rootChildren = [
      h('h1', 'Textmining debug page'),
      h('p', 'This is a debug page for textmining.  It is for testing purposes only; it is not for users.  This page may be removed at any time.'),
      h('label.debug-document-seeder-text-label', 'Document text'),
      h('textarea.debug-document-seeder-text'),
      h('div.debug-document-seeder-submit-line', [
        h('button.debug-document-seeder-submit', {
          onClick: () => this.createDoc()
        }, 'Create document'),
        h('span.icon.icon-spinner.debug-document-seeder-submit-spinner', {
          className: makeClassList({
            'debug-document-seeder-spinner-submitting': this.state.submitting
          })
        })
      ])
    ];

    let documentJson = this.state.documentJson;

    if( documentJson != null ){
      rootChildren.push( h('div.debug-document-seeder-arrow', [
        h('i.material-icons', 'arrow_downward')
      ]) );

      rootChildren.push( h('div.debug-document-seeder-linkout', [
        h(Linkout, { documentJson })
      ]) );

      rootChildren.push( h('div.debug-document-seeder-open', [
        h(Link, { target: '_blank', to: documentJson.privateUrl }, [
          h('i.material-icons', 'open_in_new')
        ])
      ]) );
    }

    return h('div.debug-document-seeder', rootChildren);
  }
}

module.exports = DebugDocumentSeeder;
