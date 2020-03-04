import _ from 'lodash';

const NUM_AUTHORS_SHOWING = 4;

/**
 * getAuthorName
 *
 * Retrieve a nicely formatted string of the author name
 * @param {Object} Author returned as is from fetchPubmed PubmedArticleSet
 * @return {String} ( First Initial Last | Collective )
 */
const getAuthorName = author => {
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

/**
 * getAbbrevAuthorName
 *
 * Retrieve a nicely formatted string of the abbreviated author name ( LastName Initials | Collective )
 * @param {Object} Author returned as is from fetchPubmed PubmedArticleSet
 * @return {String}
 */
const getAbbrevAuthorName = author => {
  let name = '';
  const collectiveName = _.get( author, 'CollectiveName' );
  const isPerson = _.isNull( collectiveName );
  if( isPerson ){
    const LastName = _.get( author, 'LastName' ); // required
    const Initials = _.get( author, 'Initials' ); // optional
    name = [ LastName, Initials ].join(' ');

  } else {
    name = collectiveName;
  }
  return name;
};

const getEmail = author => {
  const AffiliationInfo = _.get( author, ['AffiliationInfo'] );
  let email = [];
  if( !_.isNull( AffiliationInfo ) ) {
    const emails = AffiliationInfo.filter( info => !_.isNull( _.get( info, 'email' ) ) ).map( info => _.get( info, 'email' ) );
    email = _.uniq( _.flatten( emails ) );
  }
  return email;
};

const getContact = author => {
  const email = getEmail( author );
  const name = getAuthorName( author );
  return { name, email };
};

// Always show the last author
// Corresponding author is ambiguous in PubMed
const getAuthorAbbrev = AuthorList => {
  const leadingAuthors = _.take( AuthorList, NUM_AUTHORS_SHOWING - 1 );
  const lastAuthor =  _.last( AuthorList );
  const authorList = leadingAuthors.concat( lastAuthor );

  const authorStringList = _.uniq( authorList.map( getAuthorName ) );
  if( leadingAuthors.length && leadingAuthors.length < AuthorList.length - 1  ) authorStringList.splice( NUM_AUTHORS_SHOWING - 1, 0, '...' );
  return authorStringList.join(', ');
};

const getContacts = AuthorList => AuthorList.map( getContact ).filter( contact => !_.isEmpty( _.get( contact, 'email' ) ) );

const getAuthorList = AuthorList => {
  return AuthorList.map( Author => {
    return {
      name: getAuthorName( Author ),
      email: _.head( getEmail( Author ) ),
      abbrevName: getAbbrevAuthorName( Author ),
      isCollectiveName: !_.isNull( _.get( Author, 'CollectiveName' ) )
    };
  });
};

const getAuthors = AuthorList => {
  let abbreviation = null,
    contacts = null,
    authorList = null;
  if( AuthorList ){
    abbreviation = getAuthorAbbrev( AuthorList );
    contacts = getContacts( AuthorList );
    authorList = getAuthorList( AuthorList );
  }
  return { abbreviation, contacts, authorList };
};

const getJournalNameString = Journal => {
  const hasJournalISOAbbreviation = !_.isNil( _.get( Journal, ['ISOAbbreviation'] ) ); //optional
  const hasJournalTitle = !_.isNil( _.get( Journal, ['Title'] ) ); //optional
  let name = '';
  if( hasJournalISOAbbreviation ){
    name = `${_.get( Journal, ['ISOAbbreviation'] )}`;
  } else if( hasJournalTitle ) {
    name = `${_.get( Journal, ['Title'] )}`;
  }
  return name;
};

const getPubDateYear = JournalIssue => {
  const hasMedlineDate = _.has( JournalIssue, ['PubDate', 'MedlineDate'] );
  const year = hasMedlineDate ? _.get( JournalIssue, ['PubDate', 'MedlineDate'] ) : _.get( JournalIssue, ['PubDate', 'Year'] );
  return `(${year})`;
};

const getReferenceString = Journal => {
  const journalName = getJournalNameString( Journal );
  const JournalIssue = _.get( Journal, ['JournalIssue'] );
  const journalVolume = !_.isNil( _.get( JournalIssue, ['Volume'] ) ) ? _.get( JournalIssue, ['Volume'] ): ''; //optional
  const pubDateYear = getPubDateYear( JournalIssue );
  return _.compact( [ journalName, journalVolume, pubDateYear ] ).join(' ') || null;
};

const getArticleId = ( PubmedArticle, IdType ) => _.get( _.find( _.get( PubmedArticle, ['PubmedData', 'ArticleIdList'], [] ), [ 'IdType', IdType ] ), 'id', null );

/**
 * getPubmedCitation
 *
 * Retrieve a nicely formatted set of citation items from a PubmedArticle
 *  -- authors, title, and reference
 * @param {Object} PubmedArticle Returned from fetchPubmed PubmedArticleSet
 * @return {Object} result
 * @return {String} result.authors The CollectiveName or 'LastName et al.'
 * @return {String} result.contacts
 * @return {String} result.title
 * @return {String} result.reference (<ISOAbbreviation> | <Title>) <Year>; <Volume>
 * @return {String} result.pmid
 * @return {String} result.doi
 */
const getPubmedCitation = PubmedArticle => {
  const Article = _.get( PubmedArticle, ['MedlineCitation','Article'] ); //required
  const Journal = _.get( Article, ['Journal'] ); //required
  const AuthorList = _.get( Article, ['AuthorList'] ); //optional

  const title = _.get( Article, ['ArticleTitle'], null ); //required
  const authors = getAuthors( AuthorList );
  const reference = getReferenceString( Journal );
  const abstract = _.get( Article, 'Abstract', null );
  const pmid = getArticleId( PubmedArticle, 'pubmed' );
  const doi = getArticleId( PubmedArticle, 'doi' );

  return { title, authors, reference, abstract, pmid, doi };
};

/**
 * createPubmedArticle
 *
 * Manually fill in some PubmedArticle details
 *
 * @param {Object} opts values for the PubmedArticle
 * @param {string} opts.articleTitle title the of the article
 * @param {string} opts.journalTitle name of journal
 * @param {string} opts.publicationYear pubYear the year of publication
 * @returns {Object} the populated PubMedArticle
 */
const createPubmedArticle = ({ articleTitle, journalName = null, publicationYear = null }) => {

  const PubMedArticle = {
    MedlineCitation: {
      Article: {
        Abstract: null,
        ArticleTitle: null,
        AuthorList: [],
        Journal: {
          ISOAbbreviation: null,
          ISSN: null,
          Title: null,
          JournalIssue: {
            Issue: null,
            PubDate: {
              Year: null,
              Month: null,
              Day: null
            },
            Volume: null
          }
        }
      },
      ChemicalList: [],
      InvestigatorList: [],
      KeywordList: [],
      MeshheadingList: []
    },
    PubmedData: {
      ArticleIdList: [],
      History: [],
      ReferenceList: []
    }
  };

  _.set( PubMedArticle, [ 'MedlineCitation', 'Article', 'ArticleTitle' ], articleTitle );
  _.set( PubMedArticle, [ 'MedlineCitation', 'Article', 'Journal', 'Title' ], journalName );
  _.set( PubMedArticle, [ 'MedlineCitation', 'Article', 'Journal', 'JournalIssue', 'PubDate', 'Year' ], publicationYear );
  return PubMedArticle;
};

class ArticleIDError extends Error {
  constructor( message, id ) {
    super( message );
    this.id = id;
    this.name = 'ArticleIDError';
  }
}


export { getPubmedCitation, createPubmedArticle, ArticleIDError };