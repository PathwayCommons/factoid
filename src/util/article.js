import striptags from 'striptags';

// Remove surrounding white space, periods, quotations
const trimPlus = str => str.replace(/^[\s."']+|[\s."']+$/g, '');
const lowerCase = str => str.toLowerCase();

// Remove HTML formatting markup
const unformat = str => striptags( str, [
  '<i>', '<b>', '<strong>', '<em>', '<sup>', '<sub>', '<del>'
]);


// Remove U+002D : HYPHEN-MINUS; U+2013 : EN DASH
const undash = str => {
  return str
    .replace(/(mir)-(\d+)/i, '$1$2') // Normalize micro RNA names
    .replace(/[\u002D|\u2013]+/g, ' ');
};

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
    .map( lowerCase )
    .map( undash )
    .map( unformat );
  return title === other;
}

export {
  testTitle
};