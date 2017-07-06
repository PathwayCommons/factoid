const React = require('react');
const h = require('react-hyperscript');
const EntityInfo = require('./entity-info');
const InteractionInfo = require('./interaction-info');
const Tooltip = require('./tooltip');

class ElementInfo extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let p = this.props;
    let element = p.element;
    let bus = p.bus;
    let document = p.document;
    let component;
    let showControls = false && document.editable(); // TODO disabled for now; maybe these could be useful? 

    if( element.isEntity() ){
      component = h( EntityInfo, { element, bus, document } );
    } else if( element.isInteraction() ){
      component = h( InteractionInfo, { element, bus, document } );
    }

    return (
      h('div.element-info', ( showControls ? [ h('div.element-info-controls', [
        h(Tooltip, { description: 'Draw connection from here',  }, [
          h('button.element-info-control', {
            onClick: () => {
              bus.emit( 'closetip', element );
              bus.emit( 'drawfrom', element );
            }
          }, [ h('i.material-icons', 'keyboard_tab') ])
        ]),
        h(Tooltip, { description: 'Delete this element' }, [
          h('button.element-info-control', {
            onClick: () => {
              bus.emit( 'closetip', element );
              bus.emit( 'remove', element );
            }
          }, [ h('i.material-icons', 'clear') ])
        ])
      ]) ] : [] ).concat([
        component
      ]) )
    );
  }
}

module.exports = ElementInfo;
