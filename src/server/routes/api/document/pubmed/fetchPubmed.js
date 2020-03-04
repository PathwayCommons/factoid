import _ from 'lodash';
import xml2js from 'xml2js';
import queryString from 'query-string';
import fetch from 'node-fetch';
import emailRegex from 'email-regex';

import { NCBI_EUTILS_BASE_URL, NCBI_EUTILS_API_KEY } from '../../../../../config';
import { checkHTTPStatus } from '../../../../../util';

const EUTILS_FETCH_URL = NCBI_EUTILS_BASE_URL + 'efetch.fcgi';
const DEFAULT_EFETCH_PARAMS = {
  db: 'pubmed',
  retmode: 'xml',
  retmax: 10,
  retstart: 0,
  api_key: NCBI_EUTILS_API_KEY
};

const notNull = o => !_.isNull(o) ;

const getTextField = param => {
  let text;
  if ( _.isString( param ) ){
    text = param;
  } else if ( _.isObject( param ) ) {
    text = _.get( param, '_' );
    const Label = _.get( param, ['$', 'Label'] );
    if (Label ) text = `${Label}: ${text}`;
  }
  return text;
};

//<!ELEMENT	AbstractText   (%text; | mml:math | DispFormula)* >
const getAbstract = Article => _.get( Article, ['Abstract', '0', 'AbstractText'] ).map( getTextField ).join(' ');

const hasEmail = token => emailRegex().test( token );
const getEmail = token => hasEmail( token ) ? token.match( emailRegex() ): null;
const getAffiliation = AffiliationInfo => {
  const Affiliation = _.get( AffiliationInfo, ['Affiliation', '0'] );
  const email = getEmail( Affiliation );
  return { Affiliation, email };
};

const getAffiliationInfo = Author => {
  const AffiliationInfo = _.get( Author, ['AffiliationInfo'] );
  return AffiliationInfo ?  AffiliationInfo.map( getAffiliation ): null;
  //compact all affiliations and emails. todo
};

const getIdentifier = Author => {
  return _.get( Author, 'Identifier' ).map( i =>
    ({
      id: _.get( i, '_' ),
      Source: _.get( i, ['$', 'Source'] )
    })
  );
};

const getNamed = ( Named ) => {
  const name = {
    LastName: null,
    ForeName: null,
    Initials: null,
    CollectiveName: null
  };

  if ( _.has( Named, 'CollectiveName' ) ){
    _.set( name, 'CollectiveName', _.get( Named, ['CollectiveName', '0'] ) );

  } else {
    _.set( name, 'LastName', _.get( Named, ['LastName', '0'] ) );

    if ( _.has( Named, ['ForeName'] ) ) {
      _.set( name, 'ForeName', _.get( Named, ['ForeName', '0'] ) );
    }

    if( _.has( Named, ['Initials'] ) ){
      _.set( name, 'Initials', _.get( Named, ['Initials', '0'] ) );
    }
  }
  const AffiliationInfo = _.has( Named, 'AffiliationInfo' ) ? getAffiliationInfo( Named ): null;
  const Identifier = _.has( Named, 'Identifier' ) ? getIdentifier( Named ): null;
  return _.assign( {}, name, { AffiliationInfo, Identifier }) ;
};

//<!ELEMENT	AuthorList (Author+) >
const getAuthor = AuthorList => {
  // <!ELEMENT	Author ( ( ( LastName, ForeName?, Initials?, Suffix? ) | CollectiveName ), Identifier*, AffiliationInfo* ) >
  return _.get( AuthorList, ['Author'] ).map( getNamed );
};

const getAuthorList = Article => {
  const AuthorList = _.get( Article, ['AuthorList', '0'] );
  return AuthorList ? getAuthor( AuthorList ): null;
};

//<!ELEMENT	PubDate ( ( Year, ((Month, Day?) | Season)? ) | MedlineDate ) >
const getPubDate = JournalIssue => {
  let date;
  const PubDate = _.get( JournalIssue, ['PubDate', '0'] );

  if( _.has( PubDate, 'MedlineDate' ) ) {
    date = ({ MedlineDate:  _.get( PubDate, ['MedlineDate', '0'] ) });

  } else {
    const Year = _.get( PubDate, ['Year', '0'] );

    if( _.has( PubDate, 'Season' ) ) {
      const Season = _.get( PubDate, ['Season', '0'] );
      date = ({ Year, Season });

    } else {
      const Month = _.get( PubDate, ['Month', '0'] );
      const Day = _.get( PubDate, ['Day', '0'], null );
      date = ({ Year, Month, Day });
    }
  }
  return date;
};

const getJournal = Article => {
  //<!ELEMENT	Journal (ISSN?, JournalIssue, Title?, ISOAbbreviation?)>
  const Journal = _.get( Article, ['Journal', '0'] );
  const Title = _.get( Journal, ['Title', '0'], null );
  const ISSN = _.get( Journal, ['ISSN', '0', '_' ], null );
  const ISOAbbreviation = _.get( Journal, ['ISOAbbreviation', '0'], null );
  //<!ELEMENT	JournalIssue (Volume?, Issue?, PubDate) >
  const JournalIssue = _.get( Journal, ['JournalIssue', '0'] );
  const Volume = _.get( JournalIssue, ['Volume', '0'], null );
  const Issue = _.get( JournalIssue, ['Issue', '0'], null );
  const PubDate = getPubDate( JournalIssue );

  return {
    Title,
    JournalIssue: {
      Volume,
      Issue,
      PubDate
    },
    ISSN,
    ISOAbbreviation
  };
};

const getArticle = MedlineCitation => {
  // <!ELEMENT	Article (Journal,ArticleTitle,((Pagination, ELocationID*) | ELocationID+),
  //                    Abstract?,AuthorList?, Language+, DataBankList?, GrantList?,
  //                    PublicationTypeList, VernacularTitle?, ArticleDate*) >
  const Article = _.get( MedlineCitation, ['Article', '0'] );

  //<!ELEMENT	ArticleTitle   (%text; | mml:math)*>
  const ArticleTitle = getTextField( _.get( Article, ['ArticleTitle', '0'] ) );

  // <!ELEMENT	Abstract (AbstractText+, CopyrightInformation?)>
  const Abstract = _.has( Article, ['Abstract'] ) ? getAbstract( Article ): null;
  const AuthorList =  _.has( Article, ['AuthorList'] ) ? getAuthorList( Article ): null;
  const Journal = getJournal( Article );

  return {
    Journal,
    ArticleTitle,
    Abstract,
    AuthorList
  };
};

// RegistryNumber https://www.nlm.nih.gov/bsd/mms/medlineelements.html#rn
const getChemical = Chemical => ({
  RegistryNumber: _.get( Chemical, ['RegistryNumber', '0'] ),
  NameOfSubstance: _.get( Chemical, ['NameOfSubstance', '0', '_'] ),
  UI: _.get( Chemical, ['NameOfSubstance', '0', '$', 'UI'] )
});
const getChemicalList = MedlineCitation => _.get( MedlineCitation, ['ChemicalList', '0', 'Chemical'] ).map( getChemical );

// <!ELEMENT	KeywordList (Keyword+) >
// <!ATTLIST	KeywordList
// 		    Owner (NLM | NLM-AUTO | NASA | PIP | KIE | NOTNLM | HHS) "NLM" >
const getKeywordList = KeywordList => _.get( KeywordList, ['Keyword'] ).map( Keyword => _.get( Keyword, ['_'] ) );

// <!ELEMENT	MeshHeading (DescriptorName, QualifierName*)>
const getMeshHeading = MeshHeading => {
  // <!ELEMENT	DescriptorName (#PCDATA) >
  // <!ATTLIST	DescriptorName
  //         MajorTopicYN (Y | N) "N"
  //         Type (Geographic) #IMPLIED
  //          UI CDATA #REQUIRED >
  const DescriptorName = _.get( MeshHeading, ['DescriptorName', '0'] );
  return ({
    DescriptorName: _.get( DescriptorName, ['_'] ),
    ID: _.get( DescriptorName, ['$', 'UI'] ),
    isMajorTopicYN: _.get( DescriptorName, ['$', 'MajorTopicYN'] ) === 'Y' ? true : false
  });
};

const getMeshheadingList = MedlineCitation => {
  const MeshHeadingList = _.get( MedlineCitation, ['MeshHeadingList', '0', 'MeshHeading'] );
  return MeshHeadingList.map( getMeshHeading );
};

const getInvestigator = InvestigatorList => _.get( InvestigatorList, ['Investigator'] ).map( getNamed ).map( i => _.omit( i, ['CollectiveName'] ) );

const getInvestigatorList = MedlineCitation => {
  const InvestigatorList = _.get( MedlineCitation, ['InvestigatorList', '0'] );
  return InvestigatorList ? getInvestigator( InvestigatorList ): null;
};

const getMedlineCitation = PubmedArticle => {
  //<!ELEMENT	MedlineCitation
  //    (PMID, DateCompleted?, DateRevised?, Article,
  //     MedlineJournalInfo, ChemicalList?, SupplMeshList?,CitationSubset*,
  //     CommentsCorrectionsList?, GeneSymbolList?, MeshHeadingList?,
  //     NumberOfReferences?, PersonalNameSubjectList?, OtherID*, OtherAbstract*,
  //     KeywordList*, CoiStatement?, SpaceFlightMission*, InvestigatorList?, GeneralNote*)>
  const MedlineCitation = _.get( PubmedArticle, ['MedlineCitation', '0'] );

  const Article = getArticle( MedlineCitation );
  const ChemicalList = _.has( MedlineCitation, ['ChemicalList'] ) ? getChemicalList( MedlineCitation ): null;
  const KeywordList = _.has( MedlineCitation, ['KeywordList'] ) ? _.flatten( _.get( MedlineCitation, ['KeywordList'] ).map( getKeywordList ) ): null;
  const MeshheadingList = _.has( MedlineCitation, ['MeshHeadingList'] ) ? getMeshheadingList( MedlineCitation ): null;
  const InvestigatorList = _.has( MedlineCitation, ['InvestigatorList'] ) ? getInvestigatorList( MedlineCitation ): null;

  return {
    Article,
    ChemicalList,
    KeywordList,
    MeshheadingList,
    InvestigatorList
  };

};

//
const getPubMedPubDate = PubMedPubDateIn => {
  const PubStatus = _.get( PubMedPubDateIn, ['$', 'PubStatus'] );
  const Year = _.get( PubMedPubDateIn, ['Year', '0'] );
  const Month = _.get( PubMedPubDateIn, ['Month', '0'] );
  const Day = _.get( PubMedPubDateIn, ['Day', '0'] );
  const PubMedPubDate = { Year, Month, Day };
  return { PubStatus, PubMedPubDate };
};

const getHistory = PubmedData => {
  return _.get( PubmedData, ['History', '0', 'PubMedPubDate' ], [] ).map( getPubMedPubDate );
};

const VALID_PMDATA_ID_TYPES = new Set([ 'doi', 'pmc', 'pmcid', 'pubmed' ]);
const getArticleId = ArticleId => {
  const IdType = _.get( ArticleId, ['$', 'IdType'] );
  if ( !VALID_PMDATA_ID_TYPES.has( IdType ) ) return null;
  return ({
    IdType,
    id: _.get( ArticleId, ['_'])
  });
};
const getArticleIdList = json => _.get( json, ['ArticleIdList', '0', 'ArticleId'] ).map( getArticleId ).filter( notNull );

// <!ELEMENT	Reference (Citation, ArticleIdList?) >
const getReference = Reference => {
  const Citation = _.get( Reference, ['Citation', '0'] );
  const ArticleIdList = _.has( Reference, ['ArticleIdList'] ) ? getArticleIdList( Reference ): null;
  return { Citation, ArticleIdList };
};

// <!ELEMENT	ReferenceList (Title?, Reference*, ReferenceList*) >
const getReferenceList = ReferenceList => _.has( ReferenceList, ['Reference'] ) ?  _.get( ReferenceList, ['Reference'] ).map( getReference ): null;

// <!ELEMENT	PubmedData (History?, PublicationStatus, ArticleIdList, ObjectList?, ReferenceList*) >
const getPubmedData = PubmedArticle => {  // ? optional;
  const PubmedData = _.get( PubmedArticle, ['PubmedData', '0' ] );
  const History = _.has( PubmedData, ['History']) ? getHistory( PubmedData ): null;
  const ArticleIdList = getArticleIdList( PubmedData );
  const ReferenceList = _.has( PubmedData, ['ReferenceList']) ? _.flatten( _.get( PubmedData, ['ReferenceList'] ).map( getReferenceList ) ): null;
  return { History, ArticleIdList, ReferenceList };
};

const getPubmedArticle = PubmedArticle => {
  // <!ELEMENT	PubmedArticle (MedlineCitation, PubmedData?)>
  const MedlineCitation = getMedlineCitation( PubmedArticle );
  const PubmedData =  _.has( PubmedArticle, ['PubmedData'] ) ? getPubmedData( PubmedArticle ): null;
  return { MedlineCitation, PubmedData };
};

const getPubmedArticleSet = json => {
  const PubmedArticleSet = _.get( json, ['PubmedArticleSet'] );
  if( !PubmedArticleSet ) return null;

  // <!ELEMENT	PubmedArticleSet ((PubmedArticle | PubmedBookArticle)+, DeleteCitation?) >
  const PubmedArticle = _.get( PubmedArticleSet, ['PubmedArticle'] );
  return PubmedArticle ? PubmedArticle.map( getPubmedArticle ): null;
};

// XML DTD: "https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_190101.dtd"
const processPubmedResponse = json => {
  const PubmedArticleSet = getPubmedArticleSet( json );
  return { PubmedArticleSet };
  // return json;
};

const pubmedDataConverter = async json => processPubmedResponse( json );
const toText = res => res.text();
const xml2json = async xml => await xml2js.parseStringPromise( xml );

const checkEfetchResult = json => {
  const errorMessage =  _.get( json, ['eFetchResult', 'ERROR'] );
  if( errorMessage ) throw new Error( errorMessage );
  return json;
};

const eFetchPubmed = ( { uids, query_key, webenv } )=> {
  let params;
  if( !_.isEmpty( uids ) ){
    // Check that uid are string versions of numbers. '2349c87' will be interpreted by Pubmed as '2439'.
    params = _.assign( {}, DEFAULT_EFETCH_PARAMS, { id: uids.join(',') } );

  } else if( query_key && webenv ){
    params = _.assign( {}, DEFAULT_EFETCH_PARAMS, { query_key, webenv } );

  } else {
    throw new Error( 'eFetchPubmed requires either uids or history parameters.' );
  }

  const url = EUTILS_FETCH_URL + '?' + queryString.stringify( params );
  const userAgent = `${process.env.npm_package_name}/${process.env.npm_package_version}`;
  return fetch( url, {
    method: 'GET',
    headers: {
      'User-Agent': userAgent
    }
  }) // FetchError
  .then( checkHTTPStatus ) // HTTPStatusError
  .then( toText )
  .then( xml2json )
  .then( checkEfetchResult ) //Error
  .then( pubmedDataConverter );
};

/**
 * fetchPubmed
 * Fetch records from the PubMed database given matching UIDs.
 * Either a list of uids or, alternatively, a ( query_key, webenv ) pair resulting from a
 * pubmed search (i.e. searchPubmed function) can be used as parameters.
 *
 * @param { Object } uids The list of uids.
 * @param { String } query_key See {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.ESearch|EUTILS docs }
 * @param { String } webenv See {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.ESearch|EUTILS docs }
 * @returns { Object } result The fetch result from PubMed. See pubmedDataConverter.
 */
const fetchPubmed = ( { uids, query_key, webenv } ) => eFetchPubmed( { uids, query_key, webenv } );

export { fetchPubmed, pubmedDataConverter };