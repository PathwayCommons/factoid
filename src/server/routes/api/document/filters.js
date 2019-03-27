const _ = require('lodash');

const DEFAULT_MIN_INTERACTION_MENTIONS = 3;
const DEFAULT_MAX_INTERACTIONS = 5;
const DEFAULT_NUM_PARTICIPANTS = 2;

const getEntityPair = element => element.entries.map( entry => entry.id ).sort().join('_');
const getSignGroup = entries => _.sortBy( entries, entry => entry.id ).map( entry => _.get( entry, ['group'], 'null' ) ).join('_');
const getInteractionsPerParticipants = interactionElements => {
  const byParticipantsMap = new Map();

   interactionElements.forEach( element => {
    const { association: type, entries } = element;
    const entityPair = getEntityPair( element );
    const signGroup = getSignGroup( entries );
    const id = element.id;
    let eltCounts = {};

     if ( byParticipantsMap.has( entityPair ) ) {
      eltCounts = byParticipantsMap.get( entityPair );
      _.update( eltCounts, [ type, signGroup ], value => _.compact( _.concat( value, id ) ) );

     } else {
      _.set( eltCounts, [ type, signGroup ], [ id ] );
      byParticipantsMap.set( entityPair, eltCounts );
    }

   });

   return byParticipantsMap;
};

const getLongestList = collection => _.last( _.sortBy( collection, array => array.length ) );
const collapseBySignGroup = interactionsForParticipants => {
  const typeCountsMap = new Map();

   _.entries( interactionsForParticipants ).forEach( typeGroupingPair => {
    const type = typeGroupingPair[ 0 ];
    const signGroups = typeGroupingPair[ 1 ]; 
    const intIds = getLongestList( signGroups );    
    typeCountsMap.set( type, intIds );
  });

   return typeCountsMap;  
};

 const collapseByType = byType => {
  const firstEntry = byType.entries().next().value;
  let maxType = _.get( firstEntry, ['0'] );
  let maxTypeIds = _.get( firstEntry, ['1'] );

   byType.forEach( ( idList, type ) => {
    if( idList.length > maxTypeIds.length ){
      maxTypeIds = idList.length;
      maxType = type;
    }
  });

   return byType.get( maxType );
};

const getTopIdsPerParticipants = interactionsPerParticipants => {
  const topIdsPerParticipants = [];
  for ( const interactionsForParticipants of interactionsPerParticipants.values() ) {
    const byType = collapseBySignGroup( interactionsForParticipants ); 
    const idList = collapseByType( byType );   
    topIdsPerParticipants.push( idList );   
  }

   topIdsPerParticipants.sort( ( a, b ) => b.length - a.length );    
  return topIdsPerParticipants;
};

const filterTopIdsPerParticipants = ( idsList, maxInteractions, minMentions ) => idsList.slice( 0, maxInteractions ).filter( idList => idList.length >= minMentions ).map( idList => _.head( idList ) );
const pickTopInteractionElements = ( interactionElements, topIdsPerParticipants, maxInteractions, minMentions  ) => {
  const topInteractionSet = new Set();
  const rankedIdListPerParticipants = filterTopIdsPerParticipants( topIdsPerParticipants, maxInteractions, minMentions );
  rankedIdListPerParticipants.forEach( id => topInteractionSet.add( id ) );
  return interactionElements.filter( o => topInteractionSet.has( o.id ) );
};

/**
 * pickTopInteractions
 * Return top interactions as determined by frequency of detection, one for each pair of participants.
 * @param { Array } interactionElements Array of interaction elements
 * @param { Number }  maxInteractions  The maximum number of interactions to return
 * @param { Number }  minMentions  The minimum number of times an interaction must have been detected to be considered
 */
const pickTopInteractions = ( interactionElements, maxInteractions = DEFAULT_MAX_INTERACTIONS, minMentions = DEFAULT_MIN_INTERACTION_MENTIONS) => {    
    const interactionsPerParticipants = getInteractionsPerParticipants( interactionElements );
    const topIdsPerParticipants = getTopIdsPerParticipants( interactionsPerParticipants ); 
    const topInteractions = pickTopInteractionElements( interactionElements, topIdsPerParticipants, maxInteractions, minMentions );  
    return topInteractions;
};

/**
 * pickByUniqueParticipants
 * Filter for interaction elements where 'entries' are unique.
 * @param { Array } interactionElements List of elements typed 'interaction'
 */
const pickByUniqueParticipants = interactionElements =>  interactionElements.filter( interaction => _.uniqBy( interaction.entries, 'id' ).length === interaction.entries.length );

/**
 * pickByNumParticipants
 * Interaction elements where 'entries' has length numParticipants 
 * @param { Array } interactionElements List of elements typed 'interaction'
 * @param { Array } numParticipants The number of participants
 */
const pickByNumParticipants = ( interactionElements, numParticipants = DEFAULT_NUM_PARTICIPANTS ) =>  interactionElements.filter( interaction => interaction.entries.length === numParticipants );

/**
 * pickEntitiesInInteractions
 * Filter for only those entities in an interaction
 * @param { Array } interactionElements List of elements typed 'interaction'
 * @param { Array } entityElements List of elements for entities
 */
const pickEntitiesInInteractions = ( interactionElements, entityElements ) => {
    const participantIds = new Set();
    interactionElements.forEach( intn => intn.entries.forEach( en => participantIds.add( en.id ) ) );
    return entityElements.filter( el => participantIds.has( el.id ) );
};

module.exports = { 
    pickByUniqueParticipants, 
    pickByNumParticipants, 
    pickTopInteractions,
    pickEntitiesInInteractions
}; 