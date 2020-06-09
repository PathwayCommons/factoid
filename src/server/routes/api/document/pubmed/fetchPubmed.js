import _ from 'lodash';
import convert from 'xml-js';
import queryString from 'query-string';
import fetch from 'node-fetch';
import emailRegex from 'email-regex';
import { URLSearchParams } from 'url';

import { NCBI_EUTILS_BASE_URL, NCBI_EUTILS_API_KEY } from '../../../../../config';
import { checkHTTPStatus } from '../../../../../util';

const EUTILS_FETCH_URL = NCBI_EUTILS_BASE_URL + 'efetch.fcgi';
const DEFAULT_EFETCH_PARAMS = {
  db: 'pubmed',
  retmode: 'xml',
  retstart: 0,
  api_key: NCBI_EUTILS_API_KEY
};

const getElementByName = ( json, name ) => _.find( _.get( json, ['elements'] ), ['name', name ] ) || null;
const getElementsByName = ( json, name ) => _.filter( _.get( json, ['elements'] ), ['name', name ] );
const getElementAttribute = ( json, name ) => _.get( json, [ 'attributes', name ] );
const getElementText = element => {
  const textFields = _.get( element, 'elements' ).map( subElement => {
    if( _.get( subElement, 'type' ) === 'text' ){
      return _.get( subElement, 'text' ); // Base case
    } else {
      return getElementText( subElement  );// Recurse into element
    }
  });
  return textFields.join('');
};

// <!ELEMENT	AbstractText   (%text; | mml:math | DispFormula)* >
// <!ATTLIST	AbstractText
// 		    Label CDATA #IMPLIED
// 		    NlmCategory (BACKGROUND | OBJECTIVE | METHODS | RESULTS | CONCLUSIONS | UNASSIGNED) #IMPLIED >
const getAbstract = Article => {
  const Abstract = getElementByName( Article, 'Abstract' );
  return getElementsByName( Abstract, 'AbstractText' ).map( getElementText ).join(' ');
};

const hasEmail = token => emailRegex().test( token );
const getEmail = token => hasEmail( token ) ? token.match( emailRegex() ): null;

// <!ELEMENT	Affiliation  (%text;)*>
const getAffiliation = AffiliationElement => {
  const Affiliation = getElementText( AffiliationElement );
  const email = getEmail( Affiliation );
  return { Affiliation, email };
};

// <!ELEMENT	AffiliationInfo (Affiliation, Identifier*)>
const getAffiliationInfo = AffiliationInfo => {
  const Affiliation = getElementByName( AffiliationInfo, 'Affiliation' );
  return getAffiliation( Affiliation );
};

// <!ELEMENT	Identifier (#PCDATA) >
// <!ATTLIST	Identifier
// 		    Source CDATA #REQUIRED >
const getIdentifier = IdentifierElement => {
  return {
    id: getElementText( IdentifierElement ),
    Source: getElementAttribute( IdentifierElement, 'Source' )
  };
};

// <!ELEMENT	Author ( ( ( LastName, ForeName?, Initials?, Suffix? ) | CollectiveName ), Identifier*, AffiliationInfo* ) >
// <!ATTLIST	Author
//             ValidYN (Y | N) "Y"
//             EqualContrib    (Y | N)  #IMPLIED >
const getNamed = Named => {
  const name = {
    LastName: null,
    ForeName: null,
    Initials: null,
    CollectiveName: null
  };

  if ( getElementByName( Named, 'CollectiveName' ) ){
    _.set( name, 'CollectiveName', getElementText( getElementByName( Named, 'CollectiveName' ) ) );

  } else {
    _.set( name, 'LastName', getElementText( getElementByName( Named, 'LastName' ) ) );

    if ( getElementByName( Named, 'ForeName' ) ) {
      _.set( name, 'ForeName',  getElementText( getElementByName( Named, 'ForeName' ) ) );
    }

    if( getElementByName( Named, 'Initials' ) ){
      _.set( name, 'Initials', getElementText( getElementByName( Named, 'Initials' ) ) );
    }
  }

  const AffiliationInfo = getElementsByName( Named, 'AffiliationInfo' ).map( getAffiliationInfo );
  const Identifier = getElementsByName( Named, 'Identifier' ).map( getIdentifier );

  return _.assign( {}, name, { AffiliationInfo, Identifier }) ;
};

//<!ELEMENT	AuthorList (Author+) >
// <!ATTLIST	AuthorList
//             CompleteYN (Y | N) "Y"
//             Type ( authors | editors )  #IMPLIED >
const getAuthorList = Article => {
  const AuthorList = getElementByName( Article, 'AuthorList' );
  return getElementsByName( AuthorList, 'Author' ).map( getNamed );
};

//<!ELEMENT	PubDate ( ( Year, ((Month, Day?) | Season)? ) | MedlineDate ) >
const getPubDate = JournalIssue => {
  let date;
  const PubDate = getElementByName( JournalIssue, 'PubDate' );

  if( getElementByName( PubDate, 'MedlineDate' ) ) {
    date = ({ MedlineDate: getElementText( getElementByName( PubDate, 'MedlineDate' ) )});

  } else {
    const Year = getElementText(  getElementByName( PubDate, 'Year' ) );

    if( getElementByName( PubDate, 'Season' ) ) {
      // <!ELEMENT	Season (#PCDATA) >
      const Season = getElementText(  getElementByName( PubDate, 'Season' ) );
      date = ({ Year, Season });

    } else {
      let Month = null, Day = null;

      if( getElementByName( PubDate, 'Month' ) ){
        Month = getElementText( getElementByName( PubDate, 'Month' ) );
      }

      if( getElementByName( PubDate, 'Day' ) ){
        Day = getElementText( getElementByName( PubDate, 'Day' ) );
      }

      date = ({ Year, Month, Day });
    }
  }
  return date;
};

//<!ELEMENT	ISSN (#PCDATA) >
//<!ATTLIST	ISSN
    // IssnType  (Electronic | Print) #REQUIRED >
const getISSN = Journal => {
  const ISSN = getElementByName( Journal, 'ISSN' );
  const IssnType = getElementAttribute( ISSN, 'IssnType' );
  const value = getElementText( ISSN );
  return ({ IssnType, value });
};

const getJournal = Article => {
  //<!ELEMENT	Journal (ISSN?, JournalIssue, Title?, ISOAbbreviation?)>
  const Journal = getElementByName( Article, 'Journal' );
  const Title = getElementByName( Journal, 'Title' ) && getElementText( getElementByName( Journal, 'Title' ) );
  const ISSN = getElementByName( Journal, 'ISSN' ) ? getISSN( Journal ) : null;
  const ISOAbbreviation = getElementByName( Journal, 'ISOAbbreviation' ) && getElementText( getElementByName( Journal, 'ISOAbbreviation' ) );
  //<!ELEMENT	JournalIssue (Volume?, Issue?, PubDate) >
  //<!ATTLIST	JournalIssue
	//    CitedMedium (Internet | Print) #REQUIRED >
  const JournalIssue = getElementByName( Journal, 'JournalIssue' );
  const Volume = getElementByName( JournalIssue, 'Volume' ) && getElementText( getElementByName( JournalIssue, 'Volume' ) );
  const Issue =  getElementByName( JournalIssue, 'Issue' ) && getElementText( getElementByName( JournalIssue, 'Issue' ) );
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
  // <!ATTLIST	Article
	// 	    PubModel (Print | Print-Electronic | Electronic | Electronic-Print | Electronic-eCollection) #REQUIRED >
  const Article = getElementByName( MedlineCitation, 'Article' );

  //<!ELEMENT	ArticleTitle   (%text; | mml:math)*>
  const ArticleTitle = getElementText( getElementByName( Article, 'ArticleTitle' ) );

  // <!ELEMENT	Abstract (AbstractText+, CopyrightInformation?)>
  const Abstract = getElementByName( Article, 'Abstract' ) ? getAbstract( Article ): null;
  const AuthorList =  getElementByName( Article, 'AuthorList' ) ? getAuthorList( Article ): null;
  const Journal = getJournal( Article );

  return {
    Journal,
    ArticleTitle,
    Abstract,
    AuthorList
  };
};

// <!ELEMENT	Chemical (RegistryNumber, NameOfSubstance) >
// <!ELEMENT	RegistryNumber (#PCDATA) >
// <!ELEMENT	NameOfSubstance (#PCDATA) >
// <!ATTLIST	NameOfSubstance
// 		    UI CDATA #REQUIRED >
// RegistryNumber https://www.nlm.nih.gov/bsd/mms/medlineelements.html#rn
const getChemical = Chemical => {
  const RegistryNumber = getElementText( getElementByName( Chemical, 'RegistryNumber' ) );
  const NameOfSubstanceElement = getElementByName( Chemical, 'NameOfSubstance' );
  const NameOfSubstance = {
    value: getElementText( NameOfSubstanceElement ),
    UI: getElementAttribute( NameOfSubstanceElement, 'UI' )
  };

  return { RegistryNumber, NameOfSubstance };
};

// <!ELEMENT	ChemicalList (Chemical+) >
const getChemicalList = MedlineCitation => {
  const ChemicalList = getElementByName( MedlineCitation, 'ChemicalList' );
  return getElementsByName( ChemicalList, 'Chemical' ).map( getChemical );
};

// <!ELEMENT	KeywordList (Keyword+) >
// <!ATTLIST	KeywordList
// 		    Owner (NLM | NLM-AUTO | NASA | PIP | KIE | NOTNLM | HHS) "NLM" >
const getKeywordList = MedlineCitation => {
  const KeywordList = getElementByName( MedlineCitation, 'KeywordList' );
  return getElementsByName( KeywordList, 'Keyword' ).map( getElementText );
};

// <!ELEMENT	MeshHeading (DescriptorName, QualifierName*)>
// <!ELEMENT	DescriptorName (#PCDATA) >
// <!ATTLIST	DescriptorName
//         MajorTopicYN (Y | N) "N"
//         Type (Geographic) #IMPLIED
//          UI CDATA #REQUIRED >
// <!ELEMENT	QualifierName (#PCDATA) >
// <!ATTLIST	QualifierName
//         MajorTopicYN (Y | N) "N"
//         UI CDATA #REQUIRED >
const getMeshHeading = MeshHeading => {
  const getIDInfo = info => ({
    value: getElementText( info ),
    UI: getElementAttribute( info, 'UI' ),
    MajorTopicYN: getElementAttribute( info, 'MajorTopicYN' ),
  });

  const DescriptorNameElement = getElementByName( MeshHeading, 'DescriptorName' );
  const QualifierNameElements = getElementsByName( MeshHeading, 'QualifierName' );
  const DescriptorName = getIDInfo( DescriptorNameElement );
  const QualifierName = QualifierNameElements.map( getIDInfo );

  return { DescriptorName, QualifierName };
};

// <!ELEMENT	MeshHeading (DescriptorName, QualifierName*)>
// <!ELEMENT	MeshHeadingList (MeshHeading+)>
const getMeshheadingList = MedlineCitation => {
  const MeshHeadingList = getElementByName( MedlineCitation, 'MeshHeadingList' );
  return getElementsByName( MeshHeadingList, 'MeshHeading' ).map( getMeshHeading );
};

// <!ELEMENT	InvestigatorList (Investigator+) >
// <!ELEMENT	Investigator (LastName, ForeName?, Initials?, Suffix?, Identifier*, AffiliationInfo*) >
// <!ATTLIST	Investigator
// 		    ValidYN (Y | N) "Y" >
const getInvestigator = Investigator => _.omit( getNamed( Investigator ), ['CollectiveName'] );

const getInvestigatorList = MedlineCitation => {
  const InvestigatorList = getElementByName( MedlineCitation, 'InvestigatorList' );
  return getElementsByName( InvestigatorList, 'Investigator' ).map( getInvestigator );
};

const getMedlineCitation = PubmedArticle => {
  //<!ELEMENT	MedlineCitation
  //    (PMID, DateCompleted?, DateRevised?, Article,
  //     MedlineJournalInfo, ChemicalList?, SupplMeshList?,CitationSubset*,
  //     CommentsCorrectionsList?, GeneSymbolList?, MeshHeadingList?,
  //     NumberOfReferences?, PersonalNameSubjectList?, OtherID*, OtherAbstract*,
  //     KeywordList*, CoiStatement?, SpaceFlightMission*, InvestigatorList?, GeneralNote*)>
  // <!ATTLIST	MedlineCitation
	// 	Owner  (NLM | NASA | PIP | KIE | HSR | HMD | NOTNLM) "NLM"
	// 	Status (Completed | In-Process | PubMed-not-MEDLINE |  In-Data-Review | Publisher |
	// 	        MEDLINE | OLDMEDLINE) #REQUIRED
	// 	VersionID CDATA #IMPLIED
	// 	VersionDate CDATA #IMPLIED
	// 	IndexingMethod    CDATA  #IMPLIED >
  const MedlineCitation = getElementByName( PubmedArticle, 'MedlineCitation' );

  const Article = getArticle( MedlineCitation );
  const ChemicalList = getElementByName( MedlineCitation, 'ChemicalList' ) ? getChemicalList( MedlineCitation ): [];
  const KeywordList = getElementByName( MedlineCitation, 'KeywordList' ) ? getKeywordList( MedlineCitation ): [];
  const MeshheadingList = getElementByName( MedlineCitation, 'MeshHeadingList' ) ? getMeshheadingList( MedlineCitation ): [];
  const InvestigatorList = getElementByName( MedlineCitation, 'InvestigatorList' ) ? getInvestigatorList( MedlineCitation ): [];

  return {
    Article,
    ChemicalList,
    KeywordList,
    MeshheadingList,
    InvestigatorList
  };

};

// <!ELEMENT   PubMedPubDate (Year, Month, Day, (Hour, (Minute, Second?)?)?)>
// <!ATTLIST   PubMedPubDate
//     	     PubStatus (received | accepted | epublish |
//                       ppublish | revised | aheadofprint |
//                       retracted | ecollection | pmc | pmcr | pubmed | pubmedr |
//                       premedline | medline | medliner | entrez | pmc-release) #REQUIRED >
const getPubMedPubDate = getPubMedPubDateElement => {
  const PubStatus = getElementAttribute( getPubMedPubDateElement, 'PubStatus' );
  const Year = getElementText( getElementByName( getPubMedPubDateElement, 'Year' ) );
  const Month = getElementText( getElementByName( getPubMedPubDateElement, 'Month' ) );
  const Day = getElementText( getElementByName( getPubMedPubDateElement, 'Day' ) );
  const PubMedPubDate = { Year, Month, Day };
  return { PubStatus, PubMedPubDate };
};

// <!ELEMENT	History (PubMedPubDate+) >
const getHistory = PubmedData => {
  const History = getElementByName( PubmedData, 'History' );
  return getElementsByName( History, 'PubMedPubDate' ).map( getPubMedPubDate );
};

// <!ELEMENT	ArticleId (#PCDATA) >
// <!ATTLIST   ArticleId
// 	        IdType (doi | pii | pmcpid | pmpid | pmc | mid |
//                    sici | pubmed | medline | pmcid | pmcbook | bookaccession) "pubmed" >
const getArticleId = ArticleIdElement => {
  const IdType = getElementAttribute( ArticleIdElement, 'IdType' );
  const id = getElementText( ArticleIdElement );
  return { IdType, id };
};

//  <!ELEMENT	ArticleIdList (ArticleId+)>
const getArticleIdList = element => {
  const ArticleIdList = getElementByName( element, 'ArticleIdList' );
  return getElementsByName( ArticleIdList, 'ArticleId' ).map( getArticleId );
};

// <!ELEMENT	Reference (Citation, ArticleIdList?) >
// <!ELEMENT	Citation       (%text; | mml:math)*>
const getReference = ReferenceElement => {
  const Citation = getElementText( getElementByName( ReferenceElement, 'Citation' ) );
  const ArticleIdList = getElementByName( ReferenceElement, 'ArticleIdList' ) ? getArticleIdList( ReferenceElement ): null;
  return { Citation, ArticleIdList };
};

// <!ELEMENT	ReferenceList (Title?, Reference*, ReferenceList*) >
const getReferenceList = ReferenceListElement => {
  const Title = getElementByName( ReferenceListElement, 'Title' ) ? getElementText( getElementByName( ReferenceListElement, 'Title' ) ) : null;
  const Reference = getElementsByName( ReferenceListElement, 'Reference' ).map( getReference );
  const ReferenceList = getElementsByName( ReferenceListElement, 'ReferenceList' ).map( getReferenceList );
  return { Title, Reference, ReferenceList };
};

// <!ELEMENT	PubmedData (History?, PublicationStatus, ArticleIdList, ObjectList?, ReferenceList*) >
const getPubmedData = PubmedArticle => {
  const PubmedData = getElementByName( PubmedArticle, 'PubmedData' );
  const History = getElementByName( PubmedData, 'History' ) ? getHistory( PubmedData ): null;
  const ArticleIdList = getArticleIdList( PubmedData );
  const ReferenceList = getElementsByName( PubmedData, 'ReferenceList' ).map( getReferenceList );
  return { History, ArticleIdList, ReferenceList };
};

// <!ELEMENT	PubmedArticle (MedlineCitation, PubmedData?)>
const getPubmedArticle = PubmedArticle => {
  const MedlineCitation = getMedlineCitation( PubmedArticle );
  const PubmedData = getElementByName( PubmedArticle, 'PubmedData' ) ? getPubmedData( PubmedArticle ): null;
  return { MedlineCitation, PubmedData };
};

const getPubmedArticleSet = json => {
  const PubmedArticleSet = getElementByName( json, 'PubmedArticleSet' );
  if( !PubmedArticleSet ) return null;

  // <!ELEMENT	PubmedArticleSet ((PubmedArticle | PubmedBookArticle)+, DeleteCitation?) >
  const PubmedArticle = getElementsByName( PubmedArticleSet, 'PubmedArticle' );
  return PubmedArticle ? PubmedArticle.map( getPubmedArticle ): null;
};

// XML DTD: "https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_190101.dtd"
const processPubmedResponse = json => {
  const PubmedArticleSet = getPubmedArticleSet( json );
  return { PubmedArticleSet };
};

const pubmedDataConverter = json => processPubmedResponse( json );
const toText = res => res.text();
const xml2jsOpts = {};
const xml2json = xml => convert.xml2js( xml, xml2jsOpts );

const checkEfetchResult = json => {
  const errorMessage =  _.get( json, ['eFetchResult', 'ERROR'] );
  if( errorMessage ) throw new Error( errorMessage );
  return json;
};

const eFetchPubmed = ( { uids, query_key, webenv, opts } )=> {
  let params = _.defaults( { id: uids, query_key, webenv }, opts, DEFAULT_EFETCH_PARAMS );
  const url = EUTILS_FETCH_URL;
  const userAgent = `${process.env.npm_package_name}/${process.env.npm_package_version}`;
  const body = new URLSearchParams( queryString.stringify( params ) );

  return fetch( url, {
    method: 'POST',
    headers: {
      'User-Agent': userAgent
    },
    body
  })
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
 * @param { Object } uids The array of uids
 * @param { String } query_key See {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.EFetch|EUTILS docs }
 * @param { String } webenv See {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.EFetch|EUTILS docs }
 * @param { Object } opts Specify EFETCH Optional Parameters – Retrieval {@link https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.EFetch|EUTILS docs }
 * @returns { Object } result The fetch result from PubMed. See pubmedDataConverter.
 */
const fetchPubmed = ( { uids, query_key, webenv, opts } ) => eFetchPubmed( { uids, query_key, webenv, opts } );

export { fetchPubmed, pubmedDataConverter };