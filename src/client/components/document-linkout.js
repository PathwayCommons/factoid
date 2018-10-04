const React = require('react');
const h = require('react-hyperscript');
const CopyField = require('./copy-field');

class Address extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { name, url, descr } = this.props;
    let formedUrl = location.protocol + '//' + location.host + url;

    return h('div.document-linkout-address', [
      h('h3.document-linkout-address-name', name),
      h('p.document-linkout-address-descr', descr),
      h('div.document-linkout-address-val', [
        h(CopyField, { value: formedUrl })
      ])
    ]);
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
