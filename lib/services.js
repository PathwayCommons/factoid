// to create the textmining services on the server side,
// pass the dependencies in the arguments list
//
// rationale: this allows for 
module.exports = function(_, http, port, request, form){

  // NB: next(err, docId)
  function addDoc( textDoc, next ){
    request( {
      method: 'POST',
      url: 'http://se.bioinfo.cnio.es/Factoid/add_doc',
      form: {
        text: textDoc,
        '_format': 'json'
      },
      json: true
    }, function (error, response, body) {
      var docId = body;
      next(error, docId);
    });
  }

  // addDoc('PCNA and RAD51 interact to do something or other.', function(err, docId){
  //   console.log( 'addDoc() err, docId: ', err, docId );
  // });

  // NB: next(err, abner)
  function getAbner(docId, next){
    request( {
      method: 'POST',
      url: 'http://se.bioinfo.cnio.es/Factoid/abner',
      form: {
        docid: docId,
        '_format': 'json'
      },
      json: true
    }, function (error, response, body) {
      var abner = body;
      next(error, abner);
    });
  }

  // NB: next(err, sentences)
  function getSentences(docId, next){
    request( {
      method: 'POST',
      url: 'http://se.bioinfo.cnio.es/Factoid/sentences',
      form: {
        docid: docId,
        '_format': 'json'
      },
      json: true
    }, function (error, response, body) {
      var sentences = body;
      next(error, sentences);
    });

  }

  // test prereqs for getMatchesFromText

  // addDoc('PCNA and RAD51 interact to do something or other.', function(err, docId){
  //   console.log( 'addDoc() err, docId: ', err, docId );

  //   getAbner(docId, function(err, abner){
  //     console.log('getAbner() err, abner: ', err, abner);
  //   });

  //   getSentences(docId, function(err, sentences){
  //     console.log('getSentences() err, sentences:', err, sentences);
  //   });
  // });

  // addDoc('PCNA and RAD51 interact to do something or other.', function(err, docId){
  //   console.log( '2nd addDoc() err, docId: ', err, docId );
  // });

  // looks at text document; finds sentences etc
  // NB: next(err, { entities, sentences })
  function getMatchesFromText( textDoc, next ){
    var err = null;
    var struct = null;
    var abner, sentences;

    // console.log('text = ' + text);

    // TODO build in backup system to local server

    function checkComplete(err, next){
      if( abnerDone && sentencesDone ){
        next(err, {
          entities: abner,
          sentences: sentences
        });
      }
    }

    var sentencesDone = false;
    var abnerDone = false;

    addDoc(textDoc, function(e, docId){
      if( e ){
        err = e;
        next(err);
        return;
      }

      getAbner(docId, function(err, a){
        abnerDone = true;
        abner = a;
        checkComplete(err, next);
      });

      getSentences(docId, function(err, s){
        sentencesDone = true;
        sentences = s;
        checkComplete(err, next);
      });
    });


    // escape single quote characters, since we use them to enclose the text in the query
    // text = text.replace(/'/g, "\\'");

    // var script = '\
    //   genes = select * from cnio.genemention \
    //     where text = "' + text + '" and port = "' + port + '"; \
    //   \
    //   sentences = select * from cnio.sentences \
    //     where text = "' + text + '" and port = "' + port + '"; \
    //   \
    //   return { "genes": "{genes}", "sentences": "{sentences}" } \
    // ';

    // engine.execute(script, function(emitter) {
    //   emitter.on('end', function(err, res) {
    //     var struct = res && res.body ? res.body : null;

    //     next(err, struct);
    //   });
    // });
  }

  // getMatchesFromText('PCNA and RAD51 interact to do something.  MSH1 and MSH2 do something else.', function(err, matches){
  //   console.log('getMatchesFromText() err, matches:', err, matches);
  // });

  // function getText( arg ){
  //   var obj = arg;

  //   if( !arg ){
  //     return '';
  //   }

  //   if( _.isArray(obj) ){
  //     obj = obj[0];
  //   }

  //   if( obj.$t ){
  //     obj = obj.$t;
  //   }

  //   return obj;
  // }

  // function postProcessUniprotEntity( ent ){
  //   // post process organism
  //   ent.organismId = getText( ent.organismId );
  //   ent.organismName = getText( ent.organismName );

  //   // post process id
  //   ent.dbId = getText( ent.dbId );
  //   ent.db = 'uniprot';
  //   ent.type = 'protein';

  //   if( !ent.name ){ // b/c the nice name might not be specified
  //     ent.name = ent.officialName;
  //   }

  //   ent.name = getText( ent.name );
  //   ent.officialName = getText( ent.officialName );
  //   ent.fullName = getText( ent.officialName );
  //   ent.shortName = getText( ent.shortName );

  //   var comms = ent.comment || [];
  //   for( var i = 0; i < comms.length; i++ ){
  //     var comm = comms[i];

  //     if( comm.type === 'function' ){
  //       ent.function = comm.text['$t'] || comm.text;
  //     }
  //   } 
  //   delete ent.comment;

  //   ent.link = 'http://www.uniprot.org/uniprot/' + ent.dbId;
    
  //   return ent;
  // }

  // gets a list of already assoc'd ent's from a query (a single entity name)
  // used for entity search from manual user input (a single entity name)
  // NB: next(err, entities)
  function getAssociatedEntitiesFromQuery( query, next ){
    var err = null;
    var retEnts = [];
    var orgIds;

    if( typeof query === typeof {} ){
      orgIds = query.organismIds;
      query = query.query;
    }

    var orgFilter = ' AND (';

    for( var i = 0; orgIds && i < orgIds.length; i++ ){
      orgFilter += 'organism:' + orgIds[i];

      var notLastOrg = i < orgIds.length - 1;
      if( notLastOrg ){
        orgFilter += ' OR ';
      }
    }

    orgFilter += ')';

    // http request
    // start copy

    var text = 'query=' + query + ( orgIds ? orgFilter : '' ) + '&sort=score&format=tab&limit=10';

    // console.log('text = ' + text);

    var preq = http.request({
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': text.length
      },
      host: 'www.uniprot.org',
      port: 80,
      path: '/uniprot/',
      method: 'POST'

    }, function(pres) {
      pres.setEncoding('utf8');
      pres.on('data', function (chunk) {
        var textResp = chunk;
        var lines = textResp.split('\n');

        for( var i = 1 /* skip title line */; i < lines.length; i++ ){
          var line = lines[i];
          var cols = line.split('\t');

          // skip blank lines
          if( cols.length < 7 ){ continue; } 

          // console.dir(cols)

          // column names
          var id = cols[0];
          var name = cols[1];
          var status = cols[2];
          var proteinNames = cols[3];
          var geneNames = cols[4];
          var organism = cols[5];
          var length = cols[6];

          // TODO remove when we have proper JSON services that we can call with all of the required data
          function orgNameToId(name){
            if( name.match(/human/i) ){
              return 9606;

            } else if( name.match(/mouse/i) ){
              return 10090;

            } else {
              return -1; // error
            }
          }

          retEnts.push({
            dbId: id,
            db: 'uniprot',
            organismName: organism,
            organismId: orgNameToId( organism ),
            type: 'protein',
            name: name,
            fullName: proteinNames,
            link: 'http://www.uniprot.org/uniprot/' + id
          });
        }
        
        next(err, retEnts);
      });
    });

    preq.on('error', function(e) {
      //console.log('problem with request: ' + e.message);
      err = e;
      next(err, retEnts);
    });

    // write data to request body
    preq.write(text);
    preq.end();

    // end copy

    // searches uniprot for entities with the query string
    // TODO limit fields returned to those that specify the entity (can be done when making UI)
    // var script = "\
    //   select \
    //     accession as dbId, \
    //     name as officialName, \
    //     protein.recommendedName.fullName as fullName, \
    //     protein.recommendedName.shortName as shortName, \
    //     organism.name as organismName, \
    //     organism.dbReference.id as organismId, \
    //     gene.name as name, \
    //     comment as comment \
    //   from uniprot \
    //     where query = '" + query + ( orgIds ? orgFilter : '' ) + "'; \
    // ";

    //console.log(script);

    // console.log('query at time ', +new Date, ' and text `', query, '`');

    // var entities;
    // engine.execute(script, function(emitter){
    //   emitter.on('end', function(err, res){
    //     //if( entities ){ return; } // we already got a response

    //     // console.log('err : ', err != null);

    //     entities = res && res.body ? res.body : null;

    //     // console.log(entities);

    //     // console.log('ents: ', entities != null);

    //     if( entities ){
    //       for( var i = 0; i < entities.length; i++ ){
    //         var ent = entities[i];
    //         postProcessUniprotEntity(ent);

    //         // console.log(ent);
    //       }
    //     }

    //     next(err, entities);
    //     // console.log('called next');
    //   });
    // });
  }

  // examples of use:

  // getAssociatedEntitiesFromQuery('pcna', function(err, entities){
  //   console.dir(entities);
  // });

  // getAssociatedEntitiesFromQuery({
  //   query: 'pcna and rad51',
  //   organismIds: [ 9606, 10090 ]

  // }, function(err, entities){
  //   console.dir(entities);
  // });




  // searches text for entities, interactions, etc, etc and returns potential entities (just the names)
  // NB: next(err, entities)
  function getPotentialEntitiesFromText( text, next ){

    getMatchesFromText( text, function( err, struct ){ // get the matches
      var ents = struct.entities;
      var sentences = struct.sentences;
      var retEnts = [];
      var nameToRetEnt = {};
      var lastId = 0;

      function addRetEnt( name ){
        var retEnt = {
          id: lastId++,
          name: name,
          type: 'entity'
        };

        retEnts.push( retEnt );
        nameToRetEnt[ name ] = retEnt;

        // console.log('add retEnt', retEnt);
      }

      function addRetInt( names ){ console.log('addRetInt', names);
        var retInt = {
          id: lastId++,
          type: 'interaction',
          participantIds: []
        };

        for( var i = 0; i < names.length; i++ ){
          var name = names[i];
          var retEnt = nameToRetEnt[ name ];
          var pid = retEnt.id;

          retInt.participantIds.push( pid );
        }

        retEnts.push( retInt );

        // console.log( 'add retEnt (int)', retInt, names );
      }

      // create an ent obj for each entity
      for( var i = 0; i < ents.length; i++ ){
        var ent = ents[i];

        addRetEnt( ent, nameToRetEnt );
      }

      // look at each sentence
      for( var i = 0; i < sentences.length; i++ ){
        var sentence = sentences[i];
        var entsInSentence = [];
        var addedEnt = {};

        // in each sentence, look at each ent'y and see if it's in the sentence
        for( var j = 0; j < ents.length; j++ ){
          var ent = ents[j];

          var entInSentence = sentence.indexOf( ent ) >= 0;
          var alreadyAddedEnt = addedEnt[ ent ] ? true : false;
          if( entInSentence && !alreadyAddedEnt ){
            entsInSentence.push( ent );
            addedEnt[ ent ] = true;;
          }
        } // for j, ents

        if( entsInSentence.length > 1 ){
          addRetInt( entsInSentence );
        }

      } // for i, sentences

      next( err, retEnts );
    } );

  }

  // getPotentialEntitiesFromText('Chromosomal double-strand breaks (DSBs) have the potential to permanently arrest cell cycle progression and endanger cell survival. They must therefore be efficiently repaired to preserve genome integrity and functionality. Homologous recombination (HR) provides an important error-free mechanism for DSB repair in mammalian cells. In addition to RAD51, the central recombinase activity in mammalian cells, a family of proteins known as the RAD51 paralogs and consisting of five proteins (RAD51B, RAD51C, RAD51D, XRCC2 and XRCC3), play an essential role in the DNA repair reactions through HR. The RAD51 paralogs act to transduce the DNA damage signal to effector kinases and to promote break repair. However, their precise cellular functions are not fully elucidated. Here we discuss recent advances in our understanding of how these factors mediate checkpoint responses and act in the HR repair process. In addition, we highlight potential functional similarities with the BRCA2 tumour suppressor, through the recently reported links between RAD51 paralog deficiencies and tumorigenesis triggered by genome instability.', function(err, entities){
  //   console.log('getPotentialEntitiesFromText() err, entities:', err, entities);
  // });

  // gets entity info as json based on associated id
  // NB: next(err, info)
  function getEntityInfo( assoc, next ){
    var uniprot = assoc.dbId; // TODO assume uniprot id for now; replace later
    var retEnt;
    var err = null;

    if( uniprot ){

      var text = 'query=accession:' + uniprot + '&format=tab';

      // console.log('text = ' + text);

      var preq = http.request({
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'content-length': text.length
        },
        host: 'www.uniprot.org',
        port: 80,
        path: '/uniprot/',
        method: 'POST'

      }, function(pres) {
        pres.setEncoding('utf8');
        pres.on('data', function (chunk) {
          var textResp = chunk;
          var lines = textResp.split('\n');

          for( var i = 1 /* skip title line */; i < lines.length; i++ ){
            var line = lines[i];
            var cols = line.split('\t');

            // skip blank lines
            if( cols.length < 7 ){ continue; } 

            // console.dir(cols)

            // column names
            var id = cols[0];
            var name = cols[1];
            var status = cols[2];
            var proteinNames = cols[3];
            var geneNames = cols[4];
            var organism = cols[5];
            var length = cols[6];

            // TODO remove when we have proper JSON services that we can call with all of the required data
            function orgNameToId(name){
              if( name.match(/human/i) ){
                return 9606;

              } else if( name.match(/mouse/i) ){
                return 10090;

              } else {
                return -1; // error
              }
            }

            retEnt = ({
              dbId: id,
              db: 'uniprot',
              organismName: organism,
              organismId: orgNameToId( organism ),
              type: 'protein',
              name: name,
              fullName: proteinNames,
              link: 'http://www.uniprot.org/uniprot/' + id
            });
          }
          
          next(err, retEnt);
        });
      });

      preq.on('error', function(e) {
        //console.log('problem with request: ' + e.message);
        err = e;
        next(err, retEnt);
      });

      // write data to request body
      preq.write(text);
      preq.end();



      // var script = "\
      //   select \
      //     accession as dbId, \
      //     name as officialName, \
      //     protein.recommendedName.fullName as fullName, \
      //     protein.recommendedName.shortName as shortName, \
      //     organism.name as organismName, \
      //     organism.dbReference.id as organismId, \
      //     gene.name as name, \
      //     comment as comment \
      //   from uniprotlookup where id = '" + uniprot + "'; \
      // ";

      // engine.execute(script, function(emitter) {
      //   emitter.on('end', function(err, res) {
      //     var info = res && res.body && res.body[0] ? res.body[0] : null;

      //     next( err, postProcessUniprotEntity(info) );
      //   });
      // });

    } else {
      next('No uniprot ID found for getting entity info');
    }
  }

  // getEntityInfo({ uniprot: 'P12004', id: 'test' }, function(err, info){
  //   console.log(err, info);
  // });

  // these are what are exported as the textmining functions on the server
  // side
  return {
    getPotentialEntitiesFromText: getPotentialEntitiesFromText,
    getPotlEntsFText: getPotentialEntitiesFromText, // shorter alias
    getAssociatedEntitiesFromQuery: getAssociatedEntitiesFromQuery,
    getAssocdEntsFQ: getAssociatedEntitiesFromQuery, // shorter alias
    getEntityInfo: getEntityInfo,
    getEntInfo: getEntityInfo // shorter alias
  };
};