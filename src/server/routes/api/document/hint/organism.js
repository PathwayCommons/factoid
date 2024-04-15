import {
  HINT_TYPE,
  SECTION
 } from "../../../../../model/hint";

/**
 * Calculate the organismOrdering provided a list of Hints
 *
 * @param {Array<Hint>} hints Array of Hint
 * @returns {Array<string>} organismOrdering array
 */
function order( hints ) {
  const byDescCount = ( a, b ) => b[1] - a[1];
  const isOrganismHint = ({ type }) =>  type === HINT_TYPE.ORGANISM;
  let organismCounts = new Map();

  const organismHints = hints.filter( isOrganismHint );
  for (const organismHint of organismHints ) {
    const { texts, section, xref: { id } } = organismHint;
    const boost = section && section === SECTION.TITLE ? 2 : 1;
    const numMentions = texts.length;
    organismCounts.set( id, boost * numMentions );
  }
  const sortedOrganismCounts = [...organismCounts.entries()].sort( byDescCount );
  // Consider: Tie-breaking
  const organismOrdering = sortedOrganismCounts.map( a => a[0] );
  return organismOrdering;
}

export default { order };