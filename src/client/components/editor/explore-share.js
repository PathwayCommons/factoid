import { Component } from 'react';
import h from 'react-hyperscript';
import { NativeShare, isNativeShareSupported } from '../native-share';
import { BASE_URL } from '../../../config';

export class ExploreShare extends Component {
  constructor(props){
    super(props);
  }

  render(){
    const { document } = this.props;

    if( document.editable() || !isNativeShareSupported() ){
      return null;
    }

    return h('div.editor-explore-share', [
      h(NativeShare, {
        title: document.citation().title,
        text: '',
        url: BASE_URL + document.publicUrl(),
        buttonClass: 'super-salient-button'
      }, [
        h('span', 'Share')
      ])
    ]);
  }
}

export default ExploreShare;