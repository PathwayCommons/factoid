import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

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
    const provided = document.provided() || {};

    if( !document.editable() ){
      return null;
    }

    const otherMissingFields = !provided.authorName || !provided.authorEmail;

    const getTitleContent = () => {
       if ( title == null ) {
         return h( Popover, {
           show: showTippy => {
             this.bus.on('showedittitle', showTippy); // for submit validation: show me how
           },
           tippy: {
             html: h( RequestForm, {
               doc: document,
               bus: this.bus,
               submitBtnText: 'OK',
               showDescription: false,
               showTitle: false,
               addClasses: '.editor-request-form-container',
               formFields: {
                 authorName: _.get(document.provided(), ['authorName']),
                 authorEmail: _.get(document.provided(), ['authorEmail'])
               }
             }),
             onShown: () => this.bus.emit('opencta'),
             onHidden: () => this.bus.emit( 'closecta' ),
             placement: 'top'
           }
         }, [
           h( 'span.plain-link.link-like', `Set your article's title` + (otherMissingFields ? ' etc.' : '') )
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