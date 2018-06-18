const h = require('react-hyperscript');
const _ = require('lodash');
let InteractionForm = require('./interaction-form.js');
let EntityForm = require('./entity-form.js');

class MolecularInteractionForm extends InteractionForm {

  // componentDidMount(){
  //   this.data.interaction.on('complete', ()=> this.forceUpdate());
  // }

  getNextEntityInd(){
    return this.data.interaction.elements().length;
  }

  deleteEntity(el){

    let intns = this.data.document.interactions().filter(intn => intn.has(el));

    if(intns.length <= 1)
      this.data.document.remove(el);
    else {
      this.data.interaction.removeParticipant(el);
    }

    this.forceUpdate();

  }

  render(){
    let intn = this.data.interaction;
    let nonNil = ele => !_.isNil( ele );
    let ppts = intn.participants().filter( nonNil );

    let getInteractionLine = el => {
      return h('div.form-molecular-intn-line', [
        //we have to assign key because react renders component in the old position when deleted
        h(EntityForm, {key: el.id(), entity:el, placeholder:'Molecule', tooltipContent:'Name or ID', style: 'form-entity', document: this.data.document, bus: this.data.bus}),
      ]);
    };

    return h('div.form-interaction', [
      getInteractionLine( ppts[0] ),
      h('span', 'interacts with'),
      getInteractionLine( ppts[1] )
    ]);
  }

}
module.exports = MolecularInteractionForm;
