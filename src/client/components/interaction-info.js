let React = require('react');
let h = require('react-hyperscript');
let ReactDom = require('react-dom');
let { delay } = require('../../util');
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
    let p = this.props;
    let el = p.element;
    let s = this.state;
    let doc = p.document;

    return h('div.interaction-info', [
      // h('select.interaction-info-type-select', [
      //   h('option', { value: 'foo' }, 'Foo'),
      //   h('option', { value: 'bar' }, 'Bar')
      // ]),
      h('div.interaction-info-details', (
        doc.editable() ? [
          h('textarea.interaction-info-description', {
            placeholder: 'Interaction description',
            value: s.description,
            onChange: event => this.redescribe( event.target.value )
          })
        ] : [
          h('div.interaction-info-description', s.description || [
            h('div.element-info-message', [
              h('i.material-icons', 'info'),
              h('span', ' This interaction has no description.')
            ])
          ])
        ]
    ) )
    ]);
  }
}

module.exports = InteractionInfo;
