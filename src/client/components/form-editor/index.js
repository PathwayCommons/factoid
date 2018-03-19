const { Component } = require('react');
const h = require('react-hyperscript');
const DocumentWizardStepper = require('../document-wizard-stepper');


class EntityForm extends Component {
  constructor(props){
    super(props);
    this.state = {
      entityName: ''
    };
  }
  render(){
    return h('input[type="text"].form-entity', {
      value: this.state.entityName,
      onChange: e => this.setState({
        entityName: e.target.value
      })
    });
  }
}

class InteractionForm extends Component {
  constructor(props){
    super(props);
    this.state = {
      interactionType: 'interacts with'
    };
  }

  render(){
    return h('div.form-interaction', [
      h(EntityForm),
      h('span', [
        h('select', [
          h('option', { value: 'interacts with', selected: this.state.interactionType === 'interacts with' }, 'interacts with'),
          h('option', { value: 'phosphorylates', selected: this.state.interactionType === 'phosphorylates' }, 'phosphorylates'),
          h('option', { value: 'enzyme reaction', selected: this.state.interactionType === 'enzyme reaction' }, 'enzyme reaction')
        ])
      ]),
      h(EntityForm)
    ]);
  }
}


// TODO actually build a working UI that's hooked into the model
class FormEditor extends Component {
  constructor(props){
    super(props);
    this.state = {
      numInteractions: 0
    };
  }

  render(){
    const interactionForms = [];

    for (let i = 0; i < this.state.numInteractions; i++) {
      interactionForms.push(h(InteractionForm));
    }

    return h('div.document-form.page-content', [
      h('h1', 'Insert Pathway Information As Text'),
      ...interactionForms,
      h('button.form-interaction-adder', { onClick: e => this.setState({ numInteractions: this.state.numInteractions + 1 }) }, [
        h('i.material-icons', 'add'),
        'add interaction'
      ]),
      h(DocumentWizardStepper, {
        backEnabled: false,
        // TODO
      })
    ]);
  }
}

module.exports = FormEditor;
