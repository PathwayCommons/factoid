import React from 'react';
import h from 'react-hyperscript';
import { makeClassList } from '../../util';
import _ from 'lodash';
import Toggle from './toggle';

const insertAt = ( arr, start, item ) => [ ...arr.slice(0, start),
  item,
  ...arr.slice(start)
];

class ExpandableListItemComponent extends React.Component {

  render(){
    let { children, classes } = this.props;
    const classList = _.assign( {}, classes );
    return h('li.expandable-list-item', {
      className: makeClassList( classList )
    }, children );
  }
}

class ElideComponent extends React.Component {
  render(){
    return h( ExpandableListItemComponent, { classes: { 'elide-element': true } }, [
      h('i.material-icons', 'more_horiz')
    ]);
  }
}

class CollapseComponent extends React.Component {
  render(){
    const { onToggle, getState } = this.props;
    return h( ExpandableListItemComponent, { classes: { 'elide-toggle-element': true } }, [
      h( Toggle, { onToggle, getState, className: 'elide-toggle' }, [ h('small', 'Show fewer') ] )
    ]);
  }
}

/**
 * ExpandableListComponent
 *
 * Generate an unordered list from react components which can be toggled to display
 * a given number of items from the start (maxHead) and end (maxTail).
 *
 * props
 *   - maxHead {Number} show this many items from beginning of list
 *   - maxTail {Number} show this many items from end of list
 */
class ExpandableListComponent extends React.Component {

  constructor( props ){
    super( props );

    this.state = {
      expanded: false,
      numHead: props.maxHead,
      numTail: props.maxTail
    };

    this.length = props.children.length;
    const { numElidable } = this.calcListStats();
    this.isElidable = numElidable > 0;
  }

  calcListStats(){
    const { numHead, numTail } = this.state;
    const N = this.length;
    const headEndIndex = Math.min( numHead, N );
    const numTailItems = N - headEndIndex;
    const itemsFromEnd = Math.min( numTailItems, numTail );
    const tailStartIndex = N - itemsFromEnd;
    const numElidable = tailStartIndex - headEndIndex;
    return { headEndIndex, tailStartIndex, numElidable };
  }

  handleElideClick(){
    this.setState( ( state, props ) => {
      let numHead = props.maxHead;
      let numTail = props.maxTail;
      if( !state.expanded ){
        numHead = this.length;
        numTail = 0;
      }
      return { expanded: !state.expanded, numHead, numTail };
    });
  }

  getItems(){
    const { children } = this.props;
    const { headEndIndex, tailStartIndex } = this.calcListStats();
    const shouldElide = i => i >= headEndIndex && i < tailStartIndex;

    const createItem = ( child, i ) => h( ExpandableListItemComponent, { classes: { elidable: shouldElide(i) ? true: false } }, child );
    let items = children.map( createItem );

    if( this.isElidable ){
      const startElide = _.findIndex( items, 'props.classes.elidable' );
      const elidedElement = h( ElideComponent );
      items = insertAt( items, startElide, elidedElement );

      const collapseListElement = h( CollapseComponent, {
        getState: () => this.state.expanded,
        onToggle: evt => this.handleElideClick( evt )
      }, h( 'small', 'Collapse' ) );
      items = items.concat( collapseListElement );
    }

    return items;
  }

  render(){
    const { children } = this.props;
    if( !children ) return null;
    console.log(`isElidable: ${this.isElidable}`);
    return h('ul.expandable-list', this.getItems());
  }
}

ExpandableListComponent.defaultProps = {
  maxHead: 3,
  maxTail: 1
};

export { ExpandableListComponent };