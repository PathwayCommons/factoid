import Element from './element';
import _ from 'lodash';
import ElementSet from '../element-set';
import { assertFieldsDefined, tryPromise } from '../../util';

import { INTERACTION_TYPE, getIntnTypeByVal } from './interaction-type/enum';
import { PARTICIPANT_TYPE, getPptTypeByVal } from './participant-type';

const TYPE = 'interaction';

const makeAssociation = ( type, intn ) => {
  let Type = _.isString(type) ? getIntnTypeByVal(type) : type;

  // fall back on default type if garbage data is passed as `type` arg
  if( Type == null || type == null ){
    return INTERACTION_TYPE.INTERACTION.value;
  }

  return new Type( intn );
};

const DEFAULTS = Object.freeze({
  type: TYPE,
  association: INTERACTION_TYPE.INTERACTION.value,
  novel: false,
  entries: [] // used by elementSet
});

/**
A biological interaction between [0, N] elements

It is important to specify a `cache` on an interaction.  This indicates the cache
from which the elements are loaded/taken.  For example, an interaction commonly
has a cache whose source is a `Document`.  This makes it so that when an
interaction is loaded, along with its participants, the participants aren't
doubly loaded.  The document and the interaction guarantee that they share the
same reference for associated elements, by virtue of the cache.
*/
class Interaction extends Element {
  constructor( opts = {} ){
    let data = _.defaultsDeep( {}, opts.data, DEFAULTS );

    opts = _.assign( {}, opts, { data } );

    super( opts );

    assertFieldsDefined( opts, ['cache'] );

    this.elementSet = new ElementSet({
      syncher: this.syncher,
      emitter: this.emitter,
      cache: opts.cache
    });

    this.on('remoteregroup', ( el, newGroup, oldGroup ) => {
      let oldType = getPptTypeByVal( oldGroup );
      let newType = getPptTypeByVal( newGroup );

      this.emit( 'retype', el, newType, oldType );
      this.emit( 'remoteretype', el, newType, oldType );
    });

    this.on('remoteupdate', ( changes, old ) => {
      if( changes.association != null ){
        let oldType = makeAssociation( old.association, this );
        let newType = makeAssociation( changes.association, this );

        this.emit( 'associate', newType, oldType );
        this.emit( 'remoteassociate', newType, oldType );
      }
    });
  }

  static type(){ return TYPE; }

  isInteraction(){ return true; }

  load( setup = _.noop ){
    return super.load( () => {
      return this.postload().then( setup );
    } );
  }

  postload(){
    return this.elementSet.load();
  }

  create( setup = _.noop ){
    return super.create( () => {
      return this.postcreate().then( setup );
    } );
  }

  postcreate(){
    return this.elementSet.create();
  }

  synch( enable ){
    return tryPromise( () => {
      return super.synch( enable );
    } ).then( () => {
      return this.elementSet.synch( enable );
    } );
  }

  participants(){
    return this.elements();
  }

  addParticipant( ele, opts ){
    return this.add( ele, opts );
  }

  removeParticipant( ele, opts ){
    return this.remove( ele, opts );
  }

  getParticipantType( ele ){
    return getPptTypeByVal( this.elementSet.group( ele ) );
  }

  setParticipantType( ele, type ){
    let oldType = this.getParticipantType( ele );
    let typeVal;

    if( type === null || _.isString(type) ){
      typeVal = type;
    } else {
      typeVal = type.value;
    }

    // undirected means no ppt has a type
    if( typeVal === PARTICIPANT_TYPE.UNSIGNED.value ){
      typeVal = null;
    }

    type = getPptTypeByVal( typeVal );

    if( _.isString( ele ) ){ // in case id passed
      ele = this.get( ele );
    }

    let updatePromise = this.elementSet.regroup( ele, { group: typeVal } );

    this.emit( 'retype', ele, type, oldType );
    this.emit( 'localretype', ele, type, oldType );

    return updatePromise;
  }

  retypeParticipant( ele, type ){
    return this.setParticipantType( ele, type );
  }

  participantType( ele, type ){
    if( type === undefined ){
      return this.getParticipantType( ele );
    } else {
      return this.setParticipantType( ele, type );
    }
  }

  participantsOf( type, condition ){
    let typeVal = _.isString(type) ? type : type.value;

    return this.participants().filter( ppt => {
      let t = this.getParticipantType( ppt );

      return condition( t.value, typeVal );
    } );
  }

  participantsOfType( type ){
    return this.participantsOf( type, (t1, t2) => t1 === t2 );
  }

  participantsNotOfType( type ){
    return this.participantsOf( type, (t1, t2) => t1 !== t2 );
  }

  setNovel( novel ) {
    let currVal = this.isNovel();
    if ( currVal == novel ) {
      return Promise.resolve();
    }

    let update = this.update({
      novel
    });

    this.emit( 'novel', novel, currVal );

    return update;
  }

  associate( interactionType ){
    let type = makeAssociation( interactionType, this );
    let oldType = makeAssociation( this.syncher.get('association'), this );

    let update = this.update({
      association: type.value, // could be changed to `association: { type, ... }` if we need to store more info
      type: type.value
    });

    this.emit( 'associate', type, oldType );
    this.emit( 'localassociate', type, oldType );

    return update;
  }

  unassociate(){
    let oldType = makeAssociation( this.syncher.get('association'), this );

    let update = this.syncher.update({
      association: INTERACTION_TYPE.INTERACTION.value,
      type: TYPE
    }).then( () => {
      this.emit('unassociated', oldType);
      this.emit('localunassociated', oldType);
    } );

    this.emit('unassociate', oldType);
    this.emit('localunassociate', oldType);

    return update;
  }

  association( interactionType ){
    if( interactionType === undefined ){
      return makeAssociation( this.syncher.get('association'), this );
    } else {
      return this.associate( interactionType );
    }
  }

  associated(){
    return this.syncher.get('association') != null;
  }

  isNovel(){
    return this.syncher.get('novel') == true;
  }

  json(){
    return _.assign( {}, super.json(), _.pick( this.syncher.get(), _.keys(DEFAULTS) ) );
  }

  toBiopaxTemplate( transform, omitDbXref ){
    return this.association().toBiopaxTemplate( transform, omitDbXref );
  }

  toSearchTemplate(){
    return this.association().toSearchTemplate();
  }

  toString(){
    return this.association().toString();
  }
}

// forward common calls to the element set
['has', 'get', 'size', 'elements'].forEach( name => {
  Interaction.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args );
  };
} );

// forward promise-returning calls to the element set
['add', 'remove'].forEach( name => {
  Interaction.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args ).then( () => this ); // resolve self
  };
} );

export default Interaction;
