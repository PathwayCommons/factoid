const h = require('react-hyperscript');
let InteractionForm = require('./interaction-form.js');
let EntityForm = require('./entity-form.js');

let Interaction = require('../../../model/element/interaction');

class ProteinModificationForm extends InteractionForm {




  updateModificationType(val){
    let intn = this.state.interaction;

    intn.associate(val);

    this.state.interaction.complete();

    this.forceUpdate();
  }

  getModificationType(){
    return this.state.interaction.association().value;
  }

  render(){


    let intn = this.state.interaction;

    let actVal =  intn.association() && intn.association().isInhibition()? "inhibits" : "activates" ;

    let lEnt = this.getInputParticipant();
    let rEnt = this.getOutputParticipant();


    let modVal = this.getModificationType();



    if(!rEnt || !lEnt || !modVal ||!actVal)
      return null;



    return h('div.form-interaction', [
      h(EntityForm, { entity: lEnt ,   placeholder:'Controller protein', tooltipContent:'Name or ID', document: this.state.document, bus: this.state.bus}),
      h('span', [
        h('select.form-options', {id:('activation-'+ intn.id()), value: actVal,
          onChange: e => {

            this.updateActivationInhibition(e.target.value);
          }}, [
          h('option', { value: 'activates'}, 'activates'),
          h('option', { value: 'inhibits'}, 'inhibits'),
        ])
      ]),
      h('span', [
        h('select.form-options', {id:('modification-'+ intn.id()), value: modVal ,
          onChange: e => {
            this.updateModificationType(e.target.value);
          }},
          [
          h('option', { value: Interaction.ASSOCIATION.PHOSPHORYLATION.value }, 'phosphorylation'),
          h('option', { value: Interaction.ASSOCIATION.METHYLATION.value }, 'methylation'),
          h('option', { value: Interaction.ASSOCIATION.UBIQUINATION.value }, 'ubiquination')
        ])
      ]),

      h(EntityForm, { entity: rEnt, placeholder:'Controlled protein' , tooltipContent:'Name or ID', document: this.state.document , bus: this.state.bus})

    ]);
  }
}

module.exports = ProteinModificationForm;