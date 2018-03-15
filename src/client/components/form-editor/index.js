const { Component } = require('react');
const h = require('react-hyperscript');
const DocumentWizardStepper = require('../document-wizard-stepper');

// TODO actually build a working UI that's hooked into the model
class FormEditor extends Component {
  constructor(props){
    super(props);
  }

  render(){
    return h('div.document-form.page-content', [
      h('h1', 'Form editor'),
      h('div.form-interaction', [
        h('input[type="text"].form-entity', { value: 'PCNA' }),
        h('span', ' interacts with '),
        h('input[type="text"].form-entity', { value: 'RAD51' }),
      ]),
      h('div.form-interaction', [
        h('input[type="text"].form-entity', { value: 'TP53' }),
        h('span', ' interacts with '),
        h('input[type="text"].form-entity', { value: 'XRCC2' }),
      ]),
      h('button.form-interaction-adder', [
        h('i.material-icons', 'add')
      ]),
      h(DocumentWizardStepper, {
        backEnabled: false,
        // TODO
      })
    ]);
  }
}

module.exports = FormEditor;
