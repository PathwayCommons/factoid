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
    }, 250);

  }

  /**
   * Fetch documents from source
   * @param {string} q the query string
   * @return {object} a list of search hits
   */
  search(){
    const { url } = this.props;
    const { q } =this.state;
    const body = JSON.stringify({
      q,
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

  setSearch( q ){
    this.setState({ q });
  }

  setTopMatching( topMatching ){
    this.setState({ topMatching });
  }

  handleChange( e ){
    this.setSearch( e.target.value );
    if (e.target.value.length > 0) {
      return this.debouncedSearch();
    } else {
      // if search value is empty, reset the first 6 matching colors
      this.setTopMatching([]);
    }
  }

  handleClick( item ){
    this.setSearch( item.title );
    this.dropDownList.blur();
    this.setTopMatching([]);
  }

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
                'active': q === item.title
              })
            }, [
              item.title
            ])
          ))
      ),
      h('div', `q: ${q}`)
    ]);
  }
}


export default ComboSearch;
