const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const tippyjs = require('tippy.js');
const _ = require('lodash');
const { tippyDefaults } = require('../../defs');
const Mousetrap = require('mousetrap');
const EventEmitter = require('eventemitter3');

const emitter = new EventEmitter();

Mousetrap.bind('escape', () => emitter.emit('esc'));

class Popover extends React.Component {
  constructor( props ){
    super( props );

    this.state = {};
  }

  render(){
    let p = this.props;

    return h( 'span.popover-target', {}, p.children );
  }

  renderTipContent(){
    let el = this.props.tippy.html;

    if( _.isFunction(el) ){
      el = h(el);
    }

    ReactDom.render( el, this.state.content );
  }

  componentDidMount(){
    let p = this.props;
    let target = p.target || ReactDom.findDOMNode(this).children[0];
    let options = p.tippy;
    let content = this.state.content = hh('div', {
      className: ( p.className || '' ) + ' popover-content'
    });

    this.renderTipContent();

    let tippy = tippyjs( target, _.assign( {}, tippyDefaults, options, {
      html: content
    } ) ).tooltips[0];

    let show = () => tippy.show();
    let hide = () => tippy.hide();

    if( p.show ){ p.show( show ); }
    if( p.hide ){ p.hide( hide ); }

    this.onEsc = () => tippy.hide();

    emitter.on('esc', this.onEsc);
  }

  componentWillUnmount(){
    emitter.removeListener('esc', this.onEsc);
  }

  componentDidUpdate(){
    this.renderTipContent();
  }
}

module.exports = Popover;
