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

    if( !term ){
      return h('span.highlighter', [
        h('span.highlighter-text', text)
      ]);
    }

    if( ignorePunctuation === undefined ){
      ignorePunctuation = true;
    }

    let saniTerm = ( () => {
      let st = '';
      let sep = '[-,_. ]';
      let optNonSpSep = '[-,_.]?';
      let sepRe = new RegExp(sep);
      let prevChWasSep = false;

      for( let i = 0; i < term.length; i++ ){
        let ch = term[i];
        let isFirstChar = i === 0;

        if( ch.match(sepRe) ){
          // replace all specific separators with a generic separator
          // (e.g. 'cyclin e' matches 'cyclin-e')
          st += sep;

          prevChWasSep = true;
        } else {
          // join all non-separator, 2-char sequences with a non-space separator
          // (e.g. 'rad5' matches 'rad-5')
          if( !isFirstChar && !prevChWasSep ){
            st += optNonSpSep;
          }

          st += ch;

          prevChWasSep = false;
        }
      }

      return st;
    } )();

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
