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
      style: 'form-entity',
      showEntityInfo: false,
    }, props );



    // if(this.data.entity){
    //   this.data.entity.on("complete", () => {
    //     this.dirty();
    //   });
    // }

    this.entityInfoClasses = ".entity-info-section, .entity-info-progression";


  }

  componentDidMount(){
    // this.hideEntityInfo();
    emitter.on('esc', () => this.hideEntityInfo());
  }

  toggleEntityInfo(){
    let target = ReactDom.findDOMNode(this);
    let entityInfoSections = target.querySelectorAll(this.entityInfoClasses);
    entityInfoSections.forEach(ei => {
      ei.style.visibility = ei.style.visibility === "hidden" ? "visible": "hidden" ;
      if(ei.style.visibility === "hidden") {
        ei.style.height = 0;
      }
      else {
        ei.style.height = "100%";

        // ei.style.zIndex = "10";
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


    this.dirty();
  }

  updateEntityName(newName) {
    this.state.entity.name(newName);
    this.dirty();

  }

  updateGrounding(stateVal) {

      if (this.state.entity.name().length > 0) {
          // this.state.showEntityInfo = stateVal;
          this.setState({showEntityInfo: stateVal});
      }
    this.dirty();
  }

  areAssociationsTheSame(assoc1, assoc2){
    return (assoc1.id === assoc2.id && assoc1.modification === assoc2.modification && assoc1.organism === assoc2.organism);
  }

  /***
   * Combine the completed entities if they have the same grounding information and database id
   */
  mergeWithOtherEntities(){

    if(this.state.entity.completed()) {
      let entity = this.state.entity;
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
  componentDidUpdate(){

    //always check this
    this.mergeWithOtherEntities();
    return true;
  }

  domId(){
    return "entity-" + this.state.entity.id();
  }

  render(){
    let hFunc;

    hFunc = h('div.form-interaction', [

      h('button.entity-info-edit.plain-button',  {onClick: () => this.toggleEntityInfo()}, [
        h('i.material-icons', 'arrow_drop_down  ')
      ]),
      h(ElementInfo, {element: this.state.entity, document: this.state.document}),


    ]);


    return hFunc;
  }
}

module.exports = EntityForm;

