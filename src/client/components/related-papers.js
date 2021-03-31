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

    return h('a.related-paper', {
      href: link,
      target: '_blank'
    }, [
      h('div.related-paper-title', title),
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

export class RelatedInteractions extends RelatedPapers {
  constructor(props){
    super(props);
  }

  render(){
    let { papers: interactions } = this.state;

    if( !interactions ){
      return h( RelatedPapersLoading );

    } else if( _.isEmpty( interactions ) ) {
      return h('div.related-papers.related-papers-empty', [
        h('p.related-papers-empty-msg', [
          `There weren't any interactions to show`
        ])
      ]);

    } else {
      return h('div.related-interactions', interactions.map( interaction => {
        const { evidence, sentence } = interaction;
        const { source, citation } = _.head( evidence );
        const { text } = _.head( source );
        let numArticles = evidence.length;
        let hasMoreEvidence = numArticles > 1;

        return h('div.related-interaction', [
          h('div.related-interaction-meta', [
            h('div.related-interaction-sentence', sentence ),
            hasMoreEvidence ? h('a.related-interaction-article-count.plain-link', {
              //todo href: ""
              target: '_blank'
            }, `Show more articles (${numArticles})` ) : null
          ]),
          h('div.related-interaction-detail', [
            text ? h('div.related-interaction-evidence-source-text', text ) : null,
            h('div.related-interaction-evidence-citation', [
              h( RelatedPaper, { citation } )
            ])
          ])
        ]);
      }));
    }
  }
}

export default RelatedPapers;