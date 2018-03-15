const React = require('react');
const h = require('react-hyperscript');
const Promise = require('bluebird');
const ReactDom = require('react-dom');
const DocumentWizardStepper = require('./document-wizard-stepper');

class DocumentViewChooser extends React.Component {
  constructor( props ){
    super( props );

    this.state = {};
  }

  goToSeeder(){
    let { history } = this.props;

    history.go(-1);
  }

  goToEditor(){
    let { id, secret } = this.props;
    let { editor } = this.state;

    window.open(`/${editor}/${id}/${secret}`);
  }

  render(){
    let onClick = e => this.setState({ editor: e.target.value });

    let rootChildren = [
      h('h1', 'Choose editor'),
      h('label.document-view-chooser-label', 'Editor'),
      h('div.document-view-chooser-radios', [
        h('div.document-view-chooser-choice', [
          h('input', {
            id: 'document-view-chooser-network',
            type: 'radio',
            name: 'editor',
            value: 'document',
            defaultChecked: true,
            onClick: e => onClick(e)
          }),
          h('label', { htmlFor: 'document-view-chooser-network' }, 'Network')
        ]),
        h('div.document-view-chooser-choice', [
          h('input', {
            id: 'document-view-chooser-form',
            type: 'radio',
            name: 'editor',
            value: 'form',
            onClick: e => onClick(e)
          }),
          h('label', { htmlFor: 'document-view-chooser-form' }, 'Form')
        ])
      ]),
      h(DocumentWizardStepper, {
        back: () => this.goToSeeder(),
        forward: () => this.goToEditor()
      })
    ];

    return h('div.document-view-chooser.page-content', rootChildren);
  }
}

module.exports = DocumentViewChooser;
