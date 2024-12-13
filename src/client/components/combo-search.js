import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

import { makeClassList } from '../dom';
import logger from '../logger.js';

/** Class for previewing search results. */
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
    const { url, limit = 10 } = this.props;
    const { q } =this.state;
    const body = JSON.stringify({
      q,
      limit
    });
    const opts = {
      method: 'post',
      body,
      headers: {'Content-Type': 'application/json'}
    };

    return fetch( url, opts )
      .then( res => {
        return res.json();
      })
      .then( results => {
        this.setHits( results );
        return results;
      })
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

  handleChange( e ){
    this.setSearch( e.target.value );
    if (e.target.value.length > 0) {
      return this.debouncedSearch();
    } else {
      // if search value is empty, reset the first 6 matching colors
      this.setHits([]);
    }
  }

  handleClick( item ){
    this.setSearch( item.title );
    this.dropDownList.blur();
    this.setHits([]);
  }

  render(){

    const { hits, q } = this.state;
    const { displayKey } = this.props;
    const hasHits = hits && hits.length > 0;

    return h('div.combo-search', [
      h('input', {
        type: 'text',
        placeholder: this.props.placeholder,
        value: q,
        ref: el => this.dropDownList = el,
        onChange: e => this.handleChange( e )
      }),
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
    ) : null,
      h('div', `q: ${q}`)
    ]);
  }
}


export default ComboSearch;
