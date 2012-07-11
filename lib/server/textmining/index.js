var Engine = require('ql.io-engine');

var tablesDir = __dirname + '/tables'; console.log(tablesDir);
var engine = new Engine({
  connection: 'close',
  tables: tablesDir
});

// TODO merge this call with a call to uniprot so that mined entities are already associated

// gets entities from text
// NB: next(err, entities)
function getEntitiesFromText( text, next ){

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

getEntitiesFromText('PCNA and RAD51', function(err, entities){
  console.log(err, entities);
});

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
  getEntitiesFromText: getEntitiesFromText,
  getEntityInfo: getEntityInfo
};

// var Engine = require('ql.io-engine');

// var engine = new Engine({
//   connection: 'close'
// });

// var script = "\
// create table pcsearch \
//   on select get from 'http://www.pathwaycommons.org/pc/webservice.do?version={version}&q={query}&format=xml&cmd=search' \
//     using defaults version = '2.0' \
//     resultset 'search_response'; \
// \
//   select * from pcsearch where query = 'PCNA';\
// ";

// var script = "\
// create table tm \
//   on select post to 'http://factoid.bioinfo.cnio.es/TextMining/gene_mention_recognition' \
//   using defaults _format = 'json', method = 'abner', normalize = 'true' \
//   using text {query}; \
//  \
//   select * from tm where query = 'RAD51 and PCNA'; \
// ";

// var script = 'select * from cnio';

// engine.execute(script, function(emitter) {
//   emitter.on('end', function(err, res) {
//     console.log(res);
//   });
// });
