let React = require('react');
let h = require('react-hyperscript');
let ReactDom = require('react-dom');
let { delay, isInteractionNode } = require('../../util');
let _ = require('lodash');
let defs = require('../defs');
let anime = require('animejs');

class InteractionInfo extends React.Component {
  constructor( props ){
    super( props );

    this.debouncedRedescribe = _.debounce( descr => {
      this.props.element.redescribe( descr );
    }, defs.updateDelay );

    this.state = {
      description: props.element.description()
    };
  }

  componentDidMount(){
    let el = this.props.element;
    let root = ReactDom.findDOMNode( this );
    let comment = root.querySelector('.interaction-info-description');

    delay(0).then( () => comment.focus() );

    this.onRemoteRedescribe = () => {
      this.setState({ description: el.description() });

      if( this.remRedescrAni ){
        this.remRedescrAni.pause();
      }

      this.remRedescrAni = anime({
        targets: comment,
        backgroundColor: [defs.editAnimationWhite, defs.editAnimationColor, defs.editAnimationWhite],
        duration: defs.editAnimationDuration,
        easing: defs.editAnimationEasing
      });
    };

    el.on('remoteredescribe', this.onRemoteRedescribe);
  }

  componentWillUnmount(){
    let el = this.props.element;

    el.removeListener('remoteredescribe', this.onRemoteRedescribe);
  }

  redescribe( descr ){
    let p = this.props;
    let el = this.element;

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

    let evtTgt = p.eventTarget;

    if( evtTgt.isEdge() ){
      let selectId = 'interaction-info-type-select-' + el.id();
      let pptNode = evtTgt.connectedNodes().filter( el => !isInteractionNode(el) );
      let ppt = doc.get( pptNode.id() );

      children.push( h('label.interaction-info-type-select-label', {
        htmlFor: selectId
      }, 'Type') );

      children.push( h('select.interaction-info-type-select', {
        id: selectId,
        onChange: event => {
          let group = event.target.value;
          let regroupToNull = ppt => el.regroup( ppt, { group: null } );

          el.participants().forEach( regroupToNull );

          el.regroup( ppt, { group } );
        },
        defaultValue: el.group( ppt ),
        disabled: !doc.editable()
      }, el.GROUPS.map( gr => h('option', { value: gr.value }, gr.name) )) );
    }

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
        h('div.element-info-message', [
          h('i.material-icons', 'info'),
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
