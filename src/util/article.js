// Remove surrounding white space, periods, quotations
const trimPlus = str => str.replace(/^[\s."']+|[\s."']+$/g, '');
const lowerCase = str => str.toLowerCase();

/**
 * Match a title string against a candidate
 *
 * @param {string} title provided title
 * @param {string} other candidate to match against
 * @returns {boolean} true if the title matches
 */
function testTitle( title, other ) {
  [ title, other ] = [title, other]
    .map( trimPlus )
    .map( lowerCase );
  return title === other;
}

export {
  testTitle
};