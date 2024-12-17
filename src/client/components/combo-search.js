import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

import { makeClassList } from '../dom';
import { checkHTTPStatus } from '../../util/fetch.js';

/**
 * Input element that previews search hits
 *
 * @typedef {object} ComboSearchProps
 * @property {string} placeholder input placeholder text
 * @property {string} url search engine endpoint
 * @property {number} limit max search hits to retrieve/display (default: 10)
 * @property {string} queryKey search hit key corresponding to query
 * @property {number} delay search delay after keystroke (default: 100 [ms])
 */
class ComboSearch extends Component {

  constructor( props ){
    super( props );

    this.state = {
      query: '',
      selection: null,
      hits: [],
      index: 0,
      error: null,
      listMode: false
    };

    const { limit = 10, url, delay = 100 } = props;
    this.debouncedSearch = _.debounce( () => {
      this.search( url, { limit } );
    }, delay );

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
   * @param {object} query the query string
   * @return {object} a list of search hits
   */
  search( url, searchOpts ){
    const toJson = res => res.json();
    const { query: q } = this.state;
    const opts = {
      method: 'post',
      body: JSON.stringify( _.assign( { q }, searchOpts ) ),
      headers: {'Content-Type': 'application/json'}
    };

    const current = {
      id: null,
      title: q,
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
    const { queryKey } = this.props;
    this.setSearchQuery( hit[queryKey] );

    // Automatically match the query if it exactly matches title in hits
    const unassociated = _.isNull( hit.id );
    if ( unassociated ) {
      const startIndex = 1; // Skip the query at 0
      const matchesHit = o => this.isSameAsStr( hit[queryKey], o[queryKey] );
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
    const { queryKey } = this.props;
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
      this.setSearchQuery( hits[current][queryKey] );
      this.setIndex( current );

    } else if ( key === 'ArrowUp' ) {
      let current = index - 1;
      if( index <= 0 ) current = lastIndex;
      this.setSearchQuery( hits[current][queryKey] );
      this.setIndex( current );
    }
  }

  render(){
    const { hits, query, selection, index, listMode } = this.state;
    const { queryKey } = this.props;
    const hasHits = hits && hits.length > 0;

    return h('div.combo-search', [
      h('ul.debug-state', [
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
            'match': this.isSameAsStr( query, hit[queryKey] )
          })
        }, [
          h('span.display-value', `${hit[queryKey]}` )
        ]);
      })
    ) : null
    ]);
  }
}

export default ComboSearch;
