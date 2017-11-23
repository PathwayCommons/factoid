const EventEmitterMixin = require('./event-emitter-mixin');
const { mixin } = require('../util');

class NotificationList {
  constructor( notifications = [] ){
    EventEmitterMixin.call( this );

    this.set = new Set( notifications );
  }

  add( ntfn ){
    this.set.add( ntfn );

    ntfn.on('dismiss', () => {
      this.delete( ntfn );
    });

    this.emit('add', ntfn);
    this.emit('change');

    return this;
  }

  delete( ntfn ){
    this.set.delete( ntfn );

    this.emit('delete', ntfn);
    this.emit('change');

    return this;
  }

  clear(){
    this.set.clear();

    this.emit('clear');
    this.emit('change');

    return this;
  }

  values(){
    return this.set.values();
  }

  forEach( fn, thisArg ){
    return this.set.forEach( fn, thisArg );
  }
}

NotificationList.prototype[ Symbol.iterator ] = NotificationList.prototype.values;

mixin( NotificationList.prototype, EventEmitterMixin.prototype );

module.exports = NotificationList;
