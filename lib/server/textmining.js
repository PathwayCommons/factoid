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

var pcTableScript = "\
create table pcsearch \
  on select get from 'http://www.pathwaycommons.org/pc/webservice.do?version={version}&q={query}&format=xml&cmd=search' \
    using defaults version = '2.0' \
    resultset 'search_response'; \
";

engine.execute(pcTableScript, function(emitter) {
  emitter.on('end', function(err, res) {
    console.log(res.body[0]);
  });
});

