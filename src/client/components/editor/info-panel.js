import h from 'react-hyperscript';
import { Component } from 'react';
import { DOI_LINK_BASE_URL, PUBMED_LINK_BASE_URL, GOOGLE_SCHOLAR_BASE_URL } from '../../../config';
// import { Carousel, CAROUSEL_CONTENT } from '../carousel';
import { makeClassList } from '../../dom';
import ElementInfo from '../element-info/element-info';
import RelatedPapers from '../related-papers';

export class InfoPanel extends Component {
  constructor(props){
    super(props);

    this.state = {};
  }

  componentDidMount(){
    const { bus } = this.props;

    this.onSelect = docEl => {
      this.setState({ selected: docEl });
    };

    this.onUnselect = () => {
      this.setState({ selected: null });
    };

    bus.on('select', this.onSelect);
    bus.on('unselect', this.onUnselect);
  }

  componentWillUnmount(){
    const { bus } = this.props;

    bus.removeListener('select', this.onSelect);
    bus.removeListener('unselect', this.onUnselect);
  }

  render(){
    const { document, bus, controller } = this.props;
    const { selected } = this.state;

    if( document.editable() ){ return null; }

    if( selected ){
      return h(`div.editor-info-panel.editor-info-panel-selected-el`, {
        className: makeClassList({
          'editor-info-panel-selected-intn': selected.isInteraction(),
          'editor-info-panel-selected-ent': selected.isEntity()
        })
      }, [
        h('div.editor-info-panel-close', {
          onClick: () => {
            controller.unselectAll();

            this.onUnselect();
          }
        }, [
          h('i.editor-info-panel-close-icon.material-icons', 'close')
        ]),
        h( ElementInfo, { element: selected, bus, document } )
      ]);
    }

    const citation = document.citation();
    const authorProfiles = document.authorProfiles();
    const { pmid, title = 'Untitled article', reference, doi, abstract } = citation;

    return h('div.editor-info-panel', [
      h('div.editor-info-title', title),
      h('div.editor-info-authors', authorProfiles.map(a => {
        let orcidUri = a.orcid;
        if ( orcidUri ) {
            return h('a.editor-info-author.plain-link', { target: '_blank', href: orcidUri }, a.name);
        }

        return h('a.editor-info-author', a.name);
      })),
      h('div.editor-info-links', doi ? [
        h('a.editor-info-link.plain-link', { target: '_blank', href: `${DOI_LINK_BASE_URL}${doi}` }, reference),
        h('a.editor-info-link.plain-link', { target: '_blank', href: `${PUBMED_LINK_BASE_URL}${pmid}` }, 'PubMed'),
        h('a.editor-info-link.plain-link', { target: '_blank', href: `${GOOGLE_SCHOLAR_BASE_URL}${doi}` }, 'Google Scholar')
      ] : null),
      h('div.editor-info-main-sections', [
        h('div.editor-info-abstract-section.editor-info-main-section', [
          h('div.editor-info-section-title', abstract ? 'Abstract': 'Summary'),
          h('div.editor-info-abstract-content', abstract ? abstract : document.toText() )
        ]),
        // h('div.editor-info-carousel-title', 'Recommended articles'),
        // h('div.editor-info-carousel', [
        //   h(Carousel, { content: CAROUSEL_CONTENT.ABSTRACT })
        // ]),
        // h('div.editor-info-carousel-title', 'Trending articles'),
        // h('div.editor-info-carousel', [
        //   h(Carousel, { content: CAROUSEL_CONTENT.ABSTRACT })
        // ]),
        h('div.editor-info-related-papers-section.editor-info-main-section', [
          h('div.editor-info-section-title', 'Recommended articles'),
          h('div.editor-info-related-papers', [ h(RelatedPapers, { document, source: document }) ])
        ])
      ])
    ]);
  }
}

export default InfoPanel;