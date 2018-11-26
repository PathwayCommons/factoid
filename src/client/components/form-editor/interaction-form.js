const DirtyComponent = require('../dirty-component');
const _ = require('lodash');
const { tryPromise } = require('../../../util');
const dirtyEvents = ['remoteassociate', 'remoteretype'];
const EntityForm = require('./entity-form.js');
const ASSOCIATION = require('../../../model/element/interaction').ASSOCIATION;
const h = require('react-hyperscript');

//common interaction form
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
    let intn = this.data.interaction;
    let rEnt = this.getOutputParticipant();
    let assoc = intn.association();

    let setPptType = () => {
      assoc.setParticipantAsUnsigned(rEnt);
      if(val.indexOf("activ") > -1)
        assoc.setParticipantAsPositive(rEnt);
      else if(val.indexOf("inhib") > -1)
        assoc.setParticipantAsNegative(rEnt);
    };

    let complete = () => this.completeIfReady();
    let dirty = () => this.dirty();

    return tryPromise( setPptType ).then( complete ).then( dirty );
  }

  getModificationType(){
    return this.data.interaction.association().value;
  }

  updateModificationType(val){
    let intn = this.data.interaction;
    let associate = () => intn.associate(val);
    let complete = () => this.completeIfReady();
    let dirty = () => this.dirty();

    return tryPromise(associate).then(complete).then(dirty);
  }

  sign() {
    let assoc = this.data.interaction.association();
    let sign =  "interacts with";
    if(assoc) {
      if(assoc.isInhibition())
        sign = "inhibits";
      else if (assoc.isActivation())
        sign = "activates";
    }

    return sign;
  }

  render(){
    let intn = this.data.interaction;
    let lEnt = this.getInputParticipant();
    let rEnt = this.getOutputParticipant();
    let modVal = this.getModificationType();

    if(!rEnt || !lEnt){
      return null;
    }

    let actVal =  this.sign();

    return h('div.form-interaction', [
      h(EntityForm,
        { entity: lEnt, tooltipContent:'Name or ID', document: this.data.document }),
      h('select.form-options', {id:('activation-'+ intn.id()), value: actVal,
        onChange: e => {
          this.updateActivationInhibition(e.target.value);
        }}, [
        h('option', { value: 'interacts with'}, 'interacts with'),
        h('option', { value: 'activates'}, 'activates'),
        h('option', { value: 'inhibits'}, 'inhibits'),
      ]),
      h(EntityForm,
        { entity: rEnt, tooltipContent:'Name or ID', document: this.data.document }),
      h('span', 'via'),
      h('select.form-options',
        {id:('modification-'+ intn.id()), value: modVal,
          onChange: e => {this.updateModificationType(e.target.value);}
        },
        [
          h('option', { value: ASSOCIATION.BINDING.value },
            ASSOCIATION.BINDING.value),
          h('option', { value: ASSOCIATION.INTERACTION.value },
            ASSOCIATION.INTERACTION.value),
          h('option', { value: ASSOCIATION.MODIFICATION.value },
            ASSOCIATION.MODIFICATION.value),
          h('option', { value: ASSOCIATION.PHOSPHORYLATION.value },
            ASSOCIATION.PHOSPHORYLATION.value),
          h('option', { value: ASSOCIATION.METHYLATION.value },
            ASSOCIATION.METHYLATION.value),
          h('option', { value: ASSOCIATION.UBIQUITINATION.value },
            ASSOCIATION.UBIQUITINATION.value),
          h('option', { value: ASSOCIATION.DEPHOSPHORYLATION.value },
            ASSOCIATION.DEPHOSPHORYLATION.value),
          h('option', { value: ASSOCIATION.DEMETHYLATION.value },
            ASSOCIATION.DEMETHYLATION.value),
          h('option', { value: ASSOCIATION.DEUBIQUITINATION.value },
            ASSOCIATION.DEUBIQUITINATION.value),
          h('option', { value: ASSOCIATION.TRANSCRIPTION_TRANSLATION.value },
            ASSOCIATION.TRANSCRIPTION_TRANSLATION.value)
        ])
    ]);
  }

}

module.exports = InteractionForm;
