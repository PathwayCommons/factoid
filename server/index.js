var derby = require('derby');
var Promise = require('bluebird');
var http = require('http');
var chalk = require('chalk');
var path = require('path');

var publicDir = path.resolve(__dirname, '../public');

derby.run(function(){
  require('coffee-script/register');

  require('./config');

  var apps = [
    require('../apps/factoid')
  ];

  var express = require('./express');
  var store = require('./store')(derby, publicDir);

  var error = require('./error');

  express(store, apps, error, publicDir, function(expressApp, upgrade){
    var server = http.createServer(expressApp);
    var listen = Promise.promisify( server.listen.bind( server ) );

    server.on('upgrade', upgrade);

    Promise.all( apps.map(bundleAppPromise) ).then(function(){
      console.log( 'All apps bundled' );

      return listen( process.env.PORT );
    }).then(function(){
      console.log( chalk.green('Server available at http://localhost:'+process.env['PORT']) );
    });

    function bundleAppPromise( app ){
      return new Promise(function( resolve, reject ){
        app.writeScripts(store, publicDir, {extensions: ['.coffee']}, function(err){
          if( err ){
            console.log("Bundle not created:", chalk.red(app.name), ', error:', err);
            reject( err );
          } else {
            console.log('Bundle created:', chalk.blue(app.name));
            resolve();
          }
        });
      });
    }

  });
});
