var http = require('http')
  , textmining = require('./textmining')
  , url = require('url')
;

// TODO define http entry points for textmining
module.exports = function( expressApp ){

  // TODO remove this when the textmining from cnio is revised
  expressApp.get('/textminingproxy', function(req, res, next){

    var query = url.parse(req.url, true).query;
    var text = 'text=' + query.text;

    var preq = http.request({
      headers: {
        'content-length': text.length
      },
      host: 'factoid.bioinfo.cnio.es',
      port: 80,
      path: '/TextMining/gene_mention_recognition?_format=json&normalize=true',
      method: 'POST'
    }, function(pres) {
      pres.setEncoding('utf8');
      pres.on('data', function (chunk) {
        var entityMap = JSON.parse( chunk );
        var entities = [];

        for( var i in entityMap ){
          var entity = entityMap[i];
          entities.push( entity );
        }

        res.send( entities );
      });
    });

    preq.on('error', function(e) {
      //console.log('problem with request: ' + e.message);
    });

    // write data to request body
    preq.write(text);
    preq.end();

  });

};