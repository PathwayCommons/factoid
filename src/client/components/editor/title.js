import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

import Popover from '../popover/popover';
import RequestForm from '../request-form';
import Citation from '../citation';

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
    if( !document.editable() ) return null;

    const { citation } = this.state;

    return h('div.editor-title', [
      h('div.editor-title-content', [
        citation.title ? h(Citation, { document, compact: true }) :
        h( Popover, {
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
          h( 'div.editor-title-cta', [
            h( 'span.plain-link.link-like', 'Set article information' )
          ])
        ])
      ])
    ]);
  }
}

export default EditorTitle;