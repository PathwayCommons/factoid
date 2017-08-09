let { fill, getId, error, assertFieldsDefined } = require('../util');
let Promise = require('bluebird');
let _ = require('lodash');

/**
A class that keeps a set of populated elements

- Synched via JSON with the specified `syncher` and `emitter`.
- Can be used to piggy-back on the existing synch and events of another object (e.g. Interaction).
- Requires `entries` be defined as an array in `syncher` to store the element IDs in the set

Each entry is `{ id, group }` where
- `id` is the ele id
- `group` is a string to group/classify the ele in the set
*/
class ElementSet {

  constructor( opts = {} ){
    assertFieldsDefined( opts, ['emitter', 'syncher', 'cache'] );

    fill({
      obj: this,
      from: opts,
      defs: {
        cache: null,
        emitter: null,
        syncher: null
      }
    });

    if( !this.syncher.get('entries') ){
      throw error('Can not store elements without `entries` defined for `syncher` in `ElementSet`');
    }

    this.elementsById = new Map();

    this.syncher.on('remoteupdate', ( changes, old ) => {
      if( changes.entries ){
        let nonNil = x => !_.isNil(x);
        let get = id => this.elementsById.get( id );
        let load = id => this.cache.load( id );
        let remove = id => this.elementsById.delete( id );
        let add = ele => this.elementsById.set( getId( ele ), ele );
        let getEntryId = en => en.id;

        let addedEntries = _.differenceBy( changes.entries, old.entries, getEntryId );
        let removedEntries = _.differenceBy( old.entries, changes.entries, getEntryId );

        let fillEntry = entry => load( getId( entry ) ).then( ele => ({ ele, entry }) );
        let fillEntries = entries => Promise.all( entries.map( fillEntry ) );

        // removed can be filled synchronously
        let filledRemoved = removedEntries.map( entry => {
          let ele = get( entry.id );

          if( ele ){
            return { entry, ele };
          } else {
            return null;
          }
        } ).filter( nonNil );

        Promise.try( () => fillEntries( addedEntries ) ).then( filledAdded => {
          filledAdded.forEach( f => {
            add( f.ele, f.entry );

            this.emitter.emit( 'add', f.ele, f.entry.group );
            this.emitter.emit( 'remoteadd', f.ele, f.entry.group );
          } );

          filledRemoved.forEach( f => {
            remove( f.ele, f.entry );

            this.emitter.emit( 'remove', f.ele, f.entry.group );
            this.emitter.emit( 'remoteremove', f.ele, f.entry.group );
          } );
        } );
      }
    });

    this.emitter.on('add', ele => {
      if( this.syncher.live && !ele.live() ){
        ele.synch( true );
      }
    });
  }

  load(){
    let loadEle = entry => this.cache.load( entry.id );
    let add = ele => this.elementsById.set( ele.id(), ele );
    let fillInEntry = entry => loadEle( entry ).then( add );

    return Promise.all( this.syncher.get('entries').map( fillInEntry ) );
  }

  synch( enable ){
    return Promise.all([ this.elements().map( el => el.synch( enable ) ) ]);
  }

  add( ele, opts = {} ){
    if( this.has( ele ) ){ return Promise.resolve(); } // no duplicates

    let id = getId( ele );
    let { silent, group } = opts;

    this.elementsById.set( id, ele );

    let entry = { id };

    if( group ){ // doesn't make sense to store undefined in db
      entry.group = group;
    }

    let updatePromise = this.syncher.push({ entries: entry }, { silent });

    if( !silent ){
      this.emitter.emit( 'add', ele, group );
    }

    return updatePromise;
  }

  remove( ele, opts = {} ){
    if( !this.has( ele ) ){ return Promise.resolve(); } // can't remove nonexistant

    let id = getId( ele );
    let { silent } = opts;

    if( id === ele ){
      ele = this.get( id ); // we need to make sure to emit the proper ele obj later
    }

    this.elementsById.delete( id );

    let entry = this.syncher.get('entries').find( en => en.id === id );
    let group = entry.group;

    let updatePromise = this.syncher.pullById({ entries: id }, { silent });

    if( !silent ){
      this.emitter.emit( 'remove', ele, group );
    }

    return updatePromise;
  }

  // replace ele with new ele obj (representing the same ele)
  // - assumes the element is just of another (sub)type, e.g. generic element => protein
  // - synchronous op
  replace( oldEle, newEle, opts = {} ){
    if( !this.has( oldEle ) ){ return; } // can't replace nonexistant

    let id = getId( oldEle );
    let { silent } = opts;

    this.elementsById.set( id, newEle );

    if( !silent ){
      this.emitter.emit( 'replace', oldEle, newEle );
    }

    return Promise.resolve();
  }

  has( ele ){
    return this.elementsById.has( getId(ele) );
  }

  get( ele ){
    return this.elementsById.get( getId(ele) );
  }

  size(){
    return this.elementsById.size;
  }

  elements( group ){
    let matches = en => group == null || en.group == group;
    let getEle = entry => this.get( entry.id );

    return this.syncher.get('entries').filter( matches ).map( getEle );
  }

  group( ele ){
    if( !this.has( ele ) ){ return undefined; }

    let id = getId( ele );

    return this.syncher.get('entries').filter( ent => ent.id === id )[0].group;
  }

  regroup( ele, opts ){
    if( !this.has( ele ) ){ return Promise.resolve(); } // can't remove nonexistant

    let id = getId( ele );
    let { silent, group } = opts;

    if( group === undefined ){ // db should store null, not undefined
      group = null;
    }

    let updatePromise = this.syncher.mergeById({ entries: { id, group } }, { silent });

    if( !silent ){
      this.emitter.emit( 'regroup', ele, group );
    }

    return updatePromise;
  }
}

module.exports = ElementSet;
