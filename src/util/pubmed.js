import _ from 'lodash';
import { parse as dateParse } from 'date-fns';
import { DOI_LINK_BASE_URL, PUBMED_LINK_BASE_URL } from '../config';
import { fromCamelCase, onlyCapitalizeFirst } from './strings';

const NUM_AUTHORS_SHOWING = 4;

const COMMENTSCORRECTIONS_REFTYPE = Object.freeze({
  AssociatedDataset: 'AssociatedDataset',
  AssociatedPublication: 'AssociatedPublication',
  CommentOn: 'CommentOn',
  CommentIn: 'CommentIn',
  ErratumIn: 'ErratumIn',
  ErratumFor: 'ErratumFor',
  ExpressionOfConcernIn: 'ExpressionOfConcernIn',
  ExpressionOfConcernFor: 'ExpressionOfConcernFor',
  RepublishedFrom: 'RepublishedFrom',
  RepublishedIn: 'RepublishedIn',
  RetractionOf: 'RetractionOf',
  RetractionIn: 'RetractionIn',
  UpdateIn: 'UpdateIn',
  UpdateOf: 'UpdateOf',
  SummaryForPatientsIn: 'SummaryForPatientsIn',
  OriginalReportIn: 'OriginalReportIn',
  ReprintOf: 'ReprintOf',
  ReprintIn: 'ReprintIn',
  Cites: 'Cites'
});

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

const getAuthorNameParts = author => {
  let ForeName = null;
  let LastName = null;
  const collectiveName = _.get( author, 'CollectiveName' );
  const isPerson = _.isNull( collectiveName );
  if( isPerson ){
    LastName = _.get( author, 'LastName' ); // required
    ForeName = _.get( author, 'ForeName' ); // required
    if( ForeName != null ){
      // Only take the first token (could be 'name initial')
      ForeName = ForeName.split(' ')[0];
    }
  }
  return { ForeName, LastName };
};

const getEmail = author => {
  const AffiliationInfo = _.get( author, ['AffiliationInfo'] );
  let email = [];
  if( !_.isEmpty( AffiliationInfo ) ) {
    const emails = AffiliationInfo.filter( info => !_.isNull( _.get( info, 'email' ) ) ).map( info => _.get( info, 'email' ) );
    email = _.uniq( _.flatten( emails ) );
  }
  return email;
};

const getContact = author => {
  const email = getEmail( author );
  const name = getAuthorName( author );
  const { ForeName, LastName } = getAuthorNameParts( author );
  return { name, email, ForeName, LastName };
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

/**
 * findOrcidIdentifier
 * Helper to extract an ORCID accession from a string
 *
 * @param {string} raw the string to examine
 * @returns ORCID accession, possibly null
 */
const findOrcidIdentifier = raw => {
  let orcidId = null;
  if( raw ){
  const ORCID_REGEX = /\d{4}-\d{4}-\d{4}-\d{3}(\d|X)/g;
    const matches = raw.match( ORCID_REGEX );
    const hasMatch = !_.isEmpty( matches );
    if( hasMatch ) orcidId = _.head( matches );
  }
  return orcidId;
};

const getAuthorOrcid = Author => {
  const isOrcId = id => id['Source'] === 'ORCID';
  const Identifier = _.get( Author, ['Identifier'] );
  let raw =  _.get( _.find( Identifier, isOrcId ), ['id'] );
  return findOrcidIdentifier( raw );
};

const getAuthorList = AuthorList => {
  return AuthorList.map( Author => {
    const { ForeName, LastName } = getAuthorNameParts( Author );
    return {
      name: getAuthorName( Author ),
      ForeName,
      LastName,
      email: _.head( getEmail( Author ) ) || null,
      abbrevName: getAbbrevAuthorName( Author ),
      isCollectiveName: !_.isNull( _.get( Author, 'CollectiveName' ) ),
      orcid: getAuthorOrcid( Author )
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

const toISODate = ( year, month, day ) => {
  let dateString = `${year}`;
  let formatString = 'yyyy';

  if( month ){
    dateString += ` ${month}`;

    if( /^[0-9]{2}$/.test( month ) ){
      formatString += ` MM`;
    } else {
      formatString += ` LLL`;
    }
  }

  if( day ){
    formatString += ` dd`;
    dateString += ` ${day}`;
  }
  const ISODate = dateParse( dateString, formatString, new Date() );
  return ISODate;
};

const getPubDate = JournalIssue => {
  let year= null,
  month = null,
  day = null,
  ISODate = null;

  const PubDate = _.get( JournalIssue, ['PubDate'] );
  const hasMedlineDate = _.has( PubDate, ['MedlineDate'] );

  if( !hasMedlineDate ){
    year = _.get( PubDate, ['Year'], null );
    month = _.get( PubDate, ['Month'], null );
    day = _.get( PubDate, ['Day'], null );
    ISODate = toISODate( year, month, day );
  }

  return { year, month, day, ISODate };
};

const getReferenceString = Journal => {
  const journalName = getJournalNameString( Journal );
  const JournalIssue = _.get( Journal, ['JournalIssue'] );
  const journalVolume = !_.isNil( _.get( JournalIssue, ['Volume'] ) ) ? _.get( JournalIssue, ['Volume'] ): ''; //optional
  const { year } = getPubDate( JournalIssue );
  return _.compact( [ journalName, journalVolume, year ] ).join(' ') || null;
};

const getArticleId = ( PubmedArticle, IdType ) => _.get( _.find( _.get( PubmedArticle, ['PubmedData', 'ArticleIdList'], [] ), [ 'IdType', IdType ] ), 'id', null );

const getRelations = PubmedArticle => {
  const formatRefSource = refSource => _.trimEnd( refSource, ':;' );// ? _.first( refSource.split(';') ) : 'link';
  const commentsCorrections2Link = ({ RefSource, PMID, DOI }) => {
    const hasPMID = !_.isNil( PMID );
    const hasDOI = !_.isNil( DOI );
    const reference = formatRefSource( RefSource );
    let url = null;
    if( hasPMID ) {
      url = `${PUBMED_LINK_BASE_URL}${PMID}`;
     } else if( hasDOI ){
      url = `${DOI_LINK_BASE_URL}${DOI}`;
    }
    return ({ reference, url });
  };
  const raw = _.get( PubmedArticle, [ 'MedlineCitation', 'CommentsCorrectionsList' ], [] );
  const groups = _.groupBy( raw, 'RefType' );
  const relations = _.toPairs( groups ).map( ( [ RefType, CommentsCorrectionsList ] ) => {
    const type = onlyCapitalizeFirst( fromCamelCase( RefType ) );
    const links = CommentsCorrectionsList.map( commentsCorrections2Link );
    return ({ type, links });
  });

  return _.compact( relations );
};

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
 * @return {String} result.pubTypes
 * @return {String} result.ISODate ({ year, month, day })
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
  const pubTypes = _.get( Article, 'PublicationTypeList' ); //required
  const { ISODate } = getPubDate( _.get( Article, ['Journal', 'JournalIssue'] ) );
  const relations = getRelations( PubmedArticle );

  return { title, authors, reference, abstract, pmid, doi, pubTypes, ISODate, relations };
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
const createPubmedArticle = ({ articleTitle = null, journalName = null, publicationYear = null }) => {

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
        },
        PublicationTypeList: []
      },
      ChemicalList: [],
      CommentsCorrectionsList: [],
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

export { getPubmedCitation, createPubmedArticle, ArticleIDError, findOrcidIdentifier, COMMENTSCORRECTIONS_REFTYPE };