import h from 'react-hyperscript';
import { Component } from 'react';
import { makeClassList } from '../dom';
import _ from 'lodash';


export const ACCORDION_ITEM_FIELDS = {
  TITLE: 'title',
  DESCRIPTION: 'description'
};


export class AccordionItem extends Component {
  constructor(props){
    super(props);

    this.state = {
      isOpen: false
    };
  }

  toggleItem(){
    this.setState({ isOpen: !this.state.isOpen });
  }

  render(){
    const { title, description } = this.props.item;
    const { isOpen } = this.state;
    const content = _.isString( description ) ? [ h('p', description) ] : description;
    return h('div.accordion-item', [
      h('div.accordion-item-header', {
          className: makeClassList({
            'open': isOpen
          }),
          onClick: () => this.toggleItem()
        }, [
        h( 'p.accordion-item-header-title', title ),
        isOpen ? h('i.material-icons.accordion-item-header-icon', 'expand_less') :
        h('i.material-icons.accordion-item-header-icon', 'expand_more')
      ]),
      h('div.accordion-item-content', content )
    ]);
  }
}

export class Accordion extends Component {
  constructor(props){
    super(props);

    this.state = {
    };
  }

  render(){
    const { title, items } = this.props;
    return h('div.accordion', [
      title ? h('h3.accordion-title', title ) : null,
      h('div.accordion-items', items.map( (item, key) => h( AccordionItem, { key, item } ) ) )
    ]);
  }
}

export default Accordion;