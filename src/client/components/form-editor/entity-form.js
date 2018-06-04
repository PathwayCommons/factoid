const DirtyComponent = require('../dirty-component');
const _ = require('lodash');
const h = require('react-hyperscript');
const ReactDom = require('react-dom');
const ElementInfo = require('../element-info/element-info');
const Mousetrap = require('mousetrap');
const EventEmitter = require('eventemitter3');
const Popover = require('../popover/popover');
const Tooltip = require('../popover/tooltip');


const emitter = new EventEmitter();


// Mousetrap.bind('escape', () => emitter.emit('esc'));

class EntityForm extends DirtyComponent {
  constructor(props) {
    super(props);
    this.state = this.data = _.assign( {
      style: 'form-entity'
    }, props );


    this.hCompletedStatus = h('i.material-icons', 'help');

    if(this.data.entity){
      if(this.data.entity.completed())
        this.hCompletedStatus = h('i.material-icons.entity-info-complete-icon', 'check_circle');


      this.data.entity.on("complete", () => {
        this.hCompletedStatus = h('i.material-icons.entity-info-complete-icon', 'check_circle');
        this.mergeWithOtherEntities();
        this.dirty();
      });

      // this.data.entity.on("remotecomplete", () => {
      //   this.hCompletedStatus = h('i.material-icons.entity-info-complete-icon', 'check_circle');
      //   this.mergeWithOtherEntities();
      //   this.dirty();
      // });


      this.data.entity.on("remoteupdate", () => {
        this.dirty();
      });


      this.data.entity.on("rename", () => {
        this.dirty();
      });

      this.data.entity.on("remoteassociated", () => {
        this.dirty();
      });

      this.data.entity.on("associated", () => {
        this.dirty();
      });

      this.data.entity.on("unassociated", () => {
        this.dirty();
      });
    }

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


  render(){
    let hFunc;

    if(this.state.entity && this.state.entity.completed())
      this.hCompletedStatus = h('i.material-icons.entity-info-complete-icon', 'check_circle');
    else
      this.hCompletedStatus = h('i.material-icons', 'help');


    hFunc = h('div.form-interaction', [
      h('input[type="button"].'+ this.state.style, {
          value: this.state.entity && this.state.entity.name(),
          placeholder: this.state.placeholder,
          readOnly: true
        }),
      this.hCompletedStatus
    ]);

    let key = "tmp";
    if(this.state.entity.association())
      key = this.state.entity.association().name + "-" + this.state.entity.association().organism;

    hFunc = h(Popover, {
      key: key,
      tippy: {
        // key: key,
        hideOnClick: false,
        interactive: true,
        multiple: false,
        html: h(ElementInfo, {/*key:key,*/ element: this.state.entity, document: this.state.document})
      }
    }, [hFunc]);






    return hFunc;
  }
}

module.exports = EntityForm;

