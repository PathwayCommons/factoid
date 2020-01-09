import _ from 'lodash';
import uuid from 'uuid';

import EventEmitterMixin from '../../../model/event-emitter-mixin';
import { mixin } from '../../../util';

class NotificationList {
  constructor( notifications = [], opts ){
    EventEmitterMixin.call( this );

    this.set = new Set( notifications );

    this.options = _.assign({
      id: uuid()
    }, opts);
  }

  id(){
    return this.options.id;
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

  empty(){
    return this.set.size === 0;
  }
}

NotificationList.prototype[ Symbol.iterator ] = NotificationList.prototype.values;

mixin( NotificationList.prototype, EventEmitterMixin.prototype );

export default NotificationList;
