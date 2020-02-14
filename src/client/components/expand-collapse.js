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

class ElideSymbolComponent extends React.Component {
  render(){
    const { elideSymbol } = this.props;
    return h( ExpandableListItemComponent, {
      classes: { 'elide-element': true }
    }, [
      elideSymbol
    ]);
  }
}

class ElideToggleComponent extends React.Component {
  render(){
    const { onToggle, getState, expandLabel, collapseLabel } = this.props;
    const expanded = getState();
    return h( ExpandableListItemComponent, { classes: { 'elide-toggle-element': true } }, [
      h( Toggle, {
        onToggle, getState, className: 'elide-toggle'
      }, [
        expanded ? collapseLabel: expandLabel
      ])
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
      expanded: false
    };

    this.length = _.get( props, ['children', 'length'], 0 );
    const { numElidable } = this.calcListStats();
    this.isElidable = numElidable > 0;
  }

  calcListStats(){
    const { maxHead, maxTail } = this.props;
    const N = this.length;
    const headEndIndex = Math.min( maxHead, N );
    const numTailItems = N - headEndIndex;
    const itemsFromEnd = Math.min( numTailItems, maxTail );
    const tailStartIndex = N - itemsFromEnd;
    const numElidable = tailStartIndex - headEndIndex;
    return { headEndIndex, tailStartIndex, numElidable };
  }

  handleElideClick(){
    this.setState( { expanded: !this.state.expanded } );
  }

  getItems(){
    const { children, elideSymbol, expandLabel, collapseLabel } = this.props;
    const { headEndIndex, tailStartIndex } = this.calcListStats();
    const shouldElide = i => i >= headEndIndex && i < tailStartIndex;

    const createItem = ( child, i ) => h( ExpandableListItemComponent, { classes: { elidable: shouldElide(i) ? true: false } }, child );
    let items = children.map( createItem );

    if( this.isElidable ){
      const startElide = _.findIndex( items, 'props.classes.elidable' );
      const elidedElement = h( ElideSymbolComponent, { elideSymbol } );
      items = insertAt( items, startElide, elidedElement );

      const collapseListElement = h( ElideToggleComponent, {
        getState: () => this.state.expanded,
        onToggle: evt => this.handleElideClick( evt ),
        expandLabel,
        collapseLabel
      }, h( 'small', 'Collapse' ) );
      items = items.concat( collapseListElement );
    }

    return items;
  }

  render(){
    const { children } = this.props;
    if( !children ) return null;
    return h('ul.expandable-list', {
      className: makeClassList({ expanded: this.state.expanded })
    }, this.getItems());
  }
}

ExpandableListComponent.defaultProps = {
  maxHead: 3,
  maxTail: 1,
  elideSymbol: h('i.material-icons', 'more_horiz'),
  expandLabel: h('span', 'More' ),
  collapseLabel: h('span', 'Fewer' )
};

export { ExpandableListComponent };