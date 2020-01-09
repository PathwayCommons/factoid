import React from 'react';
import h from 'react-hyperscript';

class Toggle extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let p = this.props;
    let update = () => this.forceUpdate();
    let on = p.getState();

    return h('button', {
      onClick: evt => {
        let ret = p.onToggle( evt );

        update(); // always update optimistically

        // if we have a promise, also update when it resolves
        if( ret != null && ret.then != null ){
          ret.then( update );
        }
      },
      className: [
        'button-toggle',
        on ? 'button-toggle-on' : ''
      ].join(' ') + ' ' + p.className
    }, p.children);
  }
}

export default Toggle;
