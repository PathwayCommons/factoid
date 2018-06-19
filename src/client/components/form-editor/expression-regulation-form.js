const h = require('react-hyperscript');
let InteractionForm = require('./interaction-form.js');
let EntityForm = require('./entity-form.js');


class ExpressionRegulationForm extends InteractionForm {


  render(){
    let intn = this.data.interaction;
    let lEnt = this.getInputParticipant();
    let rEnt = this.getOutputParticipant();

    let actVal =  intn.association().isInhibition()? "inhibits" : "activates" ;

    if(!rEnt || !lEnt || !actVal)
      return null;


    return h('div.form-interaction', [
      h(EntityForm, { entity: lEnt , placeholder: 'Enter transcription factor', document: this.data.document, bus: this.data.bus}),
      h('select.form-options', { value: actVal, onChange: e => this.updateActivationInhibition(e.target.value) }, [
          h('option', { value: 'activates' }, 'activates'),
          h('option', { value: 'inhibits' }, 'inhibits'),
      ]),
      h('span', 'expression of'),
      h(EntityForm, { entity: rEnt, placeholder: 'Enter target protein' , document: this.data.document, bus: this.data.bus} ),
    ]);

  }
}
module.exports = ExpressionRegulationForm;