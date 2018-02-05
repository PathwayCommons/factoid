const Tooltip = require('./tooltip');
const h = require('react-hyperscript');
const _ = require('lodash');
const { Component } = require('react');
const EventEmitter = require('eventemitter3');

class ConditionalTooltip extends Component {
  constructor( props ){
    super( props );

    this.emitter = new EventEmitter();
  }

  checkShouldShow(){
    if( this.props.condition ){
      this.show();
    } else {
      this.hide();
    }
  }

  show(){
    setTimeout( () => this.emitter.emit('show'), 0 );
  }

  hide(){
    setTimeout( () => this.emitter.emit('hide'), 0 );
  }

  componentDidMount(){
    this.checkShouldShow();
  }

  componentDidUpdate(){
    this.checkShouldShow();
  }

  render(){
    let { props } = this;

    let tooltipOptions = _.assign({
      show: showTooltip => this.emitter.on('show', showTooltip),
      hide: hideTooltip => this.emitter.on('hide', hideTooltip)
    }, props, {
      tippy: _.assign({
        trigger: 'manual'
      }, props.tippy)
    });

    return h( Tooltip, tooltipOptions, props.children );
  }
}

module.exports = ConditionalTooltip;
