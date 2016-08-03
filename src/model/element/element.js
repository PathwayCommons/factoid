let { fill, passthrough } = require('../../util');
let _ = require('lodash');
let is = require('is');
let Synched = require('../synched');
let { subscribe } = require('./pubsub');
let acl = require('../acl');

let defaults = {
  position: {
    x: 0,
    y: 0
  },
  name: '',
  collection: new Mongo.Collection('element')
};

let collectionIsLive = collection => collection === defaults.collection;

class Element extends Synched {
  constructor( opts ){
    super( _.assign( {
      collection: defaults.collection
    }, opts ) );

    fill({
      obj: this,
      from: opts,
      defs: defaults
    });

    if( Meteor.isClient && collectionIsLive( this.collection ) ){
      subscribe( this.id );
    }
  }

  static get collection(){ return defaults.collection; }

  get fields(){ return super.fields.concat( _.keys( defaults ) ).concat(['type']); }

  static get type(){ return 'element'; }

  get type(){ return Object.getPrototypeOf( this ).type; }

  rename( newName ){
    return this.update( 'name', newName ).then( passthrough(() => {
      this.emit('rename');
    }) );
  }

  reposition( newPos = {} ){
    _.assign( this.position, newPos );

    return this.update('position').then( passthrough(() => {
      this.emit('reposition');
    }) );
  }
}

acl( Element.collection );

module.exports = Element;
