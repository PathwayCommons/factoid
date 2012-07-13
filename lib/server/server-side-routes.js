var http = require('http')
  , textmining = require('./textmining')
  , url = require('url')
;

// TODO define http entry points for textmining
module.exports = function( expressApp, io ){
  var app = expressApp;

  // TODO remove this when the textmining from cnio is revised
  app.get('/cnioproxy', function(req, res, next){

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

  // these listeners receive events from the client when the client code calls
  // functions in window.textmining
  //
  // the actual textmining functions are then called (on the server side) and
  // the result is emitted back to the client side
  //
  // rationale: it's faster and a much nicer api if the client code can call
  // the functions as if they were being called directly
  var api = io
    .of('/tmapi')
    .on('connection', function(socket){
    
      // define all the tmapi (textmining api) socket functions here
      
      // TODO we can probably make this more generic s.t. whatever's defined
      // in the textmining object gets listeners here

      socket
        .on('getPotentialEntitiesFromText', function(id, text){
          textmining.getPotentialEntitiesFromText(text, function(err, entities){
            socket.emit('getPotentialEntitiesFromText', id, err, entities);
          });
        })

        .on('getAssociatedEntitiesFromQuery', function(id, query){
          textmining.getAssociatedEntitiesFromQuery(query, function(err, entities){
            socket.emit('getAssociatedEntitiesFromQuery', id, err, entities);
          });
        })

        .on('getEntityInfo', function(id, entity){
          textmining.getEntityInfo(entity, function(err, info){
            socket.emit('getEntityInfo', id, err, info);
          });
        })
      ;

    })
  ;

};