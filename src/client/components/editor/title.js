import h from 'react-hyperscript';
import { Component } from 'react';

import Popover from '../popover/popover';
import RequestForm from '../request-form';
import { DOI_LINK_BASE_URL } from '../../../config';

class EditorTitle extends Component {
  constructor(props){
    super(props);

    const { bus, document } = this.props;
    const citation = document.citation();

    this.bus = bus;

    this.state = {
      citation
    };

    this.onRequestBtnClick = () => this.setState({ citation: document.citation() });
  }

  componentDidMount(){
    this.bus.on('requestBtnClick', this.onRequestBtnClick);
  }

  componentWillUnmount(){
    this.bus.removeListener('requestBtnClick', this.onRequestBtnClick);
  }

  render(){
    const { document } = this.props;
    const { citation } = this.state;
    const { authors: { abbreviation }, title = 'Unnamed document', reference, doi } = citation;

    if( !document.editable() ){
      return null;
    }

    const getTitleContent = () => {
       if ( title == null ) {
         return h( Popover, {
           tippy: {
             html: h( RequestForm, {
               doc: document,
               bus: this.bus,
               submitBtnText: 'Okay'
             }),
             onHidden: () => this.bus.emit( 'closecta' ),
             placement: 'top'
           }
         }, [
           h( 'span.plain-link.link-like', 'Set the article\'s title' )
         ]);
       }

       return h('span' + (doi ? '.plain-link.link-like' : ''), title);
    };

    return h('div.editor-title', [
      h('div.editor-title-content', [
        h(doi ? 'a' : 'div', (doi ? { target: '_blank', href: `${DOI_LINK_BASE_URL}${doi}` } : {}), [
          h('div.editor-title-name', [
            getTitleContent()
          ]),
          h('div.editor-title-info', [
            h('div', abbreviation ),
            h('div', reference )
          ])
        ])
      ])
    ]);
  }
}

export default EditorTitle;