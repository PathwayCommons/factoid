const h = require('react-hyperscript');
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
    let intnId = intn.id();
    let eles = intn.elements();

    // Normally more than 2 participants is not expected and so this function is
    // expected to return null.
    let getDeleteButton = ( el ) => {
      if ( eles.length <= 2 ) {
        return null;
      }

      return h('button.delete-entity.plain-button', {
        onClick: () => {
          this.deleteEntity(el);
        }
      }, h('i.material-icons', 'delete'));
    };

    let interactionLine = eles.map( el => {
      if ( !el ) {
        return null;
      }

      return h('div.form-molecular-intn-line', [
        getDeleteButton( el ),
        //we have to assign key because react renders component in the old position when deleted
        h(EntityForm, {key: el.id(), entity:el, placeholder:'Molecule', tooltipContent:'Name or ID', style: 'form-entity', document: this.data.document, bus: this.data.bus}),
      ]);
    });

    return h('div.form-interaction', [
      ...interactionLine
    ]);
  }

}
module.exports = MolecularInteractionForm;
