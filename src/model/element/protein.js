const Entity = require('./entity');
const Organism = require('../organism');
const _ = require('lodash');

const TYPE = 'protein';

const DEFAULTS = Object.freeze({
  type: TYPE
});

class Protein extends Entity {
  constructor( opts = {} ){
    let data = _.defaultsDeep( {}, opts.data, DEFAULTS );

    opts = _.assign( {}, opts, { data } );

    super( opts );
  }

  static type(){ return TYPE; }

  proteinNames(){
    return _.get( this.association(), 'proteinNames' );
  }

  geneNames(){
    return _.get( this.association(), 'geneNames' );
  }

  organismId(){
    return _.get( this.association(), 'organism' );
  }

  organism(){
    return Organism.fromId( this.organismId() );
  }

  json(){
    return _.assign( {}, super.json(), {
      proteinNames: this.proteinNames(),
      geneNames: this.geneNames(),
      organism: this.organism().json()
    } );
  }
}

module.exports = Protein;
