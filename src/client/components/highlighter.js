import React from 'react';
import h from 'react-hyperscript';

class Highlighter extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { terms, text, ignorePunctuation } = this.props;
    let remaining = text;
    let match;
    let spans = [];

    let anyTermExists = ( () => {
      if (!terms) {
        return false;
      }

      for ( let term of terms ) {
        if (term) {
          return true;
        }
      }

      return false;
    } )();

    if( !text || !anyTermExists){
      return h('span.highlighter', [
        h('span.highlighter-text', text || '')
      ]);
    }

    if( ignorePunctuation === undefined ){
      ignorePunctuation = true;
    }

    let getSaniTerm = term => {
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

          st += '[' + ch + ']'; // put in [] to allow for special chars like +

          prevChWasSep = false;
        }
      }

      return st;
    };

    let saniTerms = ( () => {
      let retVal = "";

      terms.forEach( ( term, i ) => {
        if (!term) {
          return;
        }

        let st = getSaniTerm(term);

        if (i !== 0) {
          retVal += '|';
        }

        retVal += st;
      } );

      return retVal;
    } )();

    let termsRe = new RegExp( saniTerms, 'i' );

    let addWsSplitSpans = text => {
      let terms = text.split(' ');

      terms.forEach( (term, i) => {
        if( term !== '' ){
          spans.push( h('span.highlighter-text', term) );
        }

        if( i < terms.length - 1 ){
          spans.push( h('span.highlighter-text', ' ') );
        }
      } );
    };

    do {
      match = remaining.match( termsRe );

      if( match ){
        let matchTerm = match[0];
        let { index } = match;
        let { length } = matchTerm;

        if( index > 0 ){
          let preMatchTerm = remaining.substring( 0, index );

          addWsSplitSpans( preMatchTerm );
        }

        spans.push( h('span.highlighter-term', matchTerm) );

        remaining = remaining.substring( index + length );
      } else {
        addWsSplitSpans( remaining );

        remaining = '';
      }

    } while( remaining.length > 0 );

    return h('span.highlighter', spans);
  }
}

export default Highlighter;
