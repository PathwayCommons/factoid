var services = require('./services');
var assert = require('assert');

module.exports = {

  testTextmining: function(){
    function find(ent, ents, msg){
      for( var i = 0; i < ents.length; i++ ){
        var ient = ents[i];

        var field;
        var matches = true;
        for( field in ent ){
          if( ent[field] !== ient[field] ){
            matches = false;
            break;
          }
        }

        if( matches ){
          return ient;
        }
      }

      throw msg || ('Could not find ent in response: ' + JSON.stringify(ent));
    }

    services.getPotentialEntitiesFromText('PCNA and RAD51 interact in human.', function(err, ents, orgs){
      if( err ){
        services.reportError('The textmining server is not responding with results.  Please check the Miguel VM and make sure it is running.  You may need to restart it.');
      
      } else {

        try {
          find({ name: 'PCNA', type: 'entity' }, ents, 'Expected to find PCNA in response but found none');
          find({ name: 'RAD51', type: 'entity' }, ents, 'Expected to find RAD51 in response but found none');

          var intn = find({ type: 'interaction' }, ents, 'Expected to find interaction in response but found none');

          assert( intn.participantIds != null, 'Response interaction expected to have participants but found none' );

          assert( intn.participantIds.length === 2, 'Response interaction expected to have 2 participants but found ' + intn.participantIds.length );

          console.log('Textmining test SUCCESS');
        } catch(e){
          services.reportError( 'Textmining test FAILURE : The textmining server seems to be responding, but results do not match expected: ' + e );
        }
      }
    });
  },

  start: function( dt ){
    var self = this;

    dt = dt !== undefined ? dt : 5 * 60 * 1000; // default every 5 min

    this._interval = setInterval(function(){
      console.log('Testing connection to external services...');

      self.testTextmining();
    }, dt);
  },

  stop: function(){
    clearInterval( this._interval );
  }
};