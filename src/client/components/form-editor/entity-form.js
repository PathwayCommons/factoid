const DirtyComponent = require('../dirty-component');
const _ = require('lodash');
const h = require('react-hyperscript');
const ReactDom = require('react-dom');
const ElementInfo = require('../element-info/element-info');
// const Popover = require('../popover/popover');
const tippyjs = require('tippy.js');
const { tippyDefaults } = require('../../defs');
const hh = require('hyperscript');
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


    this.hCompletedStatus = this.getHelpIcon();


    if(this.data.entity){
      if(this.data.entity.completed())
        this.hCompletedStatus = this.getCompletedIcon();


      this.data.entity.on("complete", () => {
        this.hCompletedStatus = this.getCompletedIcon();
        this.mergeWithOtherEntities();
        if(this._isMounted)
          this.dirty();
      });


      this.data.entity.on("remotecomplete", () => {
        // this.hCompletedStatus = h('i.material-icons.entity-info-complete-icon', 'check_circle');

        // this.mergeWithOtherEntities();
        this.destroyTippy();
        this.mountTippy();
      });

      // this.data.entity.on("remoteupdate", () => {
      //   this.destroyTippy();
      //   this.makeTippy();
      //   this.dirty();
      // });

//
      // this.data.entity.on("remoteassociated", () => {
      //   this.destroyTippy();
      //   this.makeTippy();
      //   this.dirty();
      // });

      this.data.entity.on("rename", () => {
        if(this._isMounted)
          this.dirty();
      });

      this.data.entity.on("associated", () => {
        // this.tippy.destroy();
        this.destroyTippy();
        this.makeTippy();

      });

      this.data.entity.on("unassociated", () => {
        // this.tippy.destroy();
        this.destroyTippy();
        this.makeTippy();

      });

    }

  }

  componentDidMount(){
    this.target =  ReactDom.findDOMNode(this);//.children[0];
    this._isMounted = true;
  }

  componentWillUnmount(){
    this._isMounted = false;
  }

  getHelpIcon(){
    return h('i.material-icons', 'help');
  }

  getCompletedIcon(){
    return h('i.material-icons.element-info-complete-icon', 'check_circle');
  }

  mountTippy(){

    if(!this._tippyMounted) {
      this._tippyMounted = true;
      this.makeTippy();
      this.tippy.show();
    }

  }

  makeTippy () {

    if(!this._tippyMounted || !this._isMounted)
      return;

    let options = {
      duration: 0,
      placement: 'top',
      sticky: true,
      livePlacement: false,
      hideOnClick: false,
    };

    let getContentDiv = (component) => {
      let div = hh('div');
      ReactDom.render(component, div);
      return div;
    };

    this.content = getContentDiv(h(ElementInfo, {
      element: this.state.entity,
      document: this.state.document,
    }));

    this.tippy = tippyjs(this.target, _.assign({}, tippyDefaults, options, {
        html: this.content
      }
    )).tooltips[0];

    let hideTippy = () => this.tippy.hide();

    emitter.on('esc', hideTippy);

    this.dirty();
  }


   destroyTippy() {

    if(this.tippy) {
      let div = this.content;

      this.tippy.destroy();

      ReactDom.unmountComponentAtNode(div);
    }
    // let rm = div => {
    //   try {
    //     div.parentNode.removeChild( div );
    //   } catch( err ){
    //     // just let it fail
    //   }
    // };

    // rm(div);
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

    if(this.state.entity && this.state.entity.completed()) {
      this.state.entity.complete();
      this.hCompletedStatus = this.getCompletedIcon();
    }
    else
      this.hCompletedStatus = this.getHelpIcon();


    hFunc = h('div.form-interaction', [
      h('input[type="button"].'+ this.state.style, {
          value: this.state.entity && this.state.entity.name(),
          placeholder: this.state.placeholder,
          readOnly: true,
          onClick: () => {this.mountTippy();}
        }),
      this.hCompletedStatus
    ]);

    return hFunc;
  }
}

module.exports = EntityForm;

