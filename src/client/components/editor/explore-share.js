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

    if( document.editable() ){
      return null;
    }

    const tweetUrl = document.tweetUrl();

    return h('div.editor-explore-share', [
      (tweetUrl ? h('a', {
        href: tweetUrl,
        target: '_blank'
      }, [
        h('button.editor-explore-share-twitter.super-salient-button', [
          h('i.icon.icon-t-white')
        ]),
      ]) : null),
      (isNativeShareSupported() ? h(NativeShare, {
        title: document.citation().title,
        text: '',
        url: BASE_URL + document.publicUrl(),
        buttonClass: 'super-salient-button'
      }, [
        h('span', 'Share')
      ]) : null)
    ]);
  }
}

export default ExploreShare;