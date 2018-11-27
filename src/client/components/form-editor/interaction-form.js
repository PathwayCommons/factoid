const DirtyComponent = require('../dirty-component');
const _ = require('lodash');
const { tryPromise } = require('../../../util');
const dirtyEvents = ['remoteassociate', 'remoteretype'];
const EntityForm = require('./entity-form.js');
const Interaction = require('../../../model/element/interaction');
const h = require('react-hyperscript');

class InteractionForm extends DirtyComponent {

  constructor(props){
    super(props);

    this.data = {
      id: props.id,
      interaction: props.interaction,
      description: props.description,
      document: props.document,
      bus: props.bus
    };

    this.dirtyHandler = () => this.dirty();
  }

  componentDidMount(){
    let intn = this.data.interaction;
    dirtyEvents.forEach(e => intn.on(e, this.dirtyHandler));
  }

  componentWillUnmount(){
    let intn = this.data.interaction;
    dirtyEvents.forEach(e => intn.removeListener(e, this.dirtyHandler));
  }

  getInputParticipant(){
    return this.data.interaction.association().getSource()
      || this.data.interaction.participants()[0];
  }

  getOutputParticipant(){
    return this.data.interaction.association().getTarget()
      || this.data.interaction.participants()[1];
  }

  completeIfReady(){
    let intn = this.data.interaction;
    if(!intn.completed() && intn.associated() && intn.association().isSigned()){
      return intn.complete();
    } else {
      return Promise.resolve();
    }
  }

  addEntityRow(data){
    let doc = this.data.document;
    let el = doc.factory().make({
      data: _.assign( {
        type: 'entity',
        name: ''

      }, data )
    });

    tryPromise( () => el.synch() )
      .then( () => el.create() )
      .then( () => doc.add(el) )
      .then( () => el )
      .then( () => this.data.interaction.addParticipant(el) )
      .then(() => this.dirty());
  }

  updateActivationInhibition(val){
    let rEnt = this.getOutputParticipant();
    let assoc = this.data.interaction.association();
    let setPptType = () => {
      assoc.setParticipantAs( rEnt, Interaction.getPptTypeByVal(val));
    };
    let complete = () => this.completeIfReady();
    let dirty = () => this.dirty();

    return tryPromise( setPptType ).then( complete ).then( dirty );
  }

  getModificationType(){
    return this.data.interaction.association().value;
  }

  updateModificationType(val){
    let associate = () => this.data.interaction.associate(val);
    let complete = () => this.completeIfReady();
    let dirty = () => this.dirty();

    return tryPromise(associate).then(complete).then(dirty);
  }

  render(){
    let intn = this.data.interaction;
    let lEnt = this.getInputParticipant(); //or the first
    let rEnt = this.getOutputParticipant();//or the second
    let modVal = this.getModificationType();
    let actVal =  intn.association().getSignValue();
    const SIG = Interaction.PARTICIPANT_TYPE;
    const ASS = Interaction.ASSOCIATION;

    return h('div.form-interaction', [
      h(EntityForm,
        { entity: lEnt, tooltipContent:'Name or ID', document: this.data.document }),
      h('select.form-options', {id:('activation-'+ intn.id()), value: actVal,
        onChange: e => {
          this.updateActivationInhibition(e.target.value);
        }},
        Interaction.PARTICIPANT_TYPES
          .filter(p => p != SIG.UNSIGNED_TARGET) //except unsupported (e.g., by biopax converter)
          .map(ppt => h('option', { value: ppt.value}, ppt.verb))
      ),
      h(EntityForm,
        { entity: rEnt, tooltipContent:'Name or ID', document: this.data.document }),
      h('span', 'via'),
      h('select.form-options',
        {id:('modification-'+ intn.id()), value: modVal,
          onChange: e => {this.updateModificationType(e.target.value);}
        },
        [
          {h: h('option', { value: ASS.BINDING.value},
              ASS.BINDING.displayValue), actVals: [SIG.UNSIGNED.value]},
          {h: h('option', { value: ASS.PHOSPHORYLATION.value },
              ASS.PHOSPHORYLATION.displayValue),
            actVals: [SIG.POSITIVE.value, SIG.NEGATIVE.value]},
          {h: h('option', { value: ASS.METHYLATION.value },
              ASS.METHYLATION.displayValue),
            actVals: [SIG.POSITIVE.value, SIG.NEGATIVE.value]},
          {h: h('option', { value: ASS.UBIQUITINATION.value },
              ASS.UBIQUITINATION.displayValue),
            actVals: [SIG.POSITIVE.value, SIG.NEGATIVE.value]},
          {h: h('option', { value: ASS.DEPHOSPHORYLATION.value },
              ASS.DEPHOSPHORYLATION.displayValue),
            actVals: [SIG.POSITIVE.value, SIG.NEGATIVE.value]},
          {h: h('option', { value: ASS.DEMETHYLATION.value },
              ASS.DEMETHYLATION.displayValue),
            actVals: [SIG.POSITIVE.value, SIG.NEGATIVE.value]},
          {h: h('option', { value: ASS.DEUBIQUITINATION.value },
              ASS.DEUBIQUITINATION.displayValue),
            actVals: [SIG.POSITIVE.value, SIG.NEGATIVE.value]},
          {h: h('option', { value: ASS.TRANSCRIPTION_TRANSLATION.value },
              ASS.TRANSCRIPTION_TRANSLATION.displayValue),
            actVals: [SIG.POSITIVE.value, SIG.NEGATIVE.value]},
          {h: h('option', { value: ASS.MODIFICATION.value },
              ASS.MODIFICATION.displayValue),
            actVals: [SIG.POSITIVE.value, SIG.NEGATIVE.value]},
          {h: h('option', { value: ASS.INTERACTION.value },
              ASS.INTERACTION.displayValue),
            actVals: [SIG.UNSIGNED.value, SIG.POSITIVE.value, SIG.NEGATIVE.value]}
        ].filter(o => o.actVals.indexOf(actVal)>-1).map(o => o.h))
      //TODO: also use participants for filtering; e.g., any chemical - show INTERACTION only, etc.
    ]);
  }

}

module.exports = InteractionForm;
