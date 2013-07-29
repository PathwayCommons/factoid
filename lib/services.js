// to create the textmining services on the server side,
// pass the dependencies in the arguments list
//
// rationale: this allows for 
module.exports = function(_, engine, port){

  function getMatchesFromText( text, next ){
    // escape single quote characters, since we use them to enclose the text in the query
    text = text.replace(/'/g, "\\'");

    var script = '\
      genes = select * from cnio.genemention \
        where text = "' + text + '" and port = "' + port + '"; \
      \
      sentences = select * from cnio.sentences \
        where text = "' + text + '" and port = "' + port + '"; \
      \
      return { "genes": "{genes}", "sentences": "{sentences}" } \
    ';

    engine.execute(script, function(emitter) {
      emitter.on('end', function(err, res) {
        var struct = res && res.body ? res.body : null;

        next(err, struct);
      });
    });
  }

  // getMatchesFromText('PCNA and RAD51', function(err, matches){
  //   console.log(err, matches);
  // });

  function getText( arg ){
    var obj = arg;

    if( !arg ){
      return '';
    }

    if( _.isArray(obj) ){
      obj = obj[0];
    }

    if( obj.$t ){
      obj = obj.$t;
    }

    return obj;
  }

  function postProcessUniprotEntity( ent ){
    // post process organism
    ent.organismId = getText( ent.organismId );
    ent.organismName = getText( ent.organismName );

    // post process id
    ent.dbId = getText( ent.dbId );
    ent.db = 'uniprot';
    ent.type = 'protein';

    if( !ent.name ){ // b/c the nice name might not be specified
      ent.name = ent.officialName;
    }

    ent.name = getText( ent.name );
    ent.officialName = getText( ent.officialName );
    ent.fullName = getText( ent.officialName );
    ent.shortName = getText( ent.shortName );

    var comms = ent.comment || [];
    for( var i = 0; i < comms.length; i++ ){
      var comm = comms[i];

      if( comm.type === 'function' ){
        ent.function = comm.text['$t'] || comm.text;
      }
    } 
    delete ent.comment;

    ent.link = 'http://www.uniprot.org/uniprot/' + ent.dbId;
    
    return ent;
  }

  // gets a list of potential entities from a query string
  // NB: next(err, entities)
  function getAssociatedEntitiesFromQuery( query, next ){
    var orgIds;

    if( typeof query === typeof {} ){
      orgIds = query.organismIds;
      query = query.query;
    }

    var orgFilter = ' AND (';

    for( var i = 0; orgIds && i < orgIds.length; i++ ){
      orgFilter += 'organism:' + orgIds[i];

      if( i < orgIds.length - 1 ){
        orgFilter += ' OR ';
      }
    }

    orgFilter += ')';

    // searches uniprot for entities with the query string
    // TODO limit fields returned to those that specify the entity (can be done when making UI)
    var script = "\
      select \
        accession as dbId, \
        name as officialName, \
        protein.recommendedName.fullName as fullName, \
        protein.recommendedName.shortName as shortName, \
        organism.name as organismName, \
        organism.dbReference.id as organismId, \
        gene.name as name, \
        comment as comment \
      from uniprot \
        where query = '" + query + ( orgIds ? orgFilter : '' ) + "'; \
    ";

    //console.log(script);

    // console.log('query at time ', +new Date, ' and text `', query, '`');

    var entities;
    engine.execute(script, function(emitter){
      emitter.on('end', function(err, res){
        //if( entities ){ return; } // we already got a response

        // console.log('err : ', err != null);

        entities = res && res.body ? res.body : null;

        // console.log(entities);

        // console.log('ents: ', entities != null);

        if( entities ){
          for( var i = 0; i < entities.length; i++ ){
            var ent = entities[i];
            postProcessUniprotEntity(ent);

            // console.log(ent);
          }
        }

        next(err, entities);
        // console.log('called next');
      });
    });
  }

  // getAssociatedEntitiesFromQuery('PCNA', function(err, entities){
  //   console.dir(entities[1]);
  // });

  // gets entities from text
  // NB: next(err, entities)
  function getPotentialEntitiesFromText( text, next ){
    getMatchesFromText(text, function(err, struct){ // get the matches
      if( err ){ // then we can't do anything
        next(err);

      } else { // then get entities for the matches

        var entities = struct.genes;
        var sentences = struct.sentences;
        var retEnts = [];

        var s = 0; 
        var id = 0;
        var entitiesInSentence = [];

        function takeInteractionFromSentence(){
          // console.log('trying to take interaction from sentence');

          var setenceIsEmpty = entitiesInSentence.length === 0;
          var onlyOneEntity = entitiesInSentence.length === 1;
          if( setenceIsEmpty || onlyOneEntity ){
            entitiesInSentence = []; // need to empty if it's just 1
            return; // then we can't make an interaction
          }

          // console.log('actually making ');

          var interaction = {
            type: 'interaction',
            participantIds: [],
            id: id++
          };
          var havePid = {};

          for( var i = 0; i < entitiesInSentence.length; i++ ){
            var pid = entitiesInSentence[i].id;

            if( !havePid[ pid ] ){
              interaction.participantIds.push( pid );
              havePid[ pid ] = true;
            }
          }

          retEnts.push( interaction );
          entitiesInSentence = [];
        }

        var literal2retEnt = {}; 
        for( var e = 0; e < entities.length; e++ ){ // look at each entity
          var entity = entities[e];
          var sentence = sentences[s];

          var lastSentence, 
            entityIsLaterThanSentence,
            needToFindNextSentence,
            nextSentenceIsBeforeEntity;

          // console.log('looking at entity with offset ', entity.offset, ' and sentence with offset ', sentence.offset);

          // move along to the next sentence until it's far along enough for the
          // entity
          do {
            lastSentence = s === sentences.length - 1;
            entityIsLaterThanSentence = entity.offset >= sentence.offset;
            nextSentenceIsBeforeEntity = !lastSentence && sentences[s + 1].offset < entity.offset;
            needToFindNextSentence = !lastSentence && (!entityIsLaterThanSentence || nextSentenceIsBeforeEntity);
          
            // console.log('lastSentence ', lastSentence, ' and entityIsLaterThanSentence ', entityIsLaterThanSentence);

            if( needToFindNextSentence ){
              takeInteractionFromSentence();

              
              sentence = sentences[ ++s ]; // then move on to the next sentence

              // console.log('moving to next sentence with index', i, ' and offset ', sentence.offset);
            }
          } while( needToFindNextSentence );

          var oldRetEnt = literal2retEnt[ entity.literal ];
          var retEnt = oldRetEnt || {
            name: entity.literal,
            type: 'entity',
            id: id++
          };
          var createdRetEnt = oldRetEnt !== retEnt;

          // add the entity to the sentence and to the list of returned entities
          entitiesInSentence.push( retEnt );

          if( createdRetEnt ){
            literal2retEnt[ entity.literal ] = retEnt;
            retEnts.push( retEnt );
          }
        }

        // once we're done, we should try taking an interaction again, since
        // we may have not handled the last sentence
        takeInteractionFromSentence();

        next(null, retEnts);
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
          protein.recommendedName.shortName as shortName, \
          organism.name as organismName, \
          organism.dbReference.id as organismId, \
          gene.name as name, \
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

  // these are what are exported as the textmining functions on the server
  // side
  return {
    getPotentialEntitiesFromText: getPotentialEntitiesFromText,
    getAssociatedEntitiesFromQuery: getAssociatedEntitiesFromQuery,
    getEntityInfo: getEntityInfo
  };
};