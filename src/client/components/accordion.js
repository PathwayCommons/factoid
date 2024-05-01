import h from 'react-hyperscript';
import { Component } from 'react';
import { makeClassList } from '../dom';


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
    return h('div.accordion-item', {
      className: makeClassList({
        'open': isOpen
      }),
      onClick: () => this.toggleItem()
    }, [
      h('div.accordion-item-header', [
        h( 'div.accordion-item-header-title', title ),
        isOpen ? h('i.material-icons.accordion-item-header-icon', 'expand_less') :
        h('i.material-icons.accordion-item-header-icon', 'expand_more')
      ]),
      h('p.accordion-item-content', description )
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
      h('h2.accordion-title', title ),
      h('div.accordion-items', items.map( (item, key) => h( AccordionItem, { key, item } ) ) )
    ]);
  }
}

export default Accordion;