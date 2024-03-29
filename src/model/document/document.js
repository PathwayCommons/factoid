import _ from 'lodash';
import Syncher from '../syncher';
import EventEmitterMixin from '../event-emitter-mixin';
import ElementSet from '../element-set';
import ElementCache from '../element-cache';
import ElementFactory from '../element';
import { assertOneOfFieldsDefined, mixin, getId, makeCyEles, getCyLayoutOpts, isNonNil, tryPromise } from '../../util';
import Cytoscape from 'cytoscape';
import { TWITTER_ACCOUNT_NAME } from '../../config';
import { getPubmedCitation } from '../../util/pubmed';
import { isServer } from '../../util/';
import Organism from '../organism';

const DEFAULTS = Object.freeze({
  // data
  entries: [], // used by elementSet
  organisms: [], // list of ids
  verified: false
});

const METADATA_FIELDS = ['provided', 'correspondence', 'status', 'verified', 'authorProfiles', 'caption' ];
const DESERIAL_METADATA_FIELDS = _.concat(METADATA_FIELDS, ['article']);
const READONLY_METADATA_FIELDS = _.difference( METADATA_FIELDS, ['provided', 'correspondence'] );
const DOCUMENT_STATUS_FIELDS = Object.freeze({
  INITIATED: 'initiated',
  SUBMITTED: 'submitted',
  PUBLIC: 'public',
  TRASHED: 'trashed'
});
const DOCUMENT_SOURCE_FIELDS = Object.freeze({
  ADMIN: 'admin',
  PC: 'pc'
});

// Get the UNIX time (seconds since epoch) for a date or now
const MILLISECONDS_PER_SECOND = 1000;
const unixTimeFromDate = date => {
  let msSinceEpoch = Date.now();
  if( date ){
    msSinceEpoch = ( new Date( date ) ).getTime();
  }
  return Math.floor( msSinceEpoch / MILLISECONDS_PER_SECOND );
};
const getDateSafe = value => {
  let date = value;
  if( typeof( value ) == 'number' ) {
    date = new Date( value * MILLISECONDS_PER_SECOND );
  } else if( typeof( value ) == 'string' ) {
    date = new Date( value );
  }
  return date;
};

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

      if( changes.relatedPapers ){
        this.emit('relatedpapers', changes.relatedPapers);
        this.emit('remoterelatedpapers', changes.relatedPapers);
      }
    });

    if( isServer ) this.syncher.on( 'create', () => {
      const unixTime = unixTimeFromDate();
      this.rwMeta( 'createdDate', unixTime );
      this.rwMeta( 'lastEditedDate', unixTime );
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

  tweetMetadata(){
    return this.syncher.get('tweet');
  }

  hasTweet(){
    return this.tweetMetadata() != null;
  }

  setTweetMetadata(tweet){
    this.syncher.update('tweet', tweet);
  }

  tweetUrl(){
    if( !this.hasTweet() ){ return null; }

    const tweet = this.tweetMetadata();

    return `https://twitter.com/${TWITTER_ACCOUNT_NAME}/status/${tweet.id_str}`;
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

  caption(newVal) {
    return this.rwMeta('caption', newVal);
  }

  provided(newVal){
    const provided = this.rwMeta('provided');
    return newVal ? this.rwMeta('provided', _.merge( provided, newVal )): provided;
  }

  authorProfiles(newVal){
    return this.rwMeta('authorProfiles', newVal);
  }

  article(newVal){
    return this.rwMeta('article', newVal);
  }

  issues(newVal){
    const issues = this.rwMeta('issues');
    return newVal ? this.rwMeta('issues', _.merge( issues, newVal )): issues;
  }

  correspondence(newVal){
    return this.rwMeta('correspondence', newVal);
  }

  citation(){
    return getPubmedCitation( this.article() );
  }

  createdDate(){
    return getDateSafe( this.rwMeta('createdDate') );
  }

  lastEditedDate(){
    return getDateSafe( this.rwMeta('lastEditedDate') );
  }

  updateLastEditedDate(){
    return this.rwMeta('lastEditedDate', unixTimeFromDate());
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
  organismCounts(excludedEnt){
    let cnt = new Map(); // org => mention count
    let addToCount = org => cnt.set( org, !cnt.has(org) ? 1 : cnt.get(org) + 1 );
    let entIsAssocd = ent => ent.associated();
    let entIsNotExcluded = ent => excludedEnt == null || !ent.same(excludedEnt);
    let getOrgIdForEnt = ent => _.get( ent.association(), ['organism'] );

    this.toggledOrganisms().forEach( addToCount );

    (
      this.entities()
      .filter( entIsAssocd )
      .filter( entIsNotExcluded )
      .map( getOrgIdForEnt )
      .filter( isNonNil ) // may be an entity w/o org
      .forEach( addToCount )
    );

    return cnt;
  }

  organismCountsJson(excludedEnt){
    let json = {};

    for( let [org, count] of this.organismCounts(excludedEnt) ){
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

  commonOrganism(){
    const orgs = this.organisms();
    const counts = this.organismCounts();
    const getCount = org => counts.get(org) || 0;
    const sortedOrgs = _.sortBy(orgs, o => -getCount(o));

    if( sortedOrgs.length === 0 ){ return null; }

    return Organism.fromId(sortedOrgs[0]);
  }

  irregularOrganismEntities(){
    const comOrg = this.commonOrganism();

    const isIrreg = ent => {
      const entOrg = ent.organism();

      if( entOrg == null ){ return false; } // e.g. chemical

      return !entOrg.same(comOrg);
    };

    if( comOrg == null ){ return []; } // no common org => no irreg ents

    return this.entities().filter(isIrreg);
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

  relatedPapers( papersData ){
    if( papersData ){
      let p = this.syncher.update({ 'relatedPapers': papersData });
      this.emit( 'relatedpapers', papersData );
      return p;
    }
    else if( !papersData ){
      return this.syncher.get( 'relatedPapers' );
    }
  }

  referencedPapers( papersData ){
    if( papersData ){
      let p = this.syncher.update({ 'referencedPapers': papersData });
      this.emit( 'referencedPapers', papersData );
      return p;
    }
    else if( !papersData ){
      return this.syncher.get( 'referencedPapers' );
    }
  }

  relatedPapersNotified(newVal){
    return !!this.rwMeta('relatedPapersNotified', newVal);
  }

  status( field ){
    if( field && _.includes( _.values( DOCUMENT_STATUS_FIELDS ), field ) ){
      let p = this.syncher.update({ 'status': field });
      this.emit( 'status', field );
      return p;

    } else if( !field ){
      return this.syncher.get( 'status' );
    }
  }

  source( field ){
    if( field && _.includes( _.values( DOCUMENT_SOURCE_FIELDS ), field ) ){
      let p = this.syncher.update({ 'source': field });
      this.emit( 'source', field );
      return p;

    } else if( !field ){
      return this.syncher.get( 'source' );
    }
  }

  static statusFields(){ return DOCUMENT_STATUS_FIELDS; }
  initiate(){ return this.status( DOCUMENT_STATUS_FIELDS.INITIATED ); }
  initiated(){ return this.status() === DOCUMENT_STATUS_FIELDS.INITIATED ? true : false; }
  submit(){ return this.status( DOCUMENT_STATUS_FIELDS.SUBMITTED ); }
  submitted(){ return this.status() === DOCUMENT_STATUS_FIELDS.SUBMITTED ? true : false; }
  makePublic(){ return this.status( DOCUMENT_STATUS_FIELDS.PUBLIC ); }
  isPublic(){ return this.status() === DOCUMENT_STATUS_FIELDS.PUBLIC ? true : false; }
  trash(){ return this.status( DOCUMENT_STATUS_FIELDS.TRASHED ); }
  trashed(){ return this.status() === DOCUMENT_STATUS_FIELDS.TRASHED ? true : false; }

  static sourceFields(){ return DOCUMENT_SOURCE_FIELDS; }
  fromAdmin(){ return this.source() === DOCUMENT_SOURCE_FIELDS.ADMIN; }
  fromPc(){ return this.source() === DOCUMENT_SOURCE_FIELDS.PC; }
  setAsAdminDoc(){ return this.source( DOCUMENT_SOURCE_FIELDS.ADMIN ); }
  setAsPcDoc(){ return this.source( DOCUMENT_SOURCE_FIELDS.PC ); }

  verified(newVal){
    return this.rwMeta('verified', newVal);
  }

  json(){
    let toJson = obj => obj.json();

    return _.assign({
      id: this.id(),
      secret: this.secret(),
      organisms: this.organisms(),
      elements: this.elements().map( toJson ),
      publicUrl: this.publicUrl(),
      privateUrl: this.privateUrl(),
      citation: this.citation(),
      text: this.toText(),
      createdDate: this.createdDate(),
      lastEditedDate: this.lastEditedDate(),
    }, _.pick(this.syncher.get(), this.syncher.hasCorrectSecret() ? METADATA_FIELDS: READONLY_METADATA_FIELDS  ));
  }

  toBiopaxIntnTemplates( omitDbXref ){
    let interactions = this.interactions();
    let templates = [];
    let getElById = id => this.elementSet.get(id);
    let transform = el => {
      let parentId = el.getParentId();

      if ( parentId == null ) {
        return el;
      }

      return getElById( parentId );
    };

    interactions.forEach( intn => {
      let template = intn.toBiopaxTemplate( transform, omitDbXref );
      if (template != null){
        templates.push(template);
      }
    } );

    return templates;
  }

  toBiopaxTemplate( omitDbXref ){
    const toPublication = citation => {
      let { pmid, doi, title, reference: source, authors: { authorList }, ISODate } = citation;
      let db, id;
      if ( pmid ){
        db = 'pmid';
        id = pmid;
      } else if( doi ) {
        db = 'crossref';
        id = doi;
      }
      const publication = { db, id, title, source };
      if( ISODate ) {
        const date = new Date( ISODate );
        const year = date.getFullYear();
        publication.year = year;
      }
      if( !_.isEmpty( authorList ) ) {
        const author = authorList.map( ({ name }) => name );
        publication.author = author;
      }
      return publication;
    };
    let interactions = this.toBiopaxIntnTemplates( omitDbXref );
    let citation = this.citation();
    let { pmid, doi, title } = citation;
    const hasArticleId = pmid != null || doi != null;
    let pathwayId = this.id();

    let template = { interactions, pathwayName: title, pathwayId };
    if ( hasArticleId ) {
      const publication = toPublication( citation );
      template.publication = publication;
    }

    return template;
  }

  toSearchTemplates(){
    let interactions = this.interactions();
    let entities = this.entities();
    const getTemplates = els => els.map( e => e.toSearchTemplate() ).filter( t => t != null );

    let templates = { intns: getTemplates( interactions ), entities: getTemplates( entities ) };
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
    let updateMetadataEtc = () => this.syncher.update( _.pick(json, DESERIAL_METADATA_FIELDS) );

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
