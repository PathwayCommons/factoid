const React = require('react');
const h = require('react-hyperscript');
const ReactDom = require('react-dom');
const { delay, isInteractionNode, focusDomElement } = require('../../util');
const _ = require('lodash');
const defs = require('../defs');
const { animateDomForEdit } = require('./animate');

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
      pptType: el.participantType( ppt )
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

    el.on('remoteredescribe', this.onRemoteRedescribe);
  }

  componentWillUnmount(){
    let el = this.props.element;

    el.removeListener('remoteredescribe', this.onRemoteRedescribe);
  }

  redescribe( descr ){
    let p = this.props;
    let el = p.element;

    this.debouncedRedescribe( descr );

    p.bus.emit('redescribedebounce', el, descr);

    this.setState({ description: descr });
  }

  render(){
    let children = [];
    let p = this.props;
    let el = p.element;
    let s = this.state;
    let doc = p.document;
    let descrId = 'interaction-info-description' + el.id();
    let descrDom;

    if( doc.editable() ){
      descrDom = h('textarea.interaction-info-description', {
        id: descrId,
        placeholder: 'Interaction description',
        value: s.description,
        onChange: event => this.redescribe( event.target.value )
      });
    } else {
      descrDom = h('div.interaction-info-description', s.description || [
        h('div.element-info-no-data', [
          h('span', ' This interaction has no description.')
        ])
      ]);
    }

    children.push( h('div.interaction-info-details', [
      h('label.interaction-info-description-label', { htmlFor: descrId }, 'Description'),
      descrDom
    ] ) );

    return h('div.interaction-info', children);
  }
}

module.exports = InteractionInfo;
