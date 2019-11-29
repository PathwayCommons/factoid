import _ from 'lodash';
import { PUBMED_LINK_BASE_URL } from '../config';

const NUM_AUTHORS_SHOWING = 4;
const getName = author => {
  let name = '';
  const collectiveName = _.get( author, 'CollectiveName' );
  const isPerson = _.isNull( collectiveName );
  if( isPerson ){
    const LastName = _.get( author, 'LastName' ); // required
    const ForeName = _.get( author, 'ForeName' ); // optional
    name = [ ForeName, LastName ].join(' ');

  } else {
    name = collectiveName;
  }
  return name; 
};

// Always show the last author
// Corresponding author is ambiguous in PubMed
const getAuthorString = AuthorList => {
  if ( _.isEmpty( AuthorList ) ) return '';
  const leadingAuthors = _.take( AuthorList, NUM_AUTHORS_SHOWING - 1 );
  const lastAuthor =  _.last( AuthorList );
  const authorList = leadingAuthors.concat( lastAuthor );
  
  const authorStringList = _.uniq( authorList.map( getName ) );
  if( leadingAuthors.length && leadingAuthors.length < AuthorList.length - 1  ) authorStringList.splice( NUM_AUTHORS_SHOWING - 1, 0, '...' );
  return authorStringList.join(', ');
};

const getJournalNameString = Journal => {
  const hasJournalISOAbbreviation = !_.isNull( _.get( Journal, ['ISOAbbreviation'] ) ); //optional 
  const hasJournalTitle = !_.isNull( _.get( Journal, ['Title'] ) ); //optional 
  let name = '';
  if( hasJournalISOAbbreviation ){ 
    name = `${_.get( Journal, ['ISOAbbreviation'] )}.`;
  } else if( hasJournalTitle ) {
    name = `${_.get( Journal, ['Title'] )}.`;
  }

  return name;
};

const getReferenceString = Journal => {
  const journalName = getJournalNameString( Journal ); 
  const journalVolume = !_.isNull( _.get( Journal, ['Volume'] ) ) ? _.get( Journal, ['Volume'] ): ''; //optional 
  const pubDateYear = !_.isNull( _.get( Journal, ['PubDate', 'Year'] ) ) ? `(${_.get( Journal, ['PubDate', 'Year'] )})`: ''; //optional 
  return _.compact( [ journalName, journalVolume, pubDateYear ] ).join(' ');
};

const getPubmedUrl = PubmedArticle => {
  const id = _.get( _.find( _.get( PubmedArticle, ['PubmedData', 'ArticleIdList'], [] ), o => o.IdType === 'pubmed' ), 'id' );
  return PUBMED_LINK_BASE_URL + id;
};

/**
 * getPubmedCitation
 * 
 * Retrieve a nicely formatted set of citation items from a PubmedArticle
 *  -- authors, title, and reference
 * @param {Object} PubmedArticle Returned from fetchPubmed PubmedArticleSet
 * @return {Object} result 
 * @return {String} result.authors The CollectiveName or 'LastName et al.' 
 * @return {String} result.title 
 * @return {String} result.reference (<ISOAbbreviation> | <Title>) <Year>; <Volume> 
 */
const getPubmedCitation = PubmedArticle => {
  const Article = _.get( PubmedArticle, ['MedlineCitation','Article'] ); //required
  const Journal = _.get( Article, ['Journal'] ); //required
  const title = _.get( Article, ['ArticleTitle'] ); //required
  const AuthorList = _.get( Article, ['AuthorList'] ); //optional

  const authors = getAuthorString( AuthorList ); 
  const reference = getReferenceString( Journal );
  const abstract = _.get( Article, 'Abstract' );
  const url = getPubmedUrl( PubmedArticle );
  
  return { authors, title, reference, abstract, url };
};

export { getPubmedCitation }; 