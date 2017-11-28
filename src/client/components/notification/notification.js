const EventEmitterMixin = require('../../../model/event-emitter-mixin');
const { mixin, error } = require('../../../util');

const defaults = {
  title: '',
  message: '',
  openText: 'Open',
  active: false,
  openable: false
};

const setOrGet = ( ntfn, name, value, eventName = name ) => {
  if( value !== undefined ){
    ntfn.options[name] = value;

    ntfn.emit( eventName );
    ntfn.emit('change');

    return this;
  } else {
    return ntfn.options[name];
  }
};

class Notification {
  constructor( options ){
    EventEmitterMixin.call( this );

    this.options = Object.assign( {}, defaults, options );
  }

  title( newTitle ){
    return setOrGet( this, 'title', newTitle );
  }

  message( newMessage ){
    return setOrGet( this, 'message', newMessage );
  }

  // whether the notification is active/shown in the ui
  active(){
    return this.options.active;
  }

  activate(){
    return setOrGet( this, 'active', true, 'activate' );
  }

  deactivate(){
    return setOrGet( this, 'active', false, 'deactivate' );
  }

  openable( newIsOpenable ){
    return setOrGet( this, 'openable', newIsOpenable );
  }

  // text for open action button
  openText( newText ){
    return setOrGet( this, 'openText', newText );
  }

  open(){
    if( this.openable() ){
      this.options.open = true;

      this.emit('open');

      return this;
    } else {
      throw error('Non-openable notifcation can not be opened');
    }
  }

  dismissed(){
    return !this.options.active;
  }

  dismiss(){
    return this.deactivate();
  }
}

mixin( Notification.prototype, EventEmitterMixin.prototype );

module.exports = Notification;
