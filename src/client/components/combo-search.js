import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

import { makeClassList } from '../dom';
import logger from '../logger.js';

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
      hits: []
    };

    this.debouncedSearch = _.debounce( () => {
      this.search();
    }, searchDelay );
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
      .then( toJson )
      .then( hits => this.setHits( hits ) )
      .catch( err => {
        logger.error( `ComboSearch fetch error: ${err}` );
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
    this.setSearch( item.title );
    this.hitList.blur();
    this.setHits([]);
  }

  render(){
    const { hits, q } = this.state;
    const { displayKey } = this.props;
    const hasHits = hits && hits.length > 0;

    return h('div.combo-search', [
      h('div', `Stored: ${q}`),
      h('div.search-box-area', [
        h('input', {
          type: 'text',
          placeholder: this.props.placeholder,
          value: q,
          ref: el => this.hitList = el,
          onChange: e => this.updateSearchQuery( e )
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
      h('ul', hits.map((item, index) => (
        h('li', {
          key: index,
          onClick:() => this.handleClick( item ),
          className: makeClassList({
            'active': q === item.title
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
