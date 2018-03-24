const React = require('react');
const { Component } = React;
const h = require('react-hyperscript');

class IntervalHighlighter extends Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { intervals, text } = this.props;
    let spans = [];
    let lastEnd = 0;
    let toClassNames = list => list.join(' ');

    // iterate through the sorted intervals to create spans
    intervals.forEach( interval => {
      // create a span for the substring that is between two intervals
      if ( lastEnd < interval.start ) {
        spans.push( h('span', text.substring(lastEnd, interval.start) ) );
      }

      // create a span for the interval
      let intervalText = text.substring(interval.start, interval.end);
      spans.push( h('span', { className: toClassNames(interval.classes) }, intervalText) );

      lastEnd = interval.end;
    } );

    // create a span for the remaining substring after whole intervals are covered
    if (lastEnd < text.length) {
      spans.push( h('span', text.substring(lastEnd, text.length) ) );
    }

    return h('span', spans);
  }
}

module.exports = IntervalHighlighter;
