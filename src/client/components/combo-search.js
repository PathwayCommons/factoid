import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

import { makeClassList } from '../dom';
import { checkHTTPStatus } from '../../util/fetch.js';

/**
 * Search box with dropdown-like preview
 *
 * @typedef {object} props
 * @property {string} placeholder input element placeholder text
 * @property {string} url search endpoint
 * @property {number} limit max search hits to retrieve (default: 10)
 * @property {string} queryKey search hit object key corresponding to query
 * @property {number} delay search delay after keystroke (default: 100 [ms])
 * @property {object} setValue set the selection (parent component)
 * @extends {Component<props>}
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
      const isString = _.isString( a ) && _.isString( b );
      const cleana = a.trim().toLowerCase();
      const cleanb = b.trim().toLowerCase();
      const isSame = cleana === cleanb;
      return isString && isSame;
    };

    this.asHit = q => ({
      id: null,
      title: q,
      issn: [],
      h_index: null,
      publisher: null,
      categories: null
    });
  }

  setError( error ){
    this.setState({ error });
  }

  setListMode( listMode ){
    this.setState({ listMode });
  }

  /**
   * Search using the provided endpoint
   * @param {string} query query string
   * @return {Array} Array of hits, possibly empty
   */
  search( url, searchOpts ){
    const toJson = res => res.json();
    const { query: q } = this.state;
    const opts = {
      method: 'post',
      body: JSON.stringify( _.assign( { q }, searchOpts ) ),
      headers: {'Content-Type': 'application/json'}
    };

    return fetch( url, opts )
      .then( checkHTTPStatus )
      .then( toJson )
      .then( hits => this.setHits( [ this.asHit( q ), ...hits ] ) ) // query is first 'hit'
      .then( () => this.setListMode( true ) )
      .catch( err => this.setError( err ) );
  }

  setHits( hits ){
    this.setState({ hits }, () => this.setValue( this.state.query ) );
  }

  clearHits(){
    this.setState({ hits: [], index: 0 });
  }

  /**
   * Value should be available to the parent component, even without explicit selection.
   * This matches the expectation of an input you can read from.
   * @param {object} item The item to make available to the parent component
   */
  setValue( item ){
    let value = item;
    const { hits } = this.state;
    const { queryKey } = this.props;

    if ( _.isString( value ) ) {
      value = this.asHit( value );
      if( hits.length > 1 ) {
        // See if it matches any hits
        const startIndex = 1; // Skip the query at 0 (query)
        const matchesHit = o => this.isSameAsStr( item, o[queryKey] );
        const hit = _.find( hits, matchesHit, startIndex );
        if ( hit ) value = hit;
      }
    }

    this.props.setValue( value );
  }

  clearValue(){
    this.setValue( null );
  }

  setSearchQuery( query ){
    this.setState({ query });
  }

  clearSearchQuery() {
    this.clearValue();
    this.setState({ query: '', hits: [], index: 0, selection: null });
  }

  updateSearch( e ){
    this.setIndex( 0 );
    const hasQuery = query => !!query && !!query.trim();
    let value = e.target.value;
    this.setSearchQuery( value );
    if ( hasQuery( value ) ) {
      return this.debouncedSearch();
    }
  }

  setSelection( selection ){
    this.setValue( selection );
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

    this.setSelection( hit );
    this.clearHits();
    this.setListMode( false );
  }

  setIndex( index ){
    this.setState({ index });
  }

  handleKeyDown( e ){
    const { hits, index } = this.state;
    if(!hits.length) return;

    const { key } = e;
    const { queryKey } = this.props;
    const lastIndex = hits.length - 1;

    if ( key === 'Enter' ) {
      e.preventDefault();
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
    const { hits, query, index, listMode } = this.state;
    const { queryKey } = this.props;

    return (
      h('div.combo-search', [
        h('input', {
          type: 'text',
          placeholder: this.props.placeholder,
          value: query,
          ref: el => this.inputBox = el,
          onFocus: () => this.setListMode( true ),
          onClick: () => this.setListMode( true ),
          onBlur: () => this.setListMode( false ),
          onChange: e => this.updateSearch( e ),
          onKeyDown: e => this.handleKeyDown( e )
        }),
        h('button', {
          type: 'button',
          className: makeClassList({
            'hidden': !query
          }),
          onClick: () => this.clearSearchQuery()
        }, [
          h('i.material-icons', 'clear')
        ]),
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
          }, hit[queryKey] );
        }))
      ])
    );
  }
}

export default ComboSearch;