import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';
import { DOI_LINK_BASE_URL, PUBMED_LINK_BASE_URL } from '../../config';

const MAX_PAPERS = 5;

class RelatedPapersLoading extends Component {
  render(){
    return h('div.related-papers.related-papers-loading', [
      h('div.related-papers-empty-icon', [
        h('i.icon.icon-spinner')
      ]),
      h('p.related-papers-loading-msg', [
        `Biofactoid is looking for other interesting articles.`,
        h('br'),
        `They'll be ready for you in a moment.`
      ])
    ]);
  }
}

class RelatedPaper extends Component {

  render(){
    const { title, authors: { abbreviation: author }, reference: journal, doi, pmid, pubTypes } = this.props.citation;
    let link = `${DOI_LINK_BASE_URL}${doi}`;
    if( !doi ) link = `${PUBMED_LINK_BASE_URL}${pmid}`;
    const isReview = _.find(  pubTypes, ["UI", "D016454"] ) === undefined ? false : true;

    return h('div.related-paper', [
      h('a.related-paper-title.related-paper-link', {
        href: link,
        target: '_blank'
      }, title),
      h('div.related-paper-author', author),
      h('div.related-paper-journal', [
        isReview ? h('span.related-paper-journal-badge.super-salient-button', 'Review'): null,
        journal
      ])
    ]);
  }
}

export class RelatedPapers extends Component {
  constructor(props){
    super(props);

    this.state = {
      papers: this.props.source.relatedPapers()
    };
  }

  componentDidMount(){
    this.onRefresh = () => {
      this.setState({ papers: this.props.source.relatedPapers() });
    };

    this.props.source.on('relatedpapers', this.onRefresh);
  }

  componentWillUnmount(){
    this.props.source.removeListener('relatedpapers', this.onRefresh);
  }

  render(){
    let { papers } = this.state;

    if( !papers ){
      return h( RelatedPapersLoading );
    } else {
      papers = papers.slice(0, MAX_PAPERS);
      return h('div.related-papers', papers.map( paper => h( RelatedPaper, { citation: paper.pubmed } ) ) );
    }
  }
}

export class EvidenceComponent extends Component {
  constructor(props){
    super(props);
  }

  render(){

    const { evidence } = this.props;
    const { source, citation } = evidence;

    // Format excerpts from the top evidence's sources
    let excerptComponent = null;
    const texts = _.compact( source.map( s => _.get( s, 'text' ) ) );
    const hasExcerpts = !_.isEmpty( texts );
    if( hasExcerpts ){
      let excerpts = texts.map( text => h('div.related-interaction-evidence-source-excerpt', text ) );
      excerptComponent = h('div.related-interaction-evidence-source-excerpts', excerpts );
    }

    let paperComponent = h('div.related-interaction-evidence-paper', [ h( RelatedPaper, { citation } ) ]);

    // Database/source names
    const isDatabaseType = s => s.type == 'db';
    const getSourceName = s => s.name;
    let sourceNames = source
      .filter( isDatabaseType )
      .map( getSourceName );
    sourceNames = _.uniqBy( sourceNames, 'name' );
    // names = _.filter( names, [ 'type', 'db' ] );
    let namesComponent = sourceNames.length ?
      h('div.related-interaction-evidence-sources', `Source: ${sourceNames.join( '; ' )}` ) :
      null;

    return h('div.related-interaction-evidence', [
        excerptComponent,
        paperComponent,
        namesComponent
    ]);
  }
}

export class RelatedInteraction extends Component {
  constructor(props){
    super(props);
  }

  render(){

    const { interaction } = this.props;
    const { evidence, sentence } = interaction;

    // Link to more evidence (i.e. papers for the interaction )
    let additionalEvidenceLink = null;
    let numArticles = evidence.length;
    let hasMoreEvidence = numArticles > 1;
    if( hasMoreEvidence ){
      additionalEvidenceLink = h('a.related-interaction-additional-evidence.related-paper-link', {
        target: '_blank'
      }, `Show more articles (${numArticles})` );
    }

    return h('div.related-interaction', [
      h('div.related-interaction-body', [
        h('div.related-interaction-meta', [
          h('div.related-interaction-sentence', sentence )
        ]),
        h( EvidenceComponent, { evidence: _.head( evidence ) })
      ]),
      h('div.related-interaction-footer', [
        additionalEvidenceLink
      ])
    ]);

  }
}


export class RelatedInteractions extends Component {
  constructor(props){
    super(props);

    this.state = {
      papers: this.props.source.relatedPapers()
    };
  }

  componentDidMount(){
    this.onRefresh = () => {
      this.setState({ papers: this.props.source.relatedPapers() });
    };

    this.props.source.on('relatedpapers', this.onRefresh);
  }

  componentWillUnmount(){
    this.props.source.removeListener('relatedpapers', this.onRefresh);
  }

  render(){
    let { papers } = this.state;

    // Haven't loaded yet
    if( !papers ) return h( RelatedPapersLoading );

    const emptyComponent = h('div.related-papers.related-papers-empty', [
      h('p.related-papers-empty-msg', 'There were no interactions found for the selected item' )
    ]);

    // Nothing here to show
    if( _.isEmpty( papers ) ) return emptyComponent;

    // Backwards-compatibility: Check schema { type, sentence, evidence, participants }
    let areInteractions = papers.every( paper => _.has( paper, 'evidence' ) && _.has( paper, 'sentence' ) );
    if( !areInteractions )  return emptyComponent;

    // OK - Display interactions
    const interactions = papers;
    return h('div.related-interactions',
              interactions.map( interaction => h( RelatedInteraction, { interaction } ) )
            );
  }
}

export default RelatedPapers;