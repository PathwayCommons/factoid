import h from 'react-hyperscript';
import { Component } from 'react';
import { DOI_LINK_BASE_URL, PUBMED_LINK_BASE_URL } from '../../config';

const MAX_PAPERS = 6;

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
      return h('div.related-papers.related-papers-empty', [
        h('div.related-papers-empty-icon', [
          h('i.icon.icon-spinner')
        ]),
        h('p.related-papers-empty-msg', [
          `Biofactoid is looking for other interesting articles.`,
          h('br'),
          `They'll be ready for you in a moment.`
        ])
      ]);
    }

    papers = papers.slice(0, MAX_PAPERS);

    return h('div.related-papers', papers.map( paper => {
      const { pubmed: { title, authors: { abbreviation: author }, reference: journal, abstract, doi, pmid } } = paper;
      let link = `${DOI_LINK_BASE_URL}${doi}`;
      if( !doi ) link = `${PUBMED_LINK_BASE_URL}${pmid}`;

      return h('a.related-paper', {
        href: link,
        target: '_blank'
      }, [
        h('div.related-paper-title', [
          h('span.link-like.plain-link', title)
        ]),
        h('div.related-paper-abstract', abstract),
        h('div.related-paper-author', author),
        h('div.related-paper-journal', journal)
      ]);
    }));
  }
}

export default RelatedPapers;