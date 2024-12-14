import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

import { makeClassList } from '../dom';
import { checkHTTPStatus } from '../../util/fetch.js';
import { list } from 'postcss';

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
      q: '',
      hits: [],
      index: 0,
      error: null,
      listMode: false
    };

    this.debouncedSearch = _.debounce( () => {
      this.search();
    }, searchDelay );
  }

  setError( error ){
    this.setState({ error });
  }

  setListMode( listMode ){
    this.setState({ listMode });
  }

  /**
   * Fetch documents from source
   * @param {string} q the query string
   * @return {object} a list of search hits
   */
  search(){
    const toJson = res => res.json();
    const { q } = this.state;
    const { url, limit = 10 } = this.props;
    const opts = {
      method: 'post',
      body: JSON.stringify({ q, limit }),
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
    const hasQuery = q => !!q && !!q.trim();
    let value = e.target.value;
    this.setSearchQuery( value );
    if ( hasQuery( value ) ) {
      return this.debouncedSearch();
    } else {
      this.setHits([]);
    }
  }

  setSearchQuery( q ){
    this.setState({ q });
  }

  clearSearchQuery() {
    this.setState({ q: '', hits: [], index: 0 });
  }

  handleListItemClicked( item ){
    const { displayKey } = this.props;
    this.setSearchQuery( item[displayKey] );
    this.setListMode( false );
  }

  setIndex( index ){
    this.setState({ index });
  }

  handleKeyDown( e ){
    const { hits, index, q } = this.state;
    const { displayKey } = this.props;
    const { key } = e;
    const lastIndex = hits.length - 1;

    // if( q === '' ) {
    //   console.log(`q === ''; index: ${index}`);
    //   this.setIndex(0);
    // }

    // console.log(`ArrowDown; hits[index][displayKey]: ${hits[index][displayKey]}`);

    if ( key === 'Enter' ) {
      let current = index;
      this.setSearchQuery( hits[current][displayKey] );
      this.setListMode( false );
      this.clearHits( );

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

    // return;
  }

  // todo case:
  //  search, arrow to selection, enter to select
  // what is expected arrow behaviour?


  render(){
    const { hits, q, index, listMode } = this.state;
    const { displayKey } = this.props;
    const hasHits = hits && hits.length > 0;

    return h('div.combo-search', [
      h('ul.state', [
        h('li', `q: ${q}`),
        h('li', `index: ${index}`)
      ]), // TODO - remove
      h('div.search-box-area', [
        h('input', {
          type: 'text',
          placeholder: this.props.placeholder,
          value: q,
          ref: el => this.inputBox = el,
          onFocus: () => this.setListMode( true ),
          onClick: () => this.setListMode( true ),
          onBlur: () => this.setListMode( false ),
          onChange: e => this.updateSearchQuery( e ),
          onKeyDown: e => this.handleKeyDown( e )
        }),
        h('button', {
          className: makeClassList({
            'hidden': !q
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
      }, hits.map((item, i) => (
        h('li', {
          key: i,
          onClick:() => this.handleListItemClicked( item ),
          className: makeClassList({
            'active': i === index,
          })
        }, [
          h('span.display-value', `${item[displayKey]}` )
        ])
      ))
    ) : null
    ]);
  }
}

export default ComboSearch;
