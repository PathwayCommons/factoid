const DirtyComponent = require('../dirty-component');
const _ = require('lodash');
const h = require('react-hyperscript');
const ReactDom = require('react-dom');
const ElementInfo = require('../element-info/element-info');

const Mousetrap = require('mousetrap');
const EventEmitter = require('eventemitter3');

const emitter = new EventEmitter();

Mousetrap.bind('escape', () => emitter.emit('esc'));

class EntityForm extends DirtyComponent {
  constructor(props) {
    super(props);
    this.state = this.data = _.assign( {
      style: 'form-entity'
    }, props );


    if(this.data.entity){
      this.data.entity.on("complete", () => {
        this.iconType = 'arrow_drop_up';
        this.mergeWithOtherEntities();
        this.dirty();
      });

      // this.data.entity.on("associate", () => {
      //   console.log("associated");
      //   this.dirty();
      // });
    }

    this.entityInfoClasses = ".entity-info-section, .entity-info-progression";


    if(this.data.entity.completed())
      this.iconType = 'arrow_drop_up';
    else
      this.iconType = 'arrow_drop_down';
  }

  componentDidMount(){
    emitter.on('esc', () => this.hideEntityInfo());
  }

  toggleEntityInfo(){
    let target = ReactDom.findDOMNode(this);
    let entityInfoSections = target.querySelectorAll(this.entityInfoClasses);
    entityInfoSections.forEach(ei => {
      ei.style.visibility = ei.style.visibility === "hidden" ? "visible": "hidden" ;
      if(ei.style.visibility === "hidden") {
        ei.style.height = 0;
        this.iconType = 'arrow_drop_down';
      }
      else {
        ei.style.height = "100%";
        this.iconType = 'arrow_drop_up';

      }
    });

    this.dirty();
  }


  hideEntityInfo(){

    let target = ReactDom.findDOMNode(this);
    let entityInfoSections = target.querySelectorAll(this.entityInfoClasses);
    entityInfoSections.forEach(ei => {
      ei.style.visibility = "hidden";
      ei.style.height = 0;

    });

    this.iconType = 'arrow_drop_up';
    this.dirty();
  }


  areAssociationsTheSame(assoc1, assoc2){
    return (assoc1.id === assoc2.id  && assoc1.organism === assoc2.organism);
  }

  /***
   * Combine the completed entities if they have the same grounding information and database id
   */
  mergeWithOtherEntities(){
    let entity = this.state.entity;

    if(entity) {

      //get the participant type of this entity within its interaction
      //there can only be one interaction with this entity as it is not merged yet
      let intns = this.state.document.interactions().filter(intn => intn.has(entity));

      let participantType = intns[0].getParticipantType(entity);


      let mergedEntity;

      //we can assume that all the other elements in the list are unique as we replace them immediately
      for(let i = 0; i < this.state.document.entities().length; i++) {
        let el = this.state.document.entities()[i];
        if (el.id() !== entity.id() && el.completed()) {
          if (this.areAssociationsTheSame(el.association(), entity.association())) {

            mergedEntity = el;

            // console.log("merging the two " + this.state.entity.id() + " and " + el.id());
            break;
          }
        }
      }


        // //find the entity index
      if(mergedEntity) {

        //update the interactions containing this entity
        let updateParticipants = ((intn) => {
          if( intn.has( entity )) {
            intn.addParticipant(mergedEntity);
            intn.setParticipantType(mergedEntity, participantType);

          }
          else
            return Promise.resolve();
        });

        Promise.all(  this.state.document.interactions().map( updateParticipants ) );


        //update the entity of this form
        this.state.entity = mergedEntity;
        //we can now remove our entity
        this.state.document.remove(entity);
      }
    }
  }


  shouldComponentUpdate(){
     return true;
  }

  updateState(){
    this.dirty();
  }

  render(){
    let hFunc;

    hFunc = h('div.form-interaction', [

      h('button.entity-info-edit.plain-button',  {
        onClick: () => this.toggleEntityInfo(),
        onChange: () => this.updateState()},
        [
        h('i.material-icons', this.iconType)
      ]),
      h(ElementInfo, {element: this.state.entity, document: this.state.document}),


    ]);


    return hFunc;
  }
}

module.exports = EntityForm;

