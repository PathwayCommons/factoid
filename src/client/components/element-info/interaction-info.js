const React = require('react');
const h = require('react-hyperscript');
const ReactDom = require('react-dom');
const { isInteractionNode } = require('../../../util');
const _ = require('lodash');
const defs = require('../../defs');
const { animateDomForEdit } = require('../animate');
const uuid = require('uuid');

class InteractionInfo extends React.Component {
  constructor( props ){
    super( props );

    this.debouncedRedescribe = _.debounce( descr => {
      this.props.element.redescribe( descr );
    }, defs.updateDelay );

    let p = this.props;
    let el = p.element;
    let doc = p.document;
    let evtTgt = p.eventTarget;
    let pptNode = evtTgt.connectedNodes().filter( el => !isInteractionNode(el) );
    let ppt = doc.get( pptNode.id() );

    this.state = {
      description: props.element.description(),
      ppt: ppt,
      pptType: el.participantType( ppt ),
      assoc: el.association()
    };
  }

  componentDidMount(){
    let el = this.props.element;
    let root = ReactDom.findDOMNode( this );
    let comment = root.querySelector('.interaction-info-description');

    this.onRemoteRedescribe = () => {
      this.setState({ description: el.description() });

      if( this.remRedescrAni ){
        this.remRedescrAni.pause();
      }

      this.remRedescrAni = animateDomForEdit( comment );
    };

    this.onAssociate = () => {
      this.setState({ assoc: el.association() });
    };

    el.on('remoteredescribe', this.onRemoteRedescribe);
    el.on('associate', this.onAssociate);
  }

  componentWillUnmount(){
    let el = this.props.element;

    el.removeListener('remoteredescribe', this.onRemoteRedescribe);
    el.removeListener('associate', this.onAssociate);
  }

  redescribe( descr ){
    let p = this.props;
    let el = p.element;

    this.debouncedRedescribe( descr );

    p.bus.emit('redescribedebounce', el, descr);

    this.setState({ description: descr });
  }

  associate( assoc ){
    let p = this.props;
    let el = p.element;

    el.associate( assoc );
  }

  render(){
    let children = [];
    let p = this.props;
    let el = p.element;
    let s = this.state;
    let doc = p.document;
    let descrDom, assocDom;

    if( doc.editable() ){
      descrDom = h('textarea.interaction-info-description', {
        placeholder: 'Interaction description',
        value: s.description,
        onChange: event => this.redescribe( event.target.value )
      });

      let radioName = 'interaction-info-assoc-radioset-' + el.id();
      let radiosetChildren = [];

      el.ASSOCIATIONS.forEach( assoc => {
        let radioId = 'interaction-info-assoc-radioset-item-' + uuid();

        radiosetChildren.push( h('input.interaction-info-type-radio', {
          type: 'radio',
          onChange: () => this.associate( assoc ),
          id: radioId,
          name: radioName,
          checked: this.state.assoc.value === assoc.value
        }) );

        radiosetChildren.push( h('label.interaction-info-assoc-radio-label', {
          htmlFor: radioId
        }, assoc.displayValue) );
      } );

      assocDom = h('div.interaction-info-assoc-radioset', radiosetChildren);
    } else {
      descrDom = h('div.interaction-info-description', s.description || 'This interaction has no description.');
    }

    children.push( h('div.interaction-info-details', [
      h('label.interaction-info-assoc-label', 'Type'),
      assocDom,

      h('label.interaction-info-description-label', 'Description'),
      descrDom
    ] ) );

    return h('div.interaction-info', children);
  }
}

module.exports = InteractionInfo;
