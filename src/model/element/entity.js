const Element = require('./element');
const _ = require('lodash');

const TYPE = 'entity';

const MODS = Object.freeze( (() => {
  let mods = {};

  let map = {
    UNMODIFIED: 'unmodified',
    PHOSPHORILATED: 'phosphorilated',
    METHYLATED: 'methylated',
    UBIQUINATED: 'ubiquinated'
  };

  Object.keys( map ).forEach( key => {
    let value = map[key];
    let displayValue = value[0].toUpperCase() + value.substr(1);

    mods[key] = Object.freeze({ value, displayValue });
  } );

  return mods;
})() );

const ORDERED_MODS = Object.freeze( [
  MODS.UNMODIFIED,
  MODS.PHOSPHORILATED,
  MODS.METHYLATED,
  MODS.UBIQUINATED
] );

const getModByValue = function( value ){
  let key = Object.keys( MODS ).filter( key => MODS[key].value === value );

  return MODS[key] || MODS.UNMODIFIED;
};

const DEFAULTS = Object.freeze({
  type: TYPE,
  modification: MODS.UNMODIFIED.value
});

/**
A generic biological entity
*/
class Entity extends Element {
  constructor( opts = {} ){
    let data = _.defaultsDeep( {}, opts.data, DEFAULTS );

    opts = _.assign( {}, opts, { data } );

    super( opts );

    this.on('remoteupdate', ( changes, old ) => {
      if( changes.association != null ){
        this.emit( 'associate', changes.association, old.association );
        this.emit( 'remoteassociate', changes.association, old.association );
        this.emit( 'associated', changes.association, old.association );
        this.emit( 'remoteassociated', changes.association, old.association );
      }

      if( changes.association === null && old.association != null ){
        this.emit( 'unassociate', old.association );
        this.emit( 'remoteunassociate', old.association );
        this.emit( 'unassociated', old.association );
        this.emit( 'remoteunassociated', old.association );
      }

      if( changes.modification != null ){
        let newMod = getModByValue( changes.modification ) ;
        let oldMod = getModByValue( old.modification );

        this.emit( 'modify', newMod, oldMod );
        this.emit( 'remotemodify', newMod, oldMod );
      }
    });
  }

  static type(){ return TYPE; }

  isEntity(){ return true; }

  static get MODIFICATIONS(){
    return MODS;
  }

  get MODIFICATIONS(){
    return MODS;
  }

  static get ORDERED_MODIFICATIONS(){
    return ORDERED_MODS;
  }

  get ORDERED_MODIFICATIONS(){
    return ORDERED_MODS;
  }

  modify( mod ){
    if( !_.isObject(mod) ){
      mod = getModByValue(mod);
    }

    let update = this.syncher.update('modification', mod.value);

    this.emit('modify', mod);

    return update;
  }

  modification( mod ){
    if( mod === undefined ){
      return getModByValue( this.syncher.get('modification') );
    } else {
      return this.modify( mod );
    }
  }

  associate( def ){
    let changes = {
      association: def
    };

    if( def.name != null ){
      changes.name = def.name;
    }

    if( def.type != null ){
      changes.type = def.type;
    }

    let updatePromise = this.syncher.update( changes ).then( () => {
      this.emit('associated');
    } );

    this.emit('associate', def);

    return updatePromise;
  }

  association( def ){
    if( def !== undefined ){
      return this.associate( def );
    } else {
      return this.syncher.get('association');
    }
  }

  associated(){
    return this.association() != null;
  }

  unassociate(){
    let oldDef = this.syncher.get('association');

    let update = this.syncher.update({
      association: null,
      type: TYPE
    }).then( () => {
      this.emit('unassociated');
    } );

    this.emit('unassociate', oldDef);

    return update;
  }

  json(){
    return super.json();
  }
}

module.exports = Entity;
