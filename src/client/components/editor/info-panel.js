import h from 'react-hyperscript';
import { Component } from 'react';
import { DOI_LINK_BASE_URL, PUBMED_LINK_BASE_URL, GOOGLE_SCHOLAR_BASE_URL } from '../../../config';

export class InfoPanel extends Component {
  constructor(props){
    super(props);
  }

  render(){
    const { document } = this.props;

    if( document.editable() ){ return null; }

    const citation = document.citation();
    const { authors, pmid, title = 'Untitled article', reference, doi, abstract } = citation;

    return h('div.editor-info-panel', [
      h('div.editor-info-title', title),
      h('div.editor-info-authors', authors.authorList.map(a => h('span.editor-info-author', a.name))),
      h('div.editor-info-links', [
        h('a.editor-info-link.plain-link', { target: '_blank', href: `${DOI_LINK_BASE_URL}${doi}` }, reference),
        h('a.editor-info-link.plain-link', { target: '_blank', href: `${PUBMED_LINK_BASE_URL}${pmid}` }, 'PubMed'),
        h('a.editor-info-link.plain-link', { target: '_blank', href: `${GOOGLE_SCHOLAR_BASE_URL}${doi}` }, 'Google Scholar')
      ]),
      h('div.editor-info-abstract', [
        h('div.editor-info-abstract-title', 'Abstract'),
        h('div.editor-info-abstract-content', abstract)
      ])
    ]);
  }
}

export default InfoPanel;