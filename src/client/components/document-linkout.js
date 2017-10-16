const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const Clipboard = require('clipboard');
const Tooltip = require('./tooltip');

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

    return h('div.document-linkout-address', [
      h('h3.document-linkout-address-name', name),
      h('p.document-linkout-address-descr', descr),
      h('p.document-linkout-address-val', [
        h('input.document-linkout-address-url.input-joined.code', { type: 'text', value: formedUrl, readOnly: true }),
        h(Tooltip, {
          description: copied ? 'Link copied' : 'Copy link',
          tippy: {
            // html: function(){ return h('span', copied ? 'Link copied' : 'Copy link'); },
            hideOnClick: false,
            trigger: 'mouseenter',
            position: 'left',
            sticky: true
          }
        }, [
          h('button.button-joined.document-linkout-address-copy', [
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
    let docJson = this.props.documentJson;

    if( doc != null ){
      docJson = {
        publicUrl: doc.publicUrl(),
        privateUrl: doc.privateUrl(),
        editable: doc.editable()
      };
    }

    return h('div.document-linkout', [
      h(Address, {
        name: 'Public address',
        url: docJson.publicUrl,
        descr: 'This is a read-only link for this document.  Share this link with anyone.'
      })
    ].concat( docJson.editable ? [
      h(Address, {
        name: 'Private address',
        url: docJson.privateUrl,
        descr: 'This is a read-and-write link for this document.  Share this link only with fellow editors.'
      })
    ] : [] ));
  }
}

module.exports = Linkout;
