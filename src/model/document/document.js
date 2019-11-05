import _ from 'lodash';
import Syncher from '../syncher';
import EventEmitterMixin from '../event-emitter-mixin';
import ElementSet from '../element-set';
import ElementCache from '../element-cache';
import ElementFactory from '../element';
import { assertOneOfFieldsDefined, mixin, getId, makeCyEles, getCyLayoutOpts, isNonNil, tryPromise } from '../../util';
import Cytoscape from 'cytoscape';

const DEFAULTS = Object.freeze({
  // data
  entries: [], // used by elementSet
  organisms: [], // list of ids

  // metadata
  submitted: false,
  journalName: '',
  title: '',
  authors: '',
  abstract: '',
  text: '',
  trackingId: '',
  contributorName: '',
  contributorEmail: '',
  editorName: '',
  editorEmail: ''
});

const METADATA_FIELDS = ['journalName', 'title', 'authors', 'abstract', 'text', 'trackingId', 'contributorName', 'contributorEmail', 'editorName', 'editorEmail'];

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
          this.emit('toggleorganism', id, on);
          this.emit('remotetoggleorganism', id, on);
        };

        addedIds.forEach( id => emit( id, true ) );
        rmedIds.forEach( id => emit( id, false ) );
      }

      if( changes.submitted ){
        this.emit('submit');
        this.emit('remotesubmit');
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
    return tryPromise( () => {
      return this.syncher.synch( enable );
    } ).then( () => {
      return this.elementSet.synch( enable );
    } );
  }

  rename( newName ){
    let updatePromise = this.syncher.update( 'title', newName );

    this.emit( 'rename', newName );
    this.emit( 'localrename', newName );

    return updatePromise;
  }

  title( newName ){
    if( newName != null ){
      return this.rename( newName );
    } else {
      return this.syncher.get('title');
    }
  }

  // helper for get/set of simple paper metadata
  rwMeta(field, newVal){
    if( newVal != null ){
      let event = field.replace(/([A-Z])/g, (match, letter) => '-' + letter.toLowerCase());

      let updatePromise = this.syncher.update(field, newVal);

      this.emit('meta' + event, newVal);
      this.emit('localmeta' + event, newVal);

      return updatePromise;
    } else {
      return this.syncher.get(field);
    }
  }

  journalName(newName){
    return this.rwMeta('journalName', newName);
  }

  authors(newNames){
    return this.rwMeta('authors', newNames);
  }

  contributorName(newName){
    return this.rwMeta('contributorName', newName);
  }

  contributorEmail(newEmail){
    return this.rwMeta('contributorEmail', newEmail);
  }

  editorName(newName){
    return this.rwMeta('editorName', newName);
  }

  editorEmail(newEmail){
    return this.rwMeta('editorEmail', newEmail);
  }

  trackingId(newId){
    return this.rwMeta('trackingId', newId);
  }

  abstract(newAbstract){
    return this.rwMeta('abstract', newAbstract);
  }

  text(newText){
    return this.rwMeta('text', newText);
  }

  entities(){
    return this.elements().filter( el => el.isEntity() );
  }

  interactions(){
    return this.elements().filter( el => el.isInteraction() );
  }

  complexes(){
    return this.elements().filter( el => el.isComplex() );
  }

  // mention count for all organisms (toggle + ent mentions)
  organismCounts(){
    let cnt = new Map(); // org => mention count
    let addToCount = org => cnt.set( org, !cnt.has(org) ? 1 : cnt.get(org) + 1 );
    let entIsAssocd = ent => ent.associated();
    let getOrgIdForEnt = ent => _.get( ent.association(), ['organism'] );

    this.toggledOrganisms().forEach( addToCount );

    (
      this.entities()
      .filter( entIsAssocd )
      .map( getOrgIdForEnt )
      .filter( isNonNil ) // may be an entity w/o org
      .forEach( addToCount )
    );

    return cnt;
  }

  organismCountsJson(){
    let json = {};

    for( let [org, count] of this.organismCounts() ){
      json[ org ] = count;
    }

    return json;
  }

  // mentions for one org
  organismCount( org ){
    return this.organismCounts().get( org ) || 0;
  }

  // get list of all orgs (incl. explicit mentions and implicit mentions via entity assoc)
  organisms(){
    let hasMentions = ([ org, mentions ]) => mentions > 0; // eslint-disable-line no-unused-vars
    let getOrg = ([ org, mentions ]) => org; // eslint-disable-line no-unused-vars

    return [ ...this.organismCounts() ].filter( hasMentions ).map( getOrg );
  }

  // get list of orgs w/ explicit mentions
  toggledOrganisms(){
    return this.syncher.get('organisms');
  }

  // toggle organism explicit mention
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

        this.emit('toggleorganism', orgId, toggleOn);
        this.emit('localtoggleorganism', orgId, toggleOn);

        return update;
      }
    } else {
      if( has ){
        let update = this.syncher.pull('organisms', orgId);

        this.emit('toggleorganism', orgId, toggleOn);
        this.emit('localtoggleorganism', orgId, toggleOn);

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

  // applies layout positions after the layout is done running, mostly useful for serverside
  applyLayout(){
    let cy = new Cytoscape({
      headless: true,
      elements: makeCyEles( this.elements() ),
      layout: { name: 'grid' },
      styleEnabled: true
    });

    let runLayout = () => {
      let layout = cy.layout( _.assign( {}, getCyLayoutOpts(), {
        animate: false,
        randomize: true
      } ) );

      let layoutDone = layout.promiseOn('layoutstop');

      layout.run();

      return layoutDone;
    };

    let savePositions = () => Promise.all( this.elements().map( docEl => {
      let el = cy.getElementById( docEl.id() );

      return docEl.reposition( _.clone( el.position() ) );
    } ) );

    return tryPromise( runLayout ).then( savePositions );
  }

  submit(){
    let p = this.syncher.update({ submitted: true });

    this.emit('submit');

    return p;
  }

  submitted(){
    return this.syncher.get('submitted') ? true : false;
  }

  json(){
    let toJson = obj => obj.json();

    return _.assign({
      id: this.id(),
      secret: this.secret(),
      title: this.title(),
      summary: this.toText(),
      organisms: this.organisms().map( toJson ),
      elements: this.elements().map( toJson ),
      publicUrl: this.publicUrl(),
      privateUrl: this.privateUrl(),
      submitted: this.submitted()
    }, _.pick(this.syncher.get(), METADATA_FIELDS));
  }

  toBiopaxTemplates(){
    let interactions = this.interactions();
    let templates = [];

    interactions.forEach( intn => {
      let template = intn.toBiopaxTemplate();
      if (template !== null){
        templates.push(template);
      }
    } );

    return templates;
  }

  toText(){
    let interactions = this.interactions();
    let strings = interactions.map( intn => intn.toString() + '.' );

    return strings.join('\n');
  }

  fromJson( json ){
    let els = json.elements || [];
    let makeEl = json => tryPromise( () => this.factory().make({ data: json }) );
    let createEl = el => el.create();
    let addEl = el => this.add( el );
    let handleEl = json => makeEl( json ).then( createEl ).then( addEl );
    let handleEls = () => Promise.all( els.map( handleEl ) );

    let orgIds = json.organisms || [];
    let addOrganism = id => this.toggleOrganism( id, true );
    let addOrganisms = () => Promise.all( orgIds.map( addOrganism ) );

    let metaEtcFields = ['submitted'].concat(METADATA_FIELDS);
    let updateMetadataEtc = () => this.syncher.update( _.pick(json, metaEtcFields) );

    return Promise.all([
      updateMetadataEtc(),
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

export default Document;
