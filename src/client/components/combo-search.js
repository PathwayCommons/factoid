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
      q: '',
      hits: [],
      index: 0,
      error: null
    };

    this.debouncedSearch = _.debounce( () => {
      this.search();
    }, searchDelay );
  }

  setError( error ){
    this.setState({ error });
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

    return fetch( url, opts )
      .then( checkHTTPStatus )
      .then( toJson )
      .then( hits => this.setHits( hits ) )
      .catch( err => {
        this.setError( err );
      });
  }

  setSearch( q ){
    this.setState({ q });
  }

  setHits( hits ){
    this.setState({ hits });
  }

  updateSearchQuery( e ){
    const hasQuery = q => !!q && !!q.trim();
    let value = e.target.value;
    this.setSearch( value );
    if ( hasQuery( value ) ) {
      return this.debouncedSearch();
    } else {
      this.setHits([]);
    }
  }

  clearSearchQuery() {
    this.setState({ q: '', hits: [] });
  }

  handleClick( item ){
    const { displayKey } = this.props;
    this.setSearch( item[displayKey] );
    this.setHits([]);
  }

  setIndex( index ){
    this.setState({ index });
  }

  handleKeyDown( e ){
    const { hits, index, q } = this.state;
    const { displayKey } = this.props;
    const { key } = e;

    // if( q === '' ) {
    //   console.log(`q === ''; index: ${index}`);
    //   this.setIndex(0);
    // }

    // console.log(`ArrowDown; index: ${index}`);
    // console.log(`ArrowDown; hits[index][displayKey]: ${hits[index][displayKey]}`);

    if ( key === 'Enter' ) {
      const item = hits[index];
      this.handleClick( item );

    } else if ( key === 'Escape' ) {
      this.clearSearchQuery();

    } else if ( key === 'ArrowDown' ) {
      // Update the index if there's an exact match
      // this.setSearch( hits[index][displayKey] );
      this.setIndex( index + 1 );
      if( index >= hits.length - 1 ) {
        this.setIndex( 0 );
      }
    }

    // return;
  }


  render(){
    const { hits, q, index } = this.state;
    const { displayKey } = this.props;
    const hasHits = hits && hits.length > 0;

    return h('div.combo-search', [
      h('div', `Stored: ${q}`), // TODO - remove
      h('div.search-box-area', [
        h('input', {
          type: 'text',
          placeholder: this.props.placeholder,
          value: q,
          ref: el => this.hitList = el,
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
      h('ul', hits.map((item, i) => (
        h('li', {
          key: i,
          onClick:() => this.handleClick( item ),
          className: makeClassList({
            'active': i === index,
          })
        }, [
          h('span.display-value', item[displayKey] )
        ])
      ))
    ) : null
    ]);
  }
}

export default ComboSearch;
