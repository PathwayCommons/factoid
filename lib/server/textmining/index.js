var Engine = require('ql.io-engine');

var tablesDir = __dirname + '/tables';
var engine = new Engine({
  connection: 'close',
  tables: tablesDir
});

function getMatchesFromText( text, next ){
  // escape single quote characters, since we use them to enclose the text in the query
  text = text.replace(/'/g, "\\'");

  var script = "\
    select * from cnio \
      where text = '" + text + "'; \
  ";

  engine.execute(script, function(emitter) {
    emitter.on('end', function(err, res) {
      var entities = res && res.body ? res.body : null;
      next(err, entities);
    });
  });
}

// getMatchesFromText('PCNA and RAD51', function(err, matches){
//   console.log(err, matches);
// });

// gets a list of potential entities from a query string
// NB: next(err, entities)
function getPotentialEntitiesFromQuery( query, options, next ){
  if( !next ){ // then options wasn't really specified
    next = options;
    options = {};
  }

  // searches uniprot for entities with the query string
  // TODO limit fields returned to those that specify the entity (can be done when making UI)
  var script = "\
    select \
      accession as id, \
      name as officialName, \
      protein.recommendedName.fullName as fullName, \
      protein.recommendedName.shortName as name, \
      organism.name as organism, \
      comment as comment \
    from uniprot \
      where query = '" + query + "'; \
  ";

  engine.execute(script, function(emitter) {
    emitter.on('end', function(err, res) {
      var entities = res && res.body ? res.body : null;

      // TODO may need some post-processing here

      next(err, entities);
    });
  });
}

// getPotentialEntitiesFromQuery('PCNA', function(err, entities){
//   console.dir(entities[1]);
// });

// gets entities from text
// NB: next(err, entities)
function getPotentialEntitiesFromText( text, next ){
  getMatchesFromText(text, function(err, matches){ // get the matches
    if( err ){ // then we can't do anything
      next(err);

    } else { // then get entities for the matches
      var entities = [];

      for( var i = 0; i < matches.length; i++ ){
        var match = matches[i];

        entities.push({
          name: match.literal,
          type: 'entity'
        });
      }

      next(null, entities);
    }
  });
}

// getPotentialEntitiesFromText('PCNA and RAD51', function(err, entities){
//   debugger;
//   console.log(err, entities);
// });

// gets entity info as json based on associated id
// NB: next(err, info)
function getEntityInfo( entity, next ){
  var uniprot = entity.uniprot;

  if( uniprot ){

    var script = "\
      select * from uniprotlookup where id = '" + uniprot + "'; \
    ";

    engine.execute(script, function(emitter) {
      emitter.on('end', function(err, res) {
        var info = res && res.body ? res.body : null;
        next(err, info);
      });
    });

  } else {
    next('No uniprot ID found for entity with ID ' + entity.id);
  }
}

// getEntityInfo({ uniprot: 'P12004', id: 'test' }, function(err, info){
//   console.log(err, info);
// });

module.exports = {
  getPotentialEntitiesFromText: getPotentialEntitiesFromText,
  getEntityInfo: getEntityInfo
};
