let EventEmitter3 = require('eventemitter3');
let _ = require('lodash');

class EventEmitter extends EventEmitter3 {
  constructor() {
    super();

    this.listenersToRestore = [];
  }

  removeAllListeners( name ) {
    let listenersMap = this.getListenersMap( name );
    if ( listenersMap != null ) {
      this.listenersToRestore.push( listenersMap );
    }

    super.removeAllListeners( name );

    return this;
  }

  getListenersMap( name ){
    const singleNameList = n => this.listeners( n ).length > 0 ? [ n ] : [];
    let eventnames = _.isNil( name ) ? this.eventNames() : singleNameList( name );

    if ( eventnames.length == 0 ) {
      return null;
    }

    let listeners = new Map();
    eventnames.forEach( n => listeners.set( n, this.listeners( n ) ) );

    return listeners;
  }

  undoRemoveAllListeners( listenerSelf ){
    while ( this.listenersToRestore.length > 0 ) {
      this.undoLastRemoveAllListeners( listenerSelf );
    }

    return this;
  }

  undoLastRemoveAllListeners( listenerSelf ){
    if ( this.listenersToRestore.length > 0 ) {
      let listenersMap = this.listenersToRestore.pop();

      const rebind = eventname => {
        let listeners = listenersMap.get( eventname );
        listeners.forEach( l => {
          let bindedL = _.isNil( listenerSelf ) ? l : l.bind( listenerSelf );
          this.on( eventname, bindedL );
        } );
      };

      let eventnames = Array.from( listenersMap.keys() );
      eventnames.forEach( rebind );
    }

    return this;
  }
}

module.exports = EventEmitter;
