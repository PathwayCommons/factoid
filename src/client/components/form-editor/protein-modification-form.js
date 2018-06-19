const h = require('react-hyperscript');
const InteractionForm = require('./interaction-form.js');
const EntityForm = require('./entity-form.js');
const Interaction = require('../../../model/element/interaction');
const Promise = require('bluebird');

class ProteinModificationForm extends InteractionForm {
  constructor(props){
    super(props);
  }

  updateModificationType(val){
    let intn = this.data.interaction;
    let associate = () => intn.associate(val);
    let complete = () => this.completeIfReady();
    let dirty = () => this.dirty();

    return Promise.try(associate).then(complete).then(dirty);
  }

  getModificationType(){
    return this.data.interaction.association().value;
  }

  render(){
    let intn = this.data.interaction;

    let actVal =  intn.association() && intn.association().isInhibition()? "inhibits" : "activates" ;

    let lEnt = this.getInputParticipant();
    let rEnt = this.getOutputParticipant();

    let modVal = this.getModificationType();


    if(!rEnt || !lEnt || !modVal ||!actVal)
      return null;

    return h('div.form-interaction', [
      h(EntityForm, { entity: lEnt ,   placeholder:'Controller protein', tooltipContent:'Name or ID', document: this.data.document, bus: this.data.bus}),
      h('select.form-options', {id:('activation-'+ intn.id()), value: actVal,
        onChange: e => {

          this.updateActivationInhibition(e.target.value);
        }}, [
        h('option', { value: 'activates'}, 'activates'),
        h('option', { value: 'inhibits'}, 'inhibits'),
      ]),
      h('span', 'the'),
      h('select.form-options', {id:('modification-'+ intn.id()), value: modVal ,
        onChange: e => {
          this.updateModificationType(e.target.value);
        }},
        [
        h('option', { value: Interaction.ASSOCIATION.PHOSPHORYLATION.value }, 'phosphorylation'),
        h('option', { value: Interaction.ASSOCIATION.METHYLATION.value }, 'methylation'),
        h('option', { value: Interaction.ASSOCIATION.UBIQUINATION.value }, 'ubiquination')
      ]),
      h('span', 'of'),
      h(EntityForm, { entity: rEnt, placeholder:'Controlled protein' , tooltipContent:'Name or ID', document: this.data.document, bus: this.data.bus})
    ]);
  }
}

module.exports = ProteinModificationForm;
