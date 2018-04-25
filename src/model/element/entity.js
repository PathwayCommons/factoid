const Element = require('./element');
const _ = require('lodash');

const TYPE = 'entity';

const { MODS, ORDERED_MODS, getModByValue } = require('./entity-mods');

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

  static get MODIFICATION_BY_VALUE(){
    return getModByValue;
  }

  get MODIFICATION_BY_VALUE(){
    return getModByValue;
  }

  modify( mod ){
    if( !_.isObject(mod) ){
      mod = getModByValue(mod);
    }

    let update = this.syncher.update('modification', mod.value);

    this.emit('modify', mod);
    this.emit('localmodify', mod);

    return update;
  }

  modification( mod ){
    if( mod === undefined ){
      return getModByValue( this.syncher.get('modification') );
    } else {
      return this.modify( mod );
    }
  }

  moddable(){
    return this.type() === this.TYPE.PROTEIN;
  }

  associate( def ){
    let changes = {
      association: def
    };

    if( def.type != null ){
      changes.type = def.type;
    }

    let updatePromise = this.syncher.update( changes ).then( () => {
      this.emit('associated');
      this.emit('localassociated');
    } );

    this.emit('associate', def);
    this.emit('localassociate', def);

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
      this.emit('unassociated', oldDef);
      this.emit('localunassociated', oldDef);
    } );

    this.emit('unassociate', oldDef);
    this.emit('localunassociate', oldDef);

    return update;
  }

  json(){
    return _.assign( {}, super.json(), _.pick( this.syncher.get(), _.keys(DEFAULTS) ) );
  }
}

module.exports = Entity;
