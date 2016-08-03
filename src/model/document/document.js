let uuid = require('uuid');
let _ = require('lodash');
let { fill } = require('../../util');
let ElementFactory = require('../element');
let Synched = require('../synched');
let acl = require('../acl');

let defaults = {
  elementIds: [],
};

class Document extends Synched {
  constructor( opts ){
    super( _.assign( {
      collection: defaults.collection
    }, opts ) );

    fill({
      obj: this,
      from: opts,
      defs: defaults
    });

    this.elements = [];
  }

  static get collection(){ return defaults.collection; }

  get fields(){ return super.fields.concat( _.keys( defaults ) ); }

  // login temporarily via a private edit id (instead of a user account)
  login( privateId ){
    // TODO
  }

  load( setup = _.noop ){
    let makeEle = id => ElementFactory({ id });
    let loadEle = ele => ele.load();
    let addEle = ele => this.add( ele );
    let loadThenAddEle = ele => loadEle( ele ).then( addEle );
    let getLoadedEleFromId = id => loadThenAddEle( makeEle( id ) );

    return super.load(() => {
      return Promise.all( this.elementIds.map( getLoadedEleFromId ) );
    }).then( setup ).then( () => {
      return this;
    } );
  }

  add( ele ){
    this.elements.push( ele );
    this.elementIds.push( ele.id );

    return this.update('elementIds').then( passthrough(() => {
      this.emit( 'add', ele );

      return ele;
    }) );
  }

  remove( ele ){
    _.pull( this.elements, ele );
    _.pull( this.elementIds, ele.id );

    return this.update('elementIds').then( passthrough(() => {
      this.emit( 'remove', ele );

      return ele;
    }) );
  }
}

acl( Document.collection );

module.exports = Document;
