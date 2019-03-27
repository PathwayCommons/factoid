const _ = require('lodash');

/**
 * pickTopInteractions
 * Rank interactions for each pair of participants, select the best, then return at most 'maxNum'
 * across all pairs.
 * @param { Array } interactionElements List of elements typed 'interaction'
 * @param { Number }  n  The maximum number of ranked 'interactions' to return
 */
const pickTopInteractions = ( interactionElements ) => {    
    return interactionElements; // Stub
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
 */
const pickByNumParticipants = ( interactionElements, numParticipants ) =>  interactionElements.filter( interaction => interaction.entries.length === numParticipants );

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