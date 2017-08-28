let _ = require('lodash');
let Syncher = require('../syncher');
let Entity = require('./entity');
let Element = require('./element');
let Protein = require('./protein');
let Interaction = require('./interaction');
let Promise = require('bluebird');

/**
A factory to
  - get existing (i.e. saved in the DB) biological elements, and
  - make new elements.

The factory saves in its `config` the objects necessary to read and write to the
database, so UI code need not concern itself with that when creating biological
elements.

In essence, it automates `Syncher` setup and creating objects of the correct
type based on the data returned by the DB.
*/
class ElementFactory {
  constructor( opts ){
    this.config = _.defaults( {}, opts, {
      types: [
        Entity,
        Protein,
        Interaction
      ],
      defaultType: Entity,
      data: {}
    } );
  }

  getType( typeStr ){
    return this.config.types.find( t => t.type() === typeStr );
  }

  isTypeSupported( typeStr ){
    return this.getType( typeStr ) != null;
  }

  set( opts ){
    _.assign( this.config, _.pick( opts, this.configFields() ) );
    _.assign( this.config.data, _.get( opts, 'data' ) );
  }

  configFields(){
    return ['rethink', 'table', 'conn', 'socket', 'cache'];
  }

  defaultTypeOptions(){
    return _.pick( this.config, this.configFields() );
  }

  defaultData(){
    return this.config.data;
  }

  fillOptions( opts ){
    let o;

    o = _.assign( {}, this.defaultTypeOptions(), opts );
    o.data = _.assign( {}, this.defaultData(), _.get( opts, 'data' ) );

    return o;
  }

  make( opts ){
    if( opts instanceof Element ){ return opts; }

    opts = this.fillOptions( opts );

    let Type = this.getType( opts.data.type ) || this.config.defaultType;

    return new Type( opts );
  }

  load( opts ){
    opts = this.fillOptions( opts );

    // just treat as generic syncher json obj b/c we don't know the type yet
    let genObj = new Syncher( opts );

    return Promise.try( () => {
      return genObj.load();
    } ).then( () => { // get the proper object type
      let Type = this.getType( genObj.get('type') );
      let ele = new Type( _.assign( {}, opts, { data: genObj.get() } ) );

      // we manually filled the ele from the prior generic json load, so just mark as
      // filled instead of .load()ing twice
      ele.syncher.filled = true;

      // similarly, we need to do any post-load steps because we didn't call Type.load()
      return ele.postload().then( () => ele );
    } );
  }
}

module.exports = ElementFactory;
