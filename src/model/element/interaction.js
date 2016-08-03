let { fill, passthrough } = require('../../util');
let Element = require('./element');
let _ = require('lodash');

let defaults = {
  participantIds: []
};

class Interaction extends Element {
  constructor( opts ){
    super( opts );

    fill({
      obj: this,
      from: opts,
      defs: defaults
    });

    this.participants = [];
  }

  get fields(){ return super.fields.concat( _.keys( defaults ) ); }

  static get type(){ return 'interaction'; }

  get isInteraction(){ return true; }

  load( setup ){}

  add( ele ){
    this.participants.push( ele );

    this.participantIds.push( ele.id );

    return this.update('participantIds').then( passthrough(() => {
      this.emit( 'add', ele );
    }) );
  }

  remove( ele ){
    _.pull( this.participants, ele );
    _.pull( this.participantIds, ele.id );

    return this.update('participantIds').then( passthrough(() => {
      this.emit( 'remove', ele );
    }) );
  }
}

module.exports = Interaction;
