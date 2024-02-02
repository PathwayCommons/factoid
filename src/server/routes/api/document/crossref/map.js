import _ from 'lodash';
import { format } from 'date-fns';
import { createPubmedArticle } from '../../../../../util/pubmed';

/**
 * getAbstract
 *
 * Drop jats markup, minima formatting where necessary.
 *
 * @param {string} abstract the abstract
 * @returns string absent any [JATS tags]{@link https://jats.nlm.nih.gov/publishing/0.4/xsd.html}
 */
const getAbstract = abstract => {
  const formatTitles = str => str && str.replace(/<jats:title>(.+?)<\/jats:title>/g, '$1. ');
  const dropJatsTags = str => str && str.replace(/<\/?jats:[^>]*>/g, '');
  let clean = formatTitles(abstract);
  clean = dropJatsTags(clean);
  return clean;
};

const asAuthorList = author => {
  const getAuthorIds = ({ ORCID: id }) => {
    const ids = [];
    if( id ) ids.push({ Source: 'ORCID', id });
    return ids;
  };
  const getAuthorAffiliationInfo = ({ affiliation }) => {
    return affiliation.map( ({ name }) => ({
      Affiliation: name,
      email: null
    }));
  };
  const asAuthor = a => {
    const Author = {
      AffiliationInfo: [],
      CollectiveName: null,
      ForeName: null,
      Identifier: [],
      Initials: null,
      LastName: null
    };
    const hasCollectiveName = _.has( a, 'name' ) && !_.has( a, 'family' );
    if( hasCollectiveName ){
      _.set( Author, 'CollectiveName', _.get( a, 'name' ) );
    } else {
      _.set( Author, 'LastName', _.get( a, 'family', null ) );
      _.set( Author, 'ForeName', _.get( a, 'given', null ) );
      _.set( Author, 'Identifier', getAuthorIds( a ) );
      _.set( Author, 'AffiliationInfo', getAuthorAffiliationInfo( a ) );
    }

    return Author;
  };
  return author && author.map( asAuthor );
};

/**
 * getPubDate
 *
 * Get the (nearest approximation to a) publication date.
 * @param {object} record the Crossref Work item
 * @returns the PubDate ( Year, ( Month, Day? )? )
 */
const getPubDate = record => {
  const PubDate = {};
  const dateElts = ['Year', 'Month', 'Day'];
  const { posted, published, created } = record;
  let date = posted || published || created;
  let { 'date-parts': dateParts } = date;
  date = _.flattenDeep(dateParts);

  date.forEach( (v, i) => {
    if( i == 1 ){
      // Convert month value to three letter format
      const dateWithOffset = [...date];
      --dateWithOffset[i];
      const d = new Date(...dateWithOffset);
      v = format( d, 'LLL' );
    }
    PubDate[dateElts[i]] = v + '';
  });

  return PubDate;
};

const getPostedContent = record => {
  const getJournalIssue = record => {
    const PubDate = getPubDate( record );
    const JournalIssue = { PubDate };
    return JournalIssue;
  };
  const { institution, 'group-title': groupTitle, publisher } = record;
  let Title;
  if ( institution ) { // preprint (e.g. bioRxiv, medRxiv)
    const { name } = _.head( institution );
    Title = name;
  } else if ( groupTitle ) { // preprint (e.g. eLife)
    Title = groupTitle;
  } else {
    Title = publisher;
  }
  const JournalIssue = getJournalIssue( record );
  const Journal = { Title, JournalIssue };
  return Journal;
};

const getJournalArticle = record => {
  const getJournalIssue = record => {
    const { volume: Volume, issue: Issue } = record;
    const PubDate = getPubDate( record );
    const JournalIssue = { Volume, Issue, PubDate };
    return JournalIssue;
  };
  const { 'container-title': containerTitle, ISSN: issn, 'issn-type': issnType } = record;
  let Title, ISSN;
  if ( containerTitle ) Title = _.head(containerTitle);
  if ( issn && issnType ){
    const { type: IssnType, value } = _.head( issnType );
    ISSN = { IssnType, value };
  }
  const JournalIssue = getJournalIssue( record );
  const Journal = { Title, ISSN, JournalIssue };
  return Journal;
};

const getJournal = record => {
  const { type } = record;
  let Journal;
  switch (type) {
    case 'posted-content':
      Journal = getPostedContent(record);
      break;
    default:
      Journal = getJournalArticle(record);
  }
  return Journal;
};

const getPublicationTypeList = record => {
  // Publication Types: https://www.nlm.nih.gov/mesh/pubtypes.html
  // MeSH Publication Formats: https://meshb.nlm.nih.gov/record/ui?ui=D052180
  // CrossRef work types: https://api.crossref.org/v1/types
  const CRTYPE_MESH_MAP = new Map([
    ['preprint', {
      UI: 'D000076942',
      value: 'Preprint'
    }],
    ['journal-article', {
      UI: 'D016428',
      value: 'Journal Article'
    }],
    ['dataset', {
      UI: 'D064886',
      value: 'Dataset'
    }],
    ['proceedings', {
      UI: 'D016423',
      value: 'Congress'
    }],
    ['dissertation', {
      UI: 'D019478',
      value: 'Academic Dissertation'
    }]
  ]);
  const { type, subtype } = record;
  let itemType = subtype || type;
  let PublicationType = CRTYPE_MESH_MAP.get( itemType );
  let PublicationTypeList = _.compact([ PublicationType ]);
  return PublicationTypeList;
};

const getMedlineCitation = record => {
  const { abstract, title, author } = record;
  const Abstract = getAbstract( abstract );
  const ArticleTitle = _.head ( title );
  const AuthorList = asAuthorList( author );
  const Journal = getJournal( record );
  const PublicationTypeList = getPublicationTypeList( record );
  const MedlineCitation = { Article: { Abstract, ArticleTitle, AuthorList, Journal, PublicationTypeList } };
  return MedlineCitation;
};

const getPubmedData = record => {
  const { DOI } = record;
  const ArticleIdList = [{ IdType: 'doi', id: DOI }];
  const PubmedData = { ArticleIdList };
  return PubmedData;
};

/**
 * toPubMedArticle
 *
 * Map a CrossRef work to a [PubMedArticle]{@link https://dtd.nlm.nih.gov/ncbi/pubmed/out/pubmed_230101.dtd}.
 *
 * @param {object} record the CrossRef message/item
 * @return object consistent with PubMedArticle schema
 */
const toPubMedArticle = record => {
  const defaults = createPubmedArticle({});
  const MedlineCitation = getMedlineCitation( record );
  const PubmedData = getPubmedData( record );

  const PubMedArticle = _.merge( defaults, { MedlineCitation, PubmedData } );
  return PubMedArticle;
};

export { toPubMedArticle };