import _ from 'lodash';
import striptags from 'striptags';

// Remove surrounding white space, periods, quotations
const trimPlus = str => str.replace(/^[\s."']+|[\s."']+$/g, '');
const lowerCase = str => str.toLowerCase();
// https://www.nlm.nih.gov/databases/dtd/medline_characters.html
// https://www.nlm.nih.gov/archive/20110906/databases/dtd/medline_character_database.html
const deburr = str => _.deburr( str );

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

const doesMatch = ( title, other ) => {
  return title === other || _.includes( title, other ) || _.includes( other, title );
};

// PubMed appears to transform LEFT (U+2018) and RIGHT (U+2019) SINGLE QUOTATION MARKs to APOSTROPHE (U+0027)
// Crossref does not apoear to do this
const apostrophize = str => str.replace(/[\u2018|\u2019]/g, '\'');

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
    .map( unformat )
    .map( deburr )
    .map( apostrophize );
  return doesMatch( title, other );
}

export {
  testTitle
};