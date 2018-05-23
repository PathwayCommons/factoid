const h = require('react-hyperscript');
let InteractionForm = require('./interaction-form.js');
let EntityForm = require('./entity-form.js');


class MolecularInteractionForm extends InteractionForm {


  getNextEntityInd(){
    return this.state.interaction.elements().length;
  }



  render(){
    const intn = this.state.interaction;
    let intnId = intn.id();

    let hFunc = intn.elements().map(el =>{
      return h('div', [h(EntityForm, {entity:el, placeholder:'Molecule', tooltipContent:'Name or ID', style: 'form-entity-small', document: this.state.document, bus: this.state.bus})
      ]);
    });

    return h('div.form-interaction', [

      ...hFunc,

      h('div.form-action-buttons', [
        h('button.form-entity-adder', { onClick: () => {
              let desc = {};
              desc[intnId] = this.getNextEntityInd();
              this.addEntityRow({description:desc});}},
          [ h('i.material-icons.add-new-entity-icon', 'add'), ''])
      ])
    ]);
  }

}
module.exports = MolecularInteractionForm;