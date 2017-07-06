const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const Clipboard = require('clipboard');
const Tooltip = require('../tooltip');

class Address extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      copied: false
    };
  }

  render(){
    let { copied } = this.state;
    let { name, url, descr } = this.props;
    let formedUrl = location.protocol + '//' + location.host + url;

    return h('div.editor-linkout-address', [
      h('h3.editor-linkout-address-name', name),
      h('p.editor-linkout-address-descr', descr),
      h('p.editor-linkout-address-val', [
        h('input.editor-linkout-address-url.input-joined.code', { type: 'text', value: formedUrl, readOnly: true }),
        h(Tooltip, {
          tippy: {
            html: function(){ return h('span', copied ? 'Link copied' : 'Copy link'); },
            hideOnClick: false,
            trigger: 'mouseenter',
            position: 'left',
            sticky: true
          }
        }, [
          h('button.button-joined.editor-linkout-address-copy', [
            h('i.material-icons', 'content_paste')
          ])
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

class Linkout extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let doc = this.props.document;

    return h('div.editor-linkout', [
      h(Address, {
        name: 'Public address',
        url: doc.publicUrl(),
        descr: 'This is a read-only link for this document.  Share this link with anyone.'
      })
    ].concat( doc.editable() ? [
      h(Address, {
        name: 'Private address',
        url: doc.privateUrl(),
        descr: 'This is a read-and-write link for this document.  Share this link only with fellow editors.'
      })
    ] : [] ));
  }
}

module.exports = Linkout;
