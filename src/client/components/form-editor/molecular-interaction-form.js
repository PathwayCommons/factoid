const h = require('react-hyperscript');
const _ = require('lodash');
let InteractionForm = require('./interaction-form.js');
let EntityForm = require('./entity-form.js');

class MolecularInteractionForm extends InteractionForm {

  render(){
    let intn = this.data.interaction;
    let nonNil = ele => !_.isNil( ele );
    let ppts = intn.participants().filter( nonNil );

    if( ppts.length < 2 ){
      return null;
    }

    let getInteractionLine = el => {
      return h('div.form-molecular-intn-line', [
        //we have to assign key because react renders component in the old position when deleted
        h(EntityForm, {key: el.id(), entity:el, tooltipContent:'Name or ID', style: 'form-entity', document: this.data.document, bus: this.data.bus}),
      ]);
    };

    return h('div.form-interaction', [
      getInteractionLine( ppts[0] ),
      h('span', 'binds'),
      getInteractionLine( ppts[1] )
    ]);
  }

}
module.exports = MolecularInteractionForm;
