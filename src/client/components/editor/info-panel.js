import h from 'react-hyperscript';
import { Component } from 'react';
import { makeClassList } from '../../dom';
import ElementInfo from '../element-info/element-info';
import RelatedPapers from '../related-papers';
import _ from 'lodash';
import Citation from '../citation.js';

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

    const { pmid, doi, abstract } = document.citation();
    const hasArticleId = pmid != null || doi != null;
    const hasRelatedPapers = !_.isEmpty( document.relatedPapers() );

    return h('div.editor-info-panel', [
      h(Citation, { document }),
      h('div.editor-info-main-sections', [
        abstract ? h('div.editor-info-abstract-section.editor-info-main-section', [
          h('div.editor-info-section-title', abstract ? 'Abstract': 'Summary'),
          h('div.editor-info-abstract-content', abstract ? abstract : document.toText() )
        ]) : null,
        hasRelatedPapers ? h('div.editor-info-related-papers-section.editor-info-main-section', [
          h('div.editor-info-section-title', 'Recommended articles'),
          h('div.editor-info-related-papers', [ h(RelatedPapers, { document, source: document }) ])
        ]) : null
      ]),

      !hasArticleId && !document.editable() ? h('div.editor-coming-soon-placeholder', `Biofactoid is looking for more information about this article from PubMed and pathway databases.  This information will appear here as soon as it is available.`) : null
    ]);
  }
}

export default InfoPanel;