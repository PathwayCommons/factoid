const React = require('react');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const tippyjs = require('tippy.js');
const _ = require('lodash');

const { makeClassList, isInteractionNode } = require('../../../util');
const defs = require('../../defs');


let TOOLTIP_CONTENT = {
  entity:  editable => {
    return hh('div.help-tooltip', [
      hh('div', editable ? 'Provide entity name' : 'View Entities'),
      hh('ul', [
        hh('li', 'E.g. P53')
      ])
    ]);
  },
  interaction: editable => {
    return hh('div.help-tooltip', [
      hh('div', editable ? 'Provide interaction type and direction' : 'View interaction type and direction'),
      hh('ul', [
        hh('li', 'E.g. A activates phosphorylation of B')
      ])
    ]);
  }
};

class Help extends React.Component {
  constructor(props){
    super(props);

    this.data = ({
      showHelp: false
    });

    this.state = _.assign({}, this.data);

    let toggleHelpHandler = () => this.toggleHelp();
    this.toggleHelpHandler = toggleHelpHandler;
    props.bus.on('togglehelp', toggleHelpHandler);
  }

  setData( obj, callback ){
    _.assign( this.data, obj );

    this.setState( obj, callback );
  }

  componentWillUnmount(){
    this.props.bus.removeListener(this.toggleHelpHandler);
    if( this.data.entTip ){
      this.data.entTip.destroy();
    }
    if( this.data.intnTip ){
      this.data.intnTip.destroy();
    }
  }

  makeHelpTooltip( opts ){
    let ele = opts.ele;
    let eleRef = ele.popperRef();
    let tippy = new tippyjs(eleRef, _.assign({}, defs.tippyDefaults, {
      theme: 'dark',
      trigger: 'manual',
      distance: 32,
      zIndex: defs.tippyTopZIndex
    }, opts.tippy));

    return tippy.tooltips[0];
  }

  toggleHelp(){
    let showHelp = this.data.showHelp;
    let editable = this.props.document.editable();
    let bus = this.props.bus;
    let cy = this.props.controller.data.cy;

    if( !showHelp ){
      bus.emit('showtips');

      let ent = cy.nodes(node => !isInteractionNode(node)).first();
      if( !ent.empty() ){
        this.data.entTip = this.makeHelpTooltip( {
          ele: ent,
          tippy: {
            html: TOOLTIP_CONTENT.entity(editable),
            placement: 'right',
          }
        } );
        this.data.entTip.show();
      }

      let intn = cy.nodes(isInteractionNode).first();
      if( !intn.empty() ){

        this.data.intnTip = this.makeHelpTooltip( {
          ele: intn,
          tippy: {
            html: TOOLTIP_CONTENT.interaction(editable),
            placement: 'left'
          }
        } );
        this.data.intnTip.show();
      }
      this.setData({ showHelp: true });

    } else {
      bus.emit('hidetips');
      if( this.data.entTip ){ this.data.entTip.hide(); }
      if( this.data.intnTip ){ this.data.intnTip.hide(); }
      this.setData({ showHelp: false });
    }
  }


  render(){
    let helpContent = [
      h('div.help-overlay', {
        onClick: () => this.toggleHelp(),
         className: makeClassList({'help-overlay-active': this.state.showHelp})
        }
      )
    ];

    if( this.state.showHelp ){
      helpContent.push(
        h('div.editor-button.help-close-button', { onClick: () => this.toggleHelp()}, [
          h('i.material-icons', 'close')
        ])
      );
    }

    return h('div.help', helpContent);
  }
}


module.exports = Help;