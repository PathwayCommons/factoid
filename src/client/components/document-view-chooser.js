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
      h('p', 'Your text has been converted into digital networks that now can be explored, modified and expanded through different editors.'),
      h('div.document-view-chooser-radios', [
        h('div.document-view-chooser-choice', { onClick: () => this.goToEditor('document') }, [
          h('div.network-choice'),
          h('h2', { htmlFor: 'document-view-chooser-network' }, 'Network Editor'),
          h('p', 'View and edit your network graphically.  Biochemical entities are represented as circles, interactions are represented by edges connecting two etnities.')
        ]),
        h('div.document-view-chooser-choice', { onClick: () => this.goToEditor('form') }, [
          h('div.form-choice'),
          h('h2', { htmlFor: 'document-view-chooser-form' }, 'Form Editor'),
          h('p', 'Add new types of interactions to your document with easy to use form template text entries.')
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
