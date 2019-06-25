import Element from './element';
import _ from 'lodash';
import { tryPromise } from '../../util';

const TYPE = 'entity';

const DEFAULTS = Object.freeze({
  type: TYPE,
  association: null
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

      if ( changes.parentId !== undefined ) {
        this.emit( 'updateparent', changes.parentId, old.parentId );
        this.emit( 'remoteupdateparent', changes.parentId, old.parentId );
        this.emit( 'updatedparent', changes.parentId, old.parentId );
        this.emit( 'remoteupdatedparent', changes.parentId, old.parentId );
      }
    });
  }

  static type(){ return TYPE; }

  isEntity(){ return true; }

  updateParent( newParent, oldParent, doNotAdd ) {
    let getId = el => el != null ? el.id() : null;
    let newParentId = getId( newParent );
    let oldParentId = getId( oldParent );

    if ( newParentId == oldParentId ) {
      return Promise.resolve();
    }

    const removeFromOldParent = () => {
      if ( oldParent != null ) {
        return oldParent.remove( this );
      }

      return Promise.resolve();
    };

    const addToNewParent = () => {
      if ( newParent != null && !doNotAdd ) {
        return newParent.add( this );
      }

      return Promise.resolve();
    };

    const updateSyncher = () => {
      let changes = {
        parentId: newParentId
      };

      let updatePromise = this.syncher.update( changes ).then( () => {
        this.emit('updatedparent', newParentId, oldParentId);
        this.emit('localupdatedparent', newParentId, oldParentId);
      } );

      this.emit('updateparent');
      this.emit('localupdateparent');

      return updatePromise;
    };

    return tryPromise( addToNewParent )
      .then( removeFromOldParent )
      .then( updateSyncher );
  }

  getParentId(){
    return this.syncher.get('parentId') || null;
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

  getBiopaxXref(){
    let assoc = this.association();

    if ( assoc == undefined ) {
      return null;
    }

    return {
      id: assoc.id,
      db: assoc.namespace
    };
  }

  toBiopaxTemplate(){
    let type = this.type();
    let name = this.name() || '';
    let xref = this.getBiopaxXref();

    return { type, name, xref };
  }
}

export default Entity;
