import Entity from './entity';
import { ENTITY_TYPE } from './entity-type';
import _ from 'lodash';
import ElementSet from '../element-set';
import { assertFieldsDefined, tryPromise } from '../../util';

const TYPE = ENTITY_TYPE.COMPLEX;

const DEFAULTS = Object.freeze({
  type: TYPE,
  entries: [] // used by elementSet
});

/**
A compound entity that contains [2,N] simple entities
*/
class Complex extends Entity {
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
  }

  static type(){ return TYPE; }

  load( setup = _.noop ){
    return super.load( () => {
      return this.postload().then( setup );
    } );
  }

  isComplex(){
    return true;
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

  name( newName ){
    if( newName !== undefined ){
      return this.rename( newName );
    } else {
      let name;
      if( this.named() ){
        name = this.syncher.get('name');
      } else {
        const participantNames = this.participants().map( p => p.name() ).join(':');
        name = `Complex (${participantNames})`;
      }
      return name;
    }
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

  json(){
    return _.assign( {}, super.json(), _.pick( this.syncher.get(), _.keys(DEFAULTS) ) );
  }
}

// forward common calls to the element set
['has', 'get', 'size', 'elements'].forEach( name => {
  Complex.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args );
  };
} );

// forward promise-returning calls to the element set
['add', 'remove'].forEach( name => {
  Complex.prototype[ name ] = function( ...args ){
    return this.elementSet[ name ]( ...args ).then( () => this ); // resolve self
  };
} );

export default Complex;
