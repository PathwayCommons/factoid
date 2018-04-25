const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const uuid = require('uuid');
const { animateDomForEdit } = require('../animate');

class ParticipantInfo extends React.Component {
  constructor( props ){
    super( props );

    let ppt = props.participant;
    let intn = props.interaction;

    this.state = {
      ppt: ppt,
      pptType: intn.participantType( ppt )
    };
  }

  retype( type ){
    let p = this.props;
    let ppt = p.participant;
    let intn = p.interaction;
    let retypeToNull = ppt => intn.participantType( ppt, null );

    intn.participants().forEach( retypeToNull );

    intn.participantType( ppt, type );

    this.setState({ pptType: type });
  }

  render(){
    let p = this.props;
    let { participant, interaction, document, bus } = p;
    let doc = document;
    let ppt = participant;
    let intn = interaction;
    let children = [];

    if( doc.editable() ){
      let radioName = 'participant-info-type-radioset-' + ppt.id();
      let radiosetChildren = [];

      intn.PARTICIPANT_TYPES.forEach( type => {
        if( !intn.association().allowedParticipantTypes().some( t => t.value === type.value ) ){
          return; // ignore unsupported ppt types for the interaction type
        }

        let radioId = 'participant-info-type-radioset-item-' + uuid();

        radiosetChildren.push( h('input.participant-info-type-radio', {
          type: 'radio',
          onChange: () => {
            this.retype( type );
            bus.emit('retypeppt', interaction, participant, type);
          },
          id: radioId,
          name: radioName,
          checked: this.state.pptType.value === type.value
        }) );

        radiosetChildren.push( h('label.participant-info-type-label', {
          htmlFor: radioId,
          dangerouslySetInnerHTML: { __html: type.icon }
        }) );
      } );

      children.push( h('div.radioset.participant-info-type-radioset', radiosetChildren) );
    } else {
      children.push( h('div.participant-info-type-text', intn.participantType( ppt ).displayValue ) );
    }

    return h('div.participant-info', children);
  }

  componentDidMount(){
    let intn = this.props.interaction;
    let ppt = this.props.participant;
    let root = ReactDom.findDOMNode( this );
    let typeSel = root.querySelector('.participant-info-type-radioset');

    this.onRemoteRetype = ( retypedPpt, newType ) => {
      if( retypedPpt.id() === ppt.id() ){
        this.setState({ pptType: newType });

        if( this.remRetypeAni ){
          this.remRetypeAni.pause();
        }

        this.remRetypeAni = animateDomForEdit( typeSel );
      }
    };

    this.onRetypeOther = ( retypedPpt ) => {
      if( retypedPpt.id() !== ppt.id() ){
        this.setState({ pptType: intn.participantType(ppt) });
      }
    };

    intn.on('remoteretype', this.onRemoteRetype);
    intn.on('retype', this.onRetypeOther);
  }

  componentWillUnmount(){
    let intn = this.props.interaction;

    intn.removeListener('remoteretype', this.onRemoteRetype);
    intn.removeListener('retype', this.onRetypeOther);
  }
}

module.exports = props => h(ParticipantInfo, Object.assign({
  key: props.interaction.id() + '-' + props.participant.id()
}, props));
