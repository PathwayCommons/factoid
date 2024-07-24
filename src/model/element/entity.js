import Element from './element';
import _ from 'lodash';
import { tryPromise } from '../../util';
import { ENTITY_TYPE, getNCBIEntityType } from './entity-type';
import Organism from '../organism';

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
    let oldAssoc = this.association();

    // ncbi provides typeOfGene property. Therefore, for the ncbi genes
    // obtain the entity type from typeOfGene property if it is available
    if ( def.namespace == 'ncbi' && def.typeOfGene != null ) {
      def.type = getNCBIEntityType( def.typeOfGene );
      delete def.typeOfGene;
    }

    let changes = {
      association: def
    };

    // ensure old keys deleted when a grounding is replaced
    _.keys(oldAssoc).forEach(key => {
      if (changes.association[key] == null) {
        changes.association[key] = null;
      }
    });

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

  normalized(){
    // normalized := has a name and is associated
    const name = this.syncher.get('name');
    return name && this.associated() && this.completed();
  }

  issues(){
    const items = [];
    if( !this.normalized() ){
      items.push({
        error: {
          name: 'Normalization'
        },
        message: `Entity with name "${this.name()}" is not normalized`
      });
    }
    return items;
  }

  organism(){
    const assoc = this.association();

    if( !assoc || !assoc.organism ){ return null; } //  no org

    return Organism.fromId(assoc.organism);
  }

  json(){
    return _.assign( {}, super.json(), _.pick( this.syncher.get(), _.keys(DEFAULTS) ) );
  }

  getBiopaxXref( omitDbXref ){
    let assoc = this.association();

    if ( assoc == undefined ) {
      return null;
    }

    let dbXrefs = assoc.dbXrefs;

    if ( !omitDbXref && dbXrefs && dbXrefs.length > 0 ) {
      return dbXrefs[0];
    }

    let bpXref = {
      id: assoc.id,
      db: assoc.dbName
    };

    if ( omitDbXref ) {
      bpXref.dbPrefix = assoc.dbPrefix;
    }

    return bpXref;
  }

  toBiopaxTemplate( omitDbXref ){
    let type = this.type();
    let name = this.name() || '';
    let xref = this.getBiopaxXref( omitDbXref );
    let orgId = _.get( this.association(), ['organism'] );
    let organism = null;

    if ( orgId ) {
      organism = { id: orgId, db: 'taxonomy' };
    }

    let entity = { type, name, xref, organism };

    if ( type == ENTITY_TYPE.COMPLEX ) {
      // `complex` shall be defined by components
      entity.components = this.participants().map( p => p.toBiopaxTemplate( omitDbXref ) );

    } else if ( type == ENTITY_TYPE.NAMED_COMPLEX ) {
      // `namedComplex` defined directly, e.g. UnificationXref
      entity.type = ENTITY_TYPE.COMPLEX;
      let componentXrefs = _.get( this.association(), ['componentXrefs'], null );
      if(componentXrefs) entity.componentXrefs = componentXrefs;

    } else {
      // restricted to subclasses of physical entity
      let memberXrefs = _.get( this.association(), ['memberXrefs'], null );
      if(memberXrefs) entity.memberXrefs = memberXrefs;
    }

    return entity;
  }

  toSearchTemplate(){
    let name = this.name();
    let elId = this.id();

    // entries with no name should be skipped
    if ( !name ) {
      return null;
    }

    let template = _.pick(this.association(), ['id', 'namespace', 'dbName', 'dbXrefs']);
    template.name = name;

    // the id field represents the id of association there is a need to know the
    // factoid id of element as well
    template.elId = elId;

    return template;
  }
}

export default Entity;
