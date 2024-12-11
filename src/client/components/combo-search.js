import h from 'react-hyperscript';
import { Component } from 'react';
import { makeClassList } from '../dom';
import _ from 'lodash';
// import logger from './logger';

/** Class for  searching a journal. */
class ComboSearch extends Component {

  constructor( props ){
    super( props );

    this.state = {
      q: '',
      topMatching: []
    };

    this.debouncedSearch = _.debounce(() => {
      this.search();
    }, 500);

  }

  /**
   * Fetch documents from source
   * @param {string} q the query string
   * @return {object} a list of search hits
   */
  search(){
    const url = '/api/element-association/search';
    const body = JSON.stringify({
      name: this.state.q,
      namespace: 'medline',
      offset: 0,
      limit: 10
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
        this.setTopMatching( results );
        return results;
      })
      .catch( err => {
        console.error( `Unable to search journas: ${err}` );
      });
  }

  // /**
  //  * Load documents into the index and stash locally
  //  * @param {object} documents List of raw documents to index
  //  */
  // index( documents ){
  //   this._engine.addAll( documents );
  //   this._documents = documents;
  //   this._documents.forEach( doc => this._docMap.set( doc.id, doc ) );
  // }

  // /**
  //  * Getter for list of raw documents indexed
  //  */
  // get documents() {
  //   return this._documents;
  // }

  setSearch( q ){
    console.log( `set search: ${q}` );
    this.setState({ q });
  }

  setTopMatching( topMatching ){
    console.log( `topMatching: ${topMatching.length}` );
    this.setState({ topMatching });
  }

  handleChange( e ){
    console.log('handleChange');
    this.setSearch( e.target.value );
    if (e.target.value.length > 0) {
      return this.debouncedSearch();
    } else {
      // if search value is empty, reset the first 6 matching colors
      this.setTopMatching([]);
    }
  }

  handleBlur() {
    console.log('handleBlur');
  }

  handleClick( item ){
    console.log('onClick');
    this.setSearch( item.name );
    this.dropDownList.blur();
    this.setTopMatching([]);
  }

  // /**
  //  * Search the index
  //  * @param {string} q search query
  //  * @param {number} limit maximum number of hits to return (default 10)
  //  * @return {object} a list of search hits (raw document)
  //  */
  // search( q, limit = 10 ){
  //   let searchHits = this._engine.search( q );
  //   searchHits = searchHits.slice( 0, limit );
  //   return searchHits.map( ({ id }) => this._docMap.get( id ) );
  // }

  render(){

    const { topMatching, q } = this.state;

    return h('div.combo-search', [
      h('input', {
        type: 'text',
        placeholder: this.props.placeholder,
        value: q,
        ref: el => this.dropDownList = el,
        onChange: e => this.handleChange( e )
      }),
      h('ul', {
        className: makeClassList({
          'expanded': true
        })
      },
        // Displaying the filter based on search as dropDown
        topMatching &&
          topMatching.map((item, index) => (
            h('li',{
              key: index,
              onClick:() => this.handleClick( item ),
              className: makeClassList({
                'active': q === item.name
              })
            }, [
              item.name
            ])
          ))
      ),
      h('div', `q: ${q}`)
    ]);
  }
}


export default ComboSearch;
