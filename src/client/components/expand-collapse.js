import React from 'react';
import h from 'react-hyperscript';
import { makeClassList } from '../../util';
import _ from 'lodash';


const getListItems = ( children, maxHead, maxTail ) => {
  const N = children.length;
  let headEndIndex = Math.min( maxHead, N );
  let numTailItems = N - headEndIndex;
  let itemsFromEnd = Math.min( numTailItems, maxTail );
  let tailStartIndex = N - itemsFromEnd;


  // const numItemsToHide = tailStartIndex - headEndIndex;
  const shouldHide = i => i >= headEndIndex && i < tailStartIndex;

  // console.log( `total: ${N}` );
  // console.log(`Items from start: ${headEndIndex}`);
  // console.log(`Items from end: ${itemsFromEnd}`);
  // console.log(`numItemsToHide: ${numItemsToHide}`);

  return children.map( ( child, i ) => {
    const p = { hidden: false };
    if( shouldHide( i ) ) _.set( p, 'hidden', true );
    return h( Item, p, child );
  });
};

class Item extends React.Component {

  render(){
    const { children, hidden, lastHead } = this.props;
    return h('li.expandable-list-item', {
      className: makeClassList({
        hidden, lastHead
      })
    }, children );
  }
}

/**
 * ExpandableList
 *
 * Generate an unordered list from react components which can be toggled to display
 * a given number of items from the start (maxHead) and end (maxTail).
 *
 * props
 *   - maxHead {Number} show this many items from beginning of list
 *   - maxTail {Number} show this many items from end of list
 */
class ExpandableList extends React.Component {

  render(){
    const { children, maxHead = 3, maxTail = 1 } = this.props;
    if( !children ) return null;
    return h('ul.expandable-list', getListItems( children, maxHead, maxTail )
    );
  }
}

export { ExpandableList };