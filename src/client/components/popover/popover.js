import React from 'react';
import ReactDom from 'react-dom';
import h from 'react-hyperscript';
import hh from 'hyperscript';
import tippyjs from 'tippy.js';
import _ from 'lodash';
import { tippyDefaults } from '../../defs';
import Mousetrap from 'mousetrap';
import EventEmitter from 'eventemitter3';

const emitter = new EventEmitter();

Mousetrap.bind('escape', () => emitter.emit('esc'));

class Popover extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let p = this.props;

    return h( 'span.popover-target', { ref: el => this.target = el }, p.children );
  }

  renderTipContent(){
    let el = this.props.tippy.html;

    if( _.isFunction(el) ){
      el = h(el);
    }

    ReactDom.render( el, this.content );
  }

  componentDidMount(){
    let p = this.props;
    let target = p.target || this.target;
    let options = p.tippy;
    let content = this.content = hh('div', {
      className: ( this.props.className || '' ) + ' popover-content'
    });

    let rawTippyOptions = _.assign( {}, tippyDefaults, options );

    let tippyOptions = _.assign( {}, rawTippyOptions, {
      html: content,
      hideOnClick: false
    } );

    this.renderTipContent();

    let tippy = tippyjs( target, tippyOptions ).tooltips[0];

    let show = () => tippy.show();
    let hide = () => tippy.hide();

    if( p.show ){ p.show( show ); }
    if( p.hide ){ p.hide( hide ); }

    this.hideTippy = () => tippy.hide();
    this.destroyTippy = () => tippy.destroy();

    emitter.on('esc', this.hideTippy);

    // the tippy hide on click doesn't work with react
    if( rawTippyOptions.hideOnClick ){
      this.onBodyClick = (e) => {
        let parent = e.target;
        let hide = true;

        while( parent !== document.body ){
          if( parent === content || parent === target ){
            hide = false;
            break;
          }

          parent = parent.parentNode;
        }

        if( hide ){
          this.hideTippy();
        }
      };

      document.body.addEventListener('click', this.onBodyClick);
    }
  }

  componentWillUnmount(){
    if( this.onBodyClick ){
      document.body.removeEventListener('click', this.onBodyClick);
    }

    emitter.removeListener('esc', this.hideTippy);

    ReactDom.unmountComponentAtNode( this.content );

    this.destroyTippy();
  }

  componentDidUpdate(){
    this.renderTipContent();
  }
}

export default Popover;
