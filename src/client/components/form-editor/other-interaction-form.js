const h = require('react-hyperscript');
let InteractionForm = require('./interaction-form.js');
let EntityForm = require('./entity-form.js');

class OtherInteractionForm extends InteractionForm {

  render(){
    let lEnt = this.getInputParticipant();
    let rEnt = this.getOutputParticipant();

    if(!rEnt || !lEnt)
      return null;

    return h('div.form-interaction', [
      h(EntityForm, { entity: lEnt, document: this.data.document, bus: this.data.bus}),
      h('select.form-options', { value: 'interacts with', onChange: e => {this.updateActivationInhibition(e.target.value);
        } }, [
        h('option', { value: 'positively affects' }, 'promotes'),
        h('option', { value: 'negatively affects' }, 'suppresses'),
        h('option', { value: 'interacts with' }, 'interacts with'),
      ]),
      h(EntityForm, { entity: rEnt, document: this.data.document, bus: this.data.bus} ),
    ]);
  }

}

module.exports = OtherInteractionForm;
