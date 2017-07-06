let EventEmitter = require('eventemitter3');
let _ = require('lodash');
let m;

/**
Allows for direct EventEmitter functions on a class, while using only the `emitter`
property on the class.
*/
let EventEmitterMixin = m = function(){
  this.emitter = new EventEmitter();
  this.forwardedEmitters = [];
};

_.extend( m.prototype, {
  on: function( name, listener ){
    this.emitter.on( name, listener, this );

    return this;
  },

  once: function( name, listener ){
    this.emitter.once( name, listener, this );

    return this;
  },

  removeListener: function( name, listener ){
    this.emitter.removeListener( name, listener, this );

    return this;
  },

  removeAllListeners: function( name ){
    this.emitter.removeAllListeners( name );

    return this;
  },

  emit: function( name, ...args ){
    let emit = ee => ee.emit( name, ...args );

    emit( this.emitter );
    this.forwardedEmitters.forEach( emit );

    return this;
  },

  forward: function( ee ){
    this.forwardedEmitters.push( ee );

    return this;
  },

  removeForward: function( ee ){
    _.pull( this.forwardedEmitters, ee );
  }
});

_.extend( m, {
  addListener: m.on,
  off: m.removeListener,
  trigger: m.emit,
  unforward: m.removeForward
} );

module.exports = EventEmitterMixin;
