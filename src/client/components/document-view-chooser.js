const React = require('react');
const h = require('react-hyperscript');
const DocumentWizardStepper = require('./document-wizard-stepper');

class DocumentViewChooser extends React.Component {
  goToSeeder(){
    let { history } = this.props;

    history.go(-1);
  }

  goToEditor(editor){
    let { id, secret } = this.props;

    window.open(`/${editor}/${id}/${secret}`);
  }

  render(){

    let rootChildren = [
      h('h1.view-chooser-title', 'Choose editor'),
      h('div.document-view-chooser-radios', [
        h('div.document-view-chooser-choice', { onClick: () => this.goToEditor('document') }, [
          h('div.network-choice'),
          h('label', { htmlFor: 'document-view-chooser-network' }, 'Network Editor')
        ]),
        h('div.document-view-chooser-choice', { onClick: () => this.goToEditor('form') }, [
          h('div.form-choice'),
          h('label', { htmlFor: 'document-view-chooser-form' }, 'Form Editor')
        ])
      ]),
      h(DocumentWizardStepper, {
        forwardEnabled: false,
        back: () => this.goToSeeder()
      })
    ];

    return h('div.document-view-chooser.page-content', rootChildren);
  }
}

module.exports = DocumentViewChooser;
