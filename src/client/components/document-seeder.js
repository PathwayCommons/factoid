const React = require('react');
const h = require('react-hyperscript');
const Promise = require('bluebird');
const ReactDom = require('react-dom');
const DocumentWizardStepper = require('./document-wizard-stepper');

class DocumentSeeder extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      submitting: false
    };
  }

  createDoc(){
    let text = ReactDom.findDOMNode(this).querySelector('.document-seeder-text').value;

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

    this.setState({ submitting: true });

    return Promise.try( makeRequest ).then( toJson ).then( updateState );
  }

  goToChooser(){
    let { history } = this.props;
    let { id, secret } = this.state.documentJson;

    history.push(`/new/choice/${id}/${secret}`);
  }

  render(){
    let rootChildren = [
      h('h1', 'Enter paper text'),
      h('label.document-seeder-text-label', 'Paper text'),
      h('textarea.document-seeder-text'),
      h(DocumentWizardStepper, {
        backEnabled: false,
        forward: () => {
          let create = () => this.createDoc();
          let go = () => this.goToChooser();

          return Promise.try( create ).then( go );
        }
      })
    ];

    return h('div.document-seeder.page-content', rootChildren);
  }
}

module.exports = DocumentSeeder;
