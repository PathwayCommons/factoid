import React from 'react';
import h from 'react-hyperscript';
import EntityInfo from './entity-info';
import InteractionInfo from './interaction-info';

class ElementInfo extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let p = Object.assign( {
      key: this.props.element.id()
    }, this.props );

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

export default ElementInfo;
