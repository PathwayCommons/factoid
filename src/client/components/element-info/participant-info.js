import React from 'react';
import ReactDom from 'react-dom';
import h from 'react-hyperscript';
import uuid from 'uuid';
import { animateDomForEdit } from '../animate';
import { PARTICIPANT_TYPES } from '../../../model/element/participant-type';

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
    intn.unassociate(); // if we change the arrow, we can't guarantee the assoc is compatible anymore

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

      PARTICIPANT_TYPES.forEach( type => {
        let radioId = 'participant-info-type-radioset-item-' + uuid();
        let checked = this.state.pptType.value === type.value;

        radiosetChildren.push( h('input.participant-info-type-radio', {
          type: 'radio',
          onChange: () => {
            this.retype( type );
            bus.emit('retypeppt', interaction, participant, type);
          },
          onClick: () => {
            if( checked ){ // skip to next stage when clicking existing selection
              bus.emit('retypepptskip', interaction, participant, type);
            }
          },
          id: radioId,
          name: radioName,
          checked
        }) );

        radiosetChildren.push( h('label.participant-info-type-label', {
          htmlFor: radioId
        }, [
          h('i', { className: type.icon })
        ]) );
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

export default props => h(ParticipantInfo, Object.assign({
  key: props.interaction.id() + '-' + props.participant.id()
}, props));
