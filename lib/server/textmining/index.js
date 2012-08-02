var Engine = require('ql.io-engine');
var _ = require('underscore')._;

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

function postProcessUniprotEntity( ent ){
  // post process organism
  var orgs = ent.organism.name;
  for( var j = 0; j < orgs.length; j++ ){
    var org = orgs[j];

    if( org.type === 'scientific' ){
      ent.organismName = org['$t'];
    }
  }
  ent.organismId = ent.organism.dbReference.id;
  delete ent.organism;

  // post process id
  if( ent.dbId[0] ){
    ent.dbId = ent.dbId[0];
  }
  ent.db = 'uniprot';
  ent.type = 'protein';

  if( !ent.name ){ // b/c the nice name might not be specified
    ent.name = ent.officialName;
  }

  if( _.isArray(ent.name) ){ // then only use the first one
    ent.name = ent.name[0];
  }

  var comms = ent.comment;
  for( var i = 0; i < comms.length; i++ ){
    var comm = comms[i];

    if( comm.type === 'function' ){
      ent.function = comm.text['$t'] || comm.text;
    }
  } 
  delete ent.comment;

  ent.link = 'http://www.uniprot.org/uniprot/' + ent.id;
  
  return ent;
}

// gets a list of potential entities from a query string
// NB: next(err, entities)
function getAssociatedEntitiesFromQuery( query, next ){
  // searches uniprot for entities with the query string
  // TODO limit fields returned to those that specify the entity (can be done when making UI)
  var script = "\
    select \
      accession as dbId, \
      name as officialName, \
      protein.recommendedName.fullName as fullName, \
      protein.recommendedName.shortName as name, \
      organism as organism, \
      comment as comment \
    from uniprot \
      where query = '" + query + "'; \
  ";

  engine.execute(script, function(emitter){
    emitter.on('end', function(err, res){
      var entities = res && res.body ? res.body : null;

      if( entities ){
        for( var i = 0; i < entities.length; i++ ){
          var ent = entities[i];
          postProcessUniprotEntity(ent);
        }
      }

      next(err, entities);
    });
  });
}

// getAssociatedEntitiesFromQuery('PCNA', function(err, entities){
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
function getEntityInfo( assoc, next ){
  var uniprot = assoc.dbId; // TODO assume uniprot id for now

  if( uniprot ){

    var script = "\
      select \
        accession as dbId, \
        name as officialName, \
        protein.recommendedName.fullName as fullName, \
        protein.recommendedName.shortName as name, \
        organism as organism, \
        comment as comment \
      from uniprotlookup where id = '" + uniprot + "'; \
    ";

    engine.execute(script, function(emitter) {
      emitter.on('end', function(err, res) {
        var info = res && res.body && res.body[0] ? res.body[0] : null;

        next( err, postProcessUniprotEntity(info) );
      });
    });

  } else {
    next('No uniprot ID found for getting entity info');
  }
}

// getEntityInfo({ uniprot: 'P12004', id: 'test' }, function(err, info){
//   console.log(err, info);
// });

module.exports = {
  getPotentialEntitiesFromText: getPotentialEntitiesFromText,
  getAssociatedEntitiesFromQuery: getAssociatedEntitiesFromQuery,
  getEntityInfo: getEntityInfo
};
