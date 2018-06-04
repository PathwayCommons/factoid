const h = require('react-hyperscript');
let InteractionForm = require('./interaction-form.js');
let EntityForm = require('./entity-form.js');

class MolecularInteractionForm extends InteractionForm {

  // componentDidMount(){
  //   this.state.interaction.on('complete', ()=> this.forceUpdate());
  // }

  getNextEntityInd(){
    return this.state.interaction.elements().length;
  }

  deleteEntity(el){

    let intns = this.state.document.interactions().filter(intn => intn.has(el));

    if(intns.length <= 1)
      this.state.document.remove(el);
    else {
      this.state.interaction.removeParticipant(el);
    }

    this.forceUpdate();

  }

  render(){
    const intn = this.state.interaction;
    let intnId = intn.id();
    let hDeleteFunc = (el) => {return h('button.delete-entity', {
        onClick: () => {
          this.deleteEntity(el);
        }
      }, 'x');};

    if(this.state.interaction.elements().length <= 2)
      hDeleteFunc = () => null;

    let hFunc = intn.elements().map(el =>{
      if(!el)
        return null;
      return h('div', [
        hDeleteFunc(el),
        //we have to assign key because react renders component in the old position when deleted
        h(EntityForm, {key: el.id(), entity:el, placeholder:'Molecule', tooltipContent:'Name or ID', style: 'form-entity', document: this.state.document, bus: this.state.bus}),
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