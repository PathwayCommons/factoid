let _ = require('lodash');
let Promise = require('bluebird');
let Syncher = require('../syncher');
let EventEmitterMixin = require('../event-emitter-mixin');
let ElementSet = require('../element-set');
let ElementCache = require('../element-cache');
let ElementFactory = require('../element');
let { assertOneOfFieldsDefined, mixin, getId } = require('../../util');
let Organism = require('../organism');

const DEFAULTS = Object.freeze({
  entries: [], // used by elementSet
  name: '',
  organisms: [] // list of ids
});

/**
A document that contains a set of biological elements (i.e. entities and interactions).

A document can be thought as a "factoid" --- it contains a unit of biological information,
usually associated with a particular piece of research.
*/
class Document {
  constructor( opts = {} ){
    EventEmitterMixin.call( this ); // defines this.emitter

    let data = _.defaultsDeep( {}, opts.data, DEFAULTS );

    opts = _.assign( {}, opts, { data } );

    assertOneOfFieldsDefined( opts, ['cache', 'factory', 'factoryOptions'] );

    this.hasCorrectSecret = false;

    this.syncher = new Syncher( opts );

    this.syncher.forward( this );

    let cache;

    if( opts.cache != null ){ // manual option for shared cache
      cache = opts.cache;
    } else if( opts.factory != null ){ // manual option for shared factory
      cache = new ElementCache({
        secret: data.secret,
        factory: opts.factory
      });
    } else if( opts.factoryOptions != null ){ // more automatic option if the doc has its own cache and factory (normal case)
      let factory = new ElementFactory();

      cache = new ElementCache({ factory, secret: data.secret });

      factory.set({ cache }); // factory needs a ref to the cache
      factory.set({ data: { secret: data.secret } }); // eles created by the factory should use the doc secret
      factory.set( opts.factoryOptions ); // overrides or other options (like socket, db refs)
    }

    this.elementSet = new ElementSet({
      syncher: this.syncher,
      emitter: this.emitter,
      cache: cache
    });

    this.syncher.on('remoteupdate', ( changes, old ) => {
      if( changes.organisms ){
        let addedIds = _.difference( changes.organisms, old.organisms );
        let rmedIds = _.difference( old.organisms, changes.organisms );
        let emit = ( id, on ) => {
          let org = Organism.fromId(id);

          this.emit('toggleorganism', org, on);
          this.emit('remotetoggleorganism', org, on);
        };

        addedIds.forEach( id => emit( id, true ) );
        rmedIds.forEach( id => emit( id, false ) );
      }
    });
  }

  filled(){
    return this.syncher.filled;
  }

  live(){
    return this.syncher.live;
  }

  id(){
    return this.syncher.get('id');
  }

  secret(){
    return this.syncher.get('secret');
  }

  editable(){
    return this.syncher.hasCorrectSecret();
  }

  publicUrl(){
    return [ '/document', this.id() ].join('/');
  }

  privateUrl(){
    if( this.editable() ){
      return [ '/document', this.id(), this.secret() ].join('/');
    } else {
      return this.publicUrl();
    }
  }

  cache(){
    return this.elementSet.cache;
  }

  factory(){
    return this.cache().factory;
  }

  load( setup = _.noop ){
    return this.syncher.load( () => {
      return this.elementSet.load().then( setup );
    } );
  }

  synch( enable ){
    return Promise.try( () => {
      return this.syncher.synch( enable );
    } ).then( () => {
      return this.elementSet.synch( enable );
    } );
  }

  rename( newName ){
    let updatePromise = this.syncher.update( 'name', newName );

    this.emit( 'rename', newName );
    this.emit( 'localrename', newName );

    return updatePromise;
  }

  name( newName ){
    if( newName != null ){
      return this.rename( newName );
    } else {
      return this.syncher.get('name');
    }
  }

  entities(){
    return this.elements().filter( el => el.isEntity() );
  }

  interactions(){
    return this.elements().filter( el => el.isInteraction() );
  }

  organisms(){
    let orgIds = this.syncher.get('organisms');

    if( orgIds != null ){
      return orgIds.map( id => Organism.fromId( id ) );
    } else {
      return [];
    }
  }

  toggleOrganism( org, toggleOn ){
    let orgId = getId( org );
    let orgIds = this.syncher.get('organisms') || [];
    let has = orgIds.find( id => id === orgId );

    if( toggleOn === undefined ){
      toggleOn = !has;
    }

    if( toggleOn ){
      if( has ){
        return Promise.resolve();
      } else {
        let update = this.syncher.push('organisms', orgId);

        this.emit('toggleorganism', Organism.fromId(orgId), toggleOn);
        this.emit('localtoggleorganism', Organism.fromId(orgId), toggleOn);

        return update;
      }
    } else {
      if( has ){
        let update = this.syncher.pull('organisms', orgId);

        this.emit('toggleorganism', Organism.fromId(orgId), toggleOn);
        this.emit('localtoggleorganism', Organism.fromId(orgId), toggleOn);

        return update;
      } else {
        return Promise.resolve();
      }
    }
  }

  add( el ){
    let add = el => this.elementSet.add( el );

    let addEnt = el => add( el );

    let addEle = el => {
      if( this.has( el ) ){
        return Promise.resolve();
      } else if( el.isInteraction() ){
        return addIntn( el );
      } else {
        return addEnt( el );
      }
    };

    let addIntn = el => {
      let addPpts = () => Promise.all( el.participants().map( addEle ) );
      let addSelf = () => add( el );

      return Promise.all([ addPpts(), addSelf() ]);
    };

    return addEle( el );
  }

  remove( el ){
    let rmFromIntn = intn => {
      if( intn.has( el ) ){
        return intn.remove( el );
      } else {
        return Promise.resolve();
      }
    };

    let rmFromIntns = () => Promise.all( this.interactions().map( rmFromIntn ) );

    let rm = () => this.elementSet.remove( el );

    return Promise.all([ rmFromIntns(), rm() ]);
  }

  json(){
    let toJson = obj => obj.json();

    return {
      id: this.id(),
      secret: this.secret(),
      organisms: this.organisms().map( toJson ),
      elements: this.elements().map( toJson ),
      publicUrl: this.publicUrl(),
      privateUrl: this.privateUrl()
    };
  }

  fromJson( json ){
    let els = json.elements || [];
    let makeEl = json => Promise.try( () => this.factory().make({ data: json }) );
    let createEl = el => el.create();
    let addEl = el => this.add( el );
    let handleEl = json => makeEl( json ).then( createEl ).then( addEl );
    let handleEls = () => Promise.all( els.map( handleEl ) );

    let orgIds = json.organisms || [];
    let addOrganism = id => this.toggleOrganism( id, true );
    let addOrganisms = () => Promise.all( orgIds.map( addOrganism ) );

    return Promise.all([
      handleEls(),
      addOrganisms()
    ]);
  }
}

mixin( Document.prototype, EventEmitterMixin.prototype );

// forward common calls to the element set
['has', 'get', 'size', 'elements'].forEach( name => {
  Document.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args );
  };
} );

// aliases of common syncher functions (just to save typing `.syncher` for common ops)
['create', 'update', 'destroy', 'creationTimestamp'].forEach( fn => {
  Document.prototype[ fn ] = function( ...args ){
    return this.syncher[ fn ]( ...args );
  };
} );

module.exports = Document;
