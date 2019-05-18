import DirtyComponent from '../dirty-component';
import _ from 'lodash';
import { tryPromise } from '../../../util';
const dirtyEvents = ['remoteassociate', 'remoteretype'];
import EntityForm from './entity-form.js';
import h from 'react-hyperscript';
import { INTERACTION_TYPES, INTERACTION_TYPE } from '../../../model/element/interaction-type';
import { PARTICIPANT_TYPES, getPptTypeByVal } from '../../../model/element/participant-type';

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
    let assoc = intn.association();
    let newPptType = getPptTypeByVal(val);
    let resetNeeded = !this.isInteractionTypeAllowedForSign(assoc, newPptType);
    let rEnt = this.getOutputParticipant();
    let setPptType = () => assoc.setParticipantAs(rEnt, newPptType);
    let resetIntnType = () => resetNeeded ? this.updateInteractionAssociation(INTERACTION_TYPE.INTERACTION) : Promise.resolve();
    let complete = () => this.completeIfReady();
    let dirty = () => this.dirty();

    return Promise.all([ setPptType(), resetIntnType() ]).then( complete ).then( dirty );
  }

  getModificationType(){
    return this.data.interaction.association().value;
  }

  updateInteractionAssociation(val){
    let associate = () => this.data.interaction.associate(val);
    let complete = () => this.completeIfReady();
    let dirty = () => this.dirty();

    return tryPromise(associate).then(complete).then(dirty);
  }

  isInteractionTypeAllowedForSign(intnType, sign){
    return intnType.allowedParticipantTypes().some(at => at.value === sign.value);
  }

  render(){
    let intn = this.data.interaction;
    let lEnt = this.getInputParticipant(); // or the first
    let rEnt = this.getOutputParticipant(); // or the second
    let modVal = this.getModificationType();
    let sign = intn.association().getSign();
    let actVal =  sign.value;

    return h('div.form-interaction', [
      h(EntityForm,
        { entity: lEnt, tooltipContent:'Name or ID', document: this.data.document }),
      h('select.form-options.form-verb-phrase', {id:('activation-'+ intn.id()), value: actVal,
        onChange: e => {
          this.updateActivationInhibition(e.target.value);
        }},
        PARTICIPANT_TYPES
          .map(ppt => h('option', { value: ppt.value}, ppt.verbPhrase.toLowerCase()))
      ),
      h(EntityForm,
        { entity: rEnt, tooltipContent:'Name or ID', document: this.data.document }),
      h('span', 'via'),
      h('select.form-options.form-post-phrase',
        {
          id: 'modification-' + intn.id(),
          value: modVal,
          onChange: e => this.updateInteractionAssociation(e.target.value)
        },
        (
          INTERACTION_TYPES
          .filter(t => this.isInteractionTypeAllowedForSign(t, sign))
          .map(t => h('option', { value: t.value }, t.displayValue.toLowerCase()))
        )
      )
      //TODO: also use participants for filtering; e.g., any chemical - show INTERACTION only, etc.
    ]);
  }

}

export default InteractionForm;
