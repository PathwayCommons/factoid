import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

import { makeClassList } from '../dom';
import { checkHTTPStatus } from '../../util/fetch.js';

/**
 * Component that previews input element values from search
 *
 * @typedef {object} ComboSearchProps
 * @property {string} placeholder input placeholder text
 * @property {string} url search endpoint
 * @property {string} displayKey search results object key displayed in preview
 * @property {number} searchDelay debounce delay in ms
 * @property {number} limit max search results to retrieve/display
 */
class ComboSearch extends Component {

  constructor( props ){
    super( props );
    const { searchDelay = 100 } = props;

    this.state = {
      query: '',
      selection: null,
      hits: [],
      index: 0,
      error: null,
      listMode: false
    };

    this.debouncedSearch = _.debounce( () => {
      this.search();
    }, searchDelay );

    this.isSameAsStr = ( a, b ) => {
      return _.isString( a ) && _.isString( b ) && _.lowerCase( _.trim( a ) ) === _.lowerCase( _.trim( b ) );
    };
  }

  setError( error ){
    this.setState({ error });
  }

  setListMode( listMode ){
    this.setState({ listMode });
  }

  /**
   * Fetch documents from source
   * @param {string} query the query string
   * @return {object} a list of search hits
   */
  search(){
    const toJson = res => res.json();
    const { query } = this.state;
    const { url, limit = 10 } = this.props;
    const opts = {
      method: 'post',
      body: JSON.stringify({ q: query, limit }),
      headers: {'Content-Type': 'application/json'}
    };

    const current = {
      id: null,
      title: query,
      issn: [],
      h_index: null,
      publisher: null,
      categories: null
    };

    return fetch( url, opts )
      .then( checkHTTPStatus )
      .then( toJson )
      .then( hits => this.setHits( [ current, ...hits ] ) )
      .then( () => this.setListMode( true ) )
      .catch( err => {
        this.setError( err );
      });
  }

  setHits( hits ){
    this.setState({ hits });
  }

  clearHits( ){
    this.setState({ hits: [], index: 0 });
  }

  updateSearchQuery( e ){
    this.setIndex( 0 );
    const hasQuery = query => !!query && !!query.trim();
    let value = e.target.value;
    this.setSearchQuery( value );
    if ( hasQuery( value ) ) {
      return this.debouncedSearch();
    } else {
      this.setHits([]);
    }
  }

  setSearchQuery( query ){
    this.setState({ query });
  }

  clearSearchQuery() {
    this.setState({ query: '', hits: [], index: 0, selection: null });
  }

  setItem( selection ){
    this.setState({ selection });
  }

  selectHit( hit ){
    const { displayKey } = this.props;
    this.setSearchQuery( hit[displayKey] );

    // Automatically match the query if it exactly matches title in hits
    const unassociated = _.isNull( hit.id );
    if ( unassociated ) {
      const startIndex = 1; // Skip the query at 0
      const matchesHit = o => this.isSameAsStr( hit[displayKey], o[displayKey] );
      const { hits } = this.state;
      const hitMatch = _.find( hits, matchesHit, startIndex );
      if ( hitMatch ) hit = hitMatch;
    }

    this.setItem( hit );
    this.clearHits();
    this.setListMode( false );
  }

  setIndex( index ){
    this.setState({ index });
  }

  handleKeyDown( e ){
    const { hits, index } = this.state;
    const { displayKey } = this.props;
    const { key } = e;
    const lastIndex = hits.length - 1;

    if ( key === 'Enter' ) {
      let current = index;
      const selection = hits[current];
      this.selectHit( selection );

    } else if ( key === 'Escape' ) {
      this.clearSearchQuery();

    } else if ( key === 'ArrowDown' ) {
      let current = index + 1;
      if( index >= lastIndex ) current = 0;
      this.setSearchQuery( hits[current][displayKey] );
      this.setIndex( current );

    } else if ( key === 'ArrowUp' ) {
      let current = index - 1;
      if( index <= 0 ) current = lastIndex;
      this.setSearchQuery( hits[current][displayKey] );
      this.setIndex( current );
    }
  }


  // todo cases:
  // 1. Clash between mouseover list and arrow key selection
  // 2. Exact match between hit and input value
  //     e.g. input: 'Nature', list: ['Acta Natura', 'Nature', 'Nature Medicine']
  //     - 'Nature' from search should be set as selection on Enter
  //     But can allow user backdoor out.


  render(){
    const { hits, query, selection, index, listMode } = this.state;
    const { displayKey } = this.props;
    const hasHits = hits && hits.length > 0;

    return h('div.combo-search', [
      h('ul.state', [
        h('li', `query: ${query}`),
        h('li', `selection: ${selection ? selection.title + ' [' + selection.id + ']' : null }`)
      ]), // TODO - remove
      h('div.search-box-area', [
        h('input', {
          type: 'text',
          placeholder: this.props.placeholder,
          value: query,
          ref: el => this.inputBox = el,
          onFocus: () => this.setListMode( true ),
          onClick: () => this.setListMode( true ),
          onBlur: () => this.setListMode( false ),
          onChange: e => this.updateSearchQuery( e ),
          onKeyDown: e => this.handleKeyDown( e )
        }),
        h('button', {
          className: makeClassList({
            'hidden': !query
          }),
          onClick: () => this.clearSearchQuery()
        }, [
          h('i.material-icons', 'clear')
        ])
      ]),
      hasHits ?
      h('ul', {
        className: makeClassList({
          'hidden': !listMode
        })
      }, hits.map((hit, i) => {
        if( i === 0 ) return null;
        return h('li', {
          key: i,
          onMouseDown: () => this.selectHit( hit ),
          onMouseOver: () => this.setIndex( i ),
          onMouseOut: () => this.setIndex( 0 ),
          className: makeClassList({
            'active': i === index,
            'match': this.isSameAsStr( query, hit[displayKey] )
          })
        }, [
          h('span.display-value', `${hit[displayKey]}` )
        ]);
      })
    ) : null
    ]);
  }
}

export default ComboSearch;
