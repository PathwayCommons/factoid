import h from 'react-hyperscript';
import { Component } from 'react';
import { DOI_LINK_BASE_URL, PUBMED_LINK_BASE_URL } from '../../config';

export class RelatedPapers extends Component {
  constructor(props){
    super(props);
  }

  render(){
    let { papers } = this.props;

    if( !papers ) return null;

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