const h = require('react-hyperscript');
let InteractionForm = require('./interaction-form.js');
let EntityForm = require('./entity-form.js');

class ProteinModificationForm extends InteractionForm {

  // updateModificationType(val){
  //   // let intn = this.state.interaction;
  //   // intn.association().setModificationType(val);
  //
  //
  //   //TODO
  //   this.forceUpdate();
  // }

  getModificationType(){
    //TODO
    return "phosphorylation";
  }

  render(){

    let intn = this.state.interaction;

    let actVal =  intn.association().isInhibition()? "inhibits" : "activates" ;

    let lEnt = this.getInputParticipants()[0];
    let rEnt = this.getOutputParticipants()[0];


    let modVal = this.getModificationType();


    return h('div.form-interaction', [
      h(EntityForm, { entity: lEnt ,   placeholder:'Controller protein', tooltipContent:'Name or ID', document: this.state.document}),
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
        h('select.form-options', {id:('modification-'+ intn.id()), value: modVal /*,
          onChange: e => {


            this.updateModificationType(e.target.value);

          }*/},
          [
          h('option', { value: 'phosphorylation' }, 'phosphorylation'),
          h('option', { value: 'methylation' }, 'methylation'),
          h('option', { value: 'ubiquination' }, 'ubiquination'),
          h('option', { value: 'other' }, 'other')
        ])
      ]),
      h(EntityForm, { entity: rEnt, placeholder:'Controlled protein' , tooltipContent:'Name or ID', document: this.state.document} )

    ]);
  }
}

module.exports = ProteinModificationForm;