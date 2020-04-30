import DataComponent from './data-component';
import h from 'react-hyperscript';
import _ from 'lodash';

export class NativeShare extends DataComponent {
  constructor(props){
    super(props);
  }

  share(){
    const { title, url, text } = this.props;

    navigator.share({ title, url, text });
  }

  render(){
    const children = this.props.children || [
      h('i.icon.icon-shr.native-share-icon')
    ];

    const buttonClass= this.props.buttonClass || 'plain-button';

    return h('span.native-share', [
      h('button.native-shr-button.' + buttonClass, {
        onClick: () => this.share()
      }, children)
    ]);
  }
}

export function isNativeShareSupported(){
  return true || 'share' in navigator && _.isFunction(navigator.share);
}

export default NativeShare;
