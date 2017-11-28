const React = require('react');
const h = require('react-hyperscript');
const EntityInfo = require('./entity-info');
const InteractionInfo = require('./interaction-info');

class ElementInfo extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let p = this.props;
    let { element } = p;
    let component;

    if( element.isEntity() ){
      component = h( EntityInfo, p );
    } else if( element.isInteraction() ){
      component = h( InteractionInfo, p );
    }

    return (
      h('div.element-info', [ component ] )
    );
  }
}

module.exports = ElementInfo;
