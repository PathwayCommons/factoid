const React = require('react');
const { Component } = React;
const h = require('react-hyperscript');

class Highlighter extends Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { term, text, ignorePunctuation } = this.props;
    let remaining = text;
    let match;
    let spans = [];

    if( ignorePunctuation === undefined ){
      ignorePunctuation = true;
    }

    let saniTerm = term.replace(/[-,_. ]/g, '[-,_. ]');
    let termRe = new RegExp( saniTerm, 'i' );

    do {
      match = remaining.match( termRe );

      if( match ){
        let matchTerm = match[0];
        let { index } = match;
        let { length } = matchTerm;

        if( index > 0 ){
          let preMatchTerm = remaining.substring( 0, index );

          spans.push( h('span.highlighter-text', preMatchTerm) );
        }

        spans.push( h('span.highlighter-term', matchTerm) );

        remaining = remaining.substring( index + length );
      } else {
        spans.push( h('span.highlighter-text', remaining ) );

        remaining = '';
      }

    } while( remaining.length > 0 );

    return h('span.highlighter', spans);
  }
}

module.exports = Highlighter;
