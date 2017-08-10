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

    if( evtTgt.isEdge() ){
      let selectId = 'interaction-info-type-select-' + el.id();
      let pptNode = evtTgt.connectedNodes().filter( el => !isInteractionNode(el) );
      let ppt = doc.get( pptNode.id() );
      let otherPpts = el.participants().filter( p => p !== ppt );
      let otherPptNames = otherPpts[0].name();

      if( otherPpts.length > 1 ){
        otherPptNames = '(' + otherPptNames + ', ...)';
      }

      children.push( h('label.interaction-info-type-select-label', {
        htmlFor: selectId
      }, [
        h('span', 'Type'),
        h('span.interaction-info-type-select-label-dir', [
          h('span', otherPptNames),
          h('i.material-icons', 'arrow_forward'),
          h('span', ppt.name())
        ])
      ]) );

      if( doc.editable() ){
        children.push( h('select.interaction-info-type-select', {
          id: selectId,
          onChange: event => {
            let type = event.target.value;
            let retypeToNull = ppt => el.participantType( ppt, null );

            el.participants().forEach( retypeToNull );

            el.participantType( ppt, type );
          },
          defaultValue: el.participantType( ppt ).value,
          disabled: !doc.editable()
        }, el.PARTICIPANT_TYPES.map( type => h('option', { value: type.value }, type.displayValue) )) );
      } else {
        children.push( h('div.interaction-info-type-text', el.participantType( ppt ).displayValue ) );
      }
    }

    return h('div.interaction-info', children);
  }
}

module.exports = InteractionInfo;
