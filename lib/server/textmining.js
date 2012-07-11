// var Engine = require('ql.io-engine');
// var engine = new Engine({
//     connection: 'close'
// });

// var script = "create table geocoder " +
//              "  on select get from 'http://maps.googleapis.com/maps/api/geocode/json?address={address}&sensor=true' " +
//              "     resultset 'results.geometry.location'" +
//              "select lat as lattitude, lng as longitude from geocoder where address='Mt. Everest'";

// engine.execute(script, function(emitter) {
//     emitter.on('end', function(err, res) {
//         console.log(res.body[0]);
//     });
// });

var Engine = require('ql.io-engine');

var engine = new Engine({
  connection: 'close'
});

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
