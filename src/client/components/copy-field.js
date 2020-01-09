import { Component } from 'react';
import h from 'react-hyperscript';
import Tooltip from './popover/tooltip';
import ReactDom from 'react-dom';
import Clipboard from 'clipboard';

class CopyField extends Component {
  constructor( props ){
    super( props );

    this.state = {
      copied: false
    };
  }

  render(){
    let { copied } = this.state;
    let { value } = this.props;

    return h('div.copy-field', [
      h('input.copy-field-input.input-joined.code', { type: 'text', value, readOnly: true }),
        h(Tooltip, {
          description: copied ? 'Copied' : 'Copy',
          tippy: {
            hideOnClick: false,
            trigger: 'mouseenter',
            position: 'left',
            sticky: true
          }
        }, [
          h('button.button-joined.copy-field-copy', [
            h('i.material-icons', 'content_paste')
          ])
        ])
    ]);
  }

  componentDidMount(){
    let self = this;
    let root = ReactDom.findDOMNode( self );
    let text = root.querySelector('input');
    let btn = root.querySelector('button');

    text.addEventListener('click', () => text.select());

    let cp = new Clipboard(btn, {
      text: () => text.value
    });

    cp.on('success', () => {
      self.setState({ copied: true });
    });

    btn.addEventListener('mouseleave', () => {
      self.setState({ copied: false });
    });
  }
}

export default CopyField;
