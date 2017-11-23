const constName = name => (name || '').toUpperCase().replace(/\s/g, '_');

const nameMatches = ( n1, n2 ) => {
  if( n1 === n2 ){ return true; }

  return constName( n1 ) === constName( n2 );
};

const organisms = [];

class Organism {
  constructor( id, species, icon ){
    this.spec = { id, species, icon };
  }

  id(){
    return this.spec.id;
  }

  name(){
    return this.spec.species;
  }

  icon(){
    return this.spec.icon;
  }

  json(){
    return {
      name: this.name(),
      id: this.id()
    };
  }

  static fromName( name ){
    return organisms.find( org => nameMatches( org.name(), name ) );
  }

  static fromId( id ){
    return organisms.find( org => org.id() === id ) || Organism.OTHER;
  }

  static get ALL(){ return organisms; }

  static get DEFAULT(){ return Organism.HOMO_SAPIENS; }
}

[
  new Organism(9606, 'Homo sapiens', 'bio-human'),
  new Organism(10090, 'Mus musculus', 'bio-mouse'),
  new Organism(4932, 'Saccharomyces cerevisiae', 'bio-yeast'),
  new Organism(7227, 'Drosophila melanogaster', 'bio-fly'),
  new Organism(83333, 'Escherichia coli', 'bio-cells'),
  new Organism(6239, 'Caenorhabditis elegans', 'bio-worm'),
  new Organism(3702, 'Arabidopsis thaliana', 'bio-plant'),
  new Organism(10116, 'Rattus norvegicus', 'bio-rat'),
  new Organism(7955, 'Danio rerio', 'bio-fish')

].forEach( org => {
  organisms.push( org );

  Organism[ constName( org.name() ) ] = org;
} );

Organism.OTHER = new Organism(-1, 'Other', 'organism-other');


module.exports = Organism;
