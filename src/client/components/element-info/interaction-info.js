import DataComponent from '../data-component';
import h from 'react-hyperscript';
import ReactDom from 'react-dom';
import { initCache, error } from '../../../util';
import _ from 'lodash';
import * as defs from '../../defs';
import { animateDomForEdit } from '../animate';
import uuid from 'uuid';
import Progression from './progression';
import EventEmitter from 'eventemitter3';
import { INTERACTION_TYPES, INTERACTION_TYPE } from '../../../model/element/interaction-type';
// import { Carousel, CAROUSEL_CONTENT } from '../carousel';
import RelatedPapers from '../related-papers';

let stageCache = new WeakMap();

class InteractionInfo extends DataComponent {
  constructor( props ){
    super( props );

    this.debouncedRedescribe = _.debounce( descr => {
      this.props.element.redescribe( descr );
    }, defs.updateDelay );

    let p = this.props;
    let el = p.element;

    let progression = new Progression({
      STAGES: ['PARTICIPANT_TYPES', 'ASSOCIATE', 'COMPLETED'],
      getStage: () => this.getStage(),
      canGoToStage: stage => this.canGoToStage(stage),
      goToStage: stage => this.goToStage(stage)
    });

    let { STAGES, ORDERED_STAGES } = progression;
    let initialStage = ORDERED_STAGES[1]; // skip the arrow / ppt types stage b/c the user drew the edge with the arrow already

    let stage = initCache( stageCache, el, el.completed() ? STAGES.COMPLETED : initialStage );

    this.data = {
      el,
      stage,
      description: p.element.description(),
      progression,
      bus: p.bus || new EventEmitter()
    };
  }

  getStage(){
    return this.data.stage;
  }

  canGoToStage( stage ){
    let { el, progression } = this.data;
    let { STAGES } = progression;

    switch( stage ){
      case STAGES.PARTICIPANT_TYPES:
        return false; // disable this phase for now, maybe delete all related code eventually
      case STAGES.ASSOCIATE:
        return true;
      case STAGES.COMPLETED:
        return el.associated();
      default:
        return false;
    }
  }

  goToStage( stage ){
    let { el, progression, bus, stage: currentStage } = this.data;
    let { STAGES } = progression;

    if( this.canGoToStage(stage) ){
      this.setData({ stage, stageError: null });

      stageCache.set( el, stage );

      switch( stage ){
        case STAGES.ASSOCIATE:
          bus.emit('closepptstip', el);
          break;

        case STAGES.PARTICIPANT_TYPES:
          bus.emit('openpptstip', el);
          break;

        case STAGES.COMPLETED:
          bus.emit('closepptstip', el);
          this.complete();
          break;

        default:
          throw error(`No such stage: ${stage}`);
      }
    } else {
      let stageError;

      switch( currentStage ){
        case STAGES.ASSOCIATE:
          stageError = `Select a type before proceeding.`;
          break;
        default:
          stageError = 'This step should be completed before proceeding.';
      }

      this.setData({ stageError });
    }
  }

  animateEditByKey( domEl, key ){
    let ans = this._animations = this._animations || {};

    if( ans[key] ){
      ans[key].pause();
    }

    ans[key] = animateDomForEdit( domEl );
  }

  componentDidMount(){
    let root = ReactDom.findDOMNode( this );
    let comment = root.querySelector('.interaction-info-description');
    let { progression, bus, el } = this.data;
    let { STAGES } = progression;
    let stage = progression.getStage();

    progression.goToStage( stage );

    this.onRemoteRedescribe = () => {
      this.setData({ description: this.data.el.description() });

      this.animateEditByKey( comment, 'descr' );
    };

    this.onAssociate = () => {
      this.dirty();
    };

    this.onRemoteAssociate = () => {
      this.dirty( () => {
        let input = root.querySelector(`.interaction-info-assoc-radioset`);

        this.animateEditByKey( input, 'assoc' );
      } );
    };

    let goPastPptTypeStage = () => {
      if( progression.getStage() === STAGES.PARTICIPANT_TYPES ){
        progression.forward();
      }
    };

    this.onRetypePpt = () => {
      goPastPptTypeStage();
    };

    this.onRetypePptSkip = () => {
      goPastPptTypeStage();
    };

    el.on('remoteassociate', this.onRemoteAssociate);
    el.on('remoteredescribe', this.onRemoteRedescribe);
    el.on('associate', this.onAssociate);
    bus.on('retypeppt', this.onRetypePpt);
    bus.on('retypepptskip', this.onRetypePptSkip);
  }

  componentWillUnmount(){
    let { element: el, bus } = this.props;

    el.removeListener('remoteassociate', this.onRemoteAssociate);
    el.removeListener('remoteredescribe', this.onRemoteRedescribe);
    el.removeListener('associate', this.onAssociate);
    bus.removeListener('retypeppt', this.onRetypePpt);
    bus.removeListener('retypepptskip', this.onRetypePptSkip);
  }

  redescribe( descr ){
    let p = this.props;
    let el = p.element;

    this.debouncedRedescribe( descr );

    p.bus.emit('redescribedebounce', el, descr);

    this.setData({ description: descr });
  }

  associate( assoc ){
    let p = this.props;
    let el = p.element;

    el.associate( assoc );
  }

  complete(){
    let p = this.props;
    let el = p.element;

    el.complete();
  }

  render(){
    let children = [];
    let p = this.props;
    let el = p.element;
    let s = this.data;
    let doc = p.document;
    let { progression } = s;
    let { STAGES, ORDERED_STAGES } = progression;
    let stage = progression.getStage();

    if( stage === STAGES.COMPLETED || !doc.editable() ){
      let showEditButton = doc.editable();
      const relPprs = el.relatedPapers();
      const hasRelatedPapers = relPprs != null && relPprs.length > 0;
      let showRelatedPapers = !doc.editable() && hasRelatedPapers;
      let assoc = el.association();
      let summaryChildren = [];

      summaryChildren.push( h('div.interaction-info-summary-text', assoc ? assoc.toString() : [
        h('i.material-icons', 'info'),
        h('span', ' This interaction has no data associated with it.')
      ]) );

      if( showEditButton ){
        summaryChildren.push( h('div.interaction-info-edit', [
          h('button.salient-button', {
            onClick: () => progression.goToStage( ORDERED_STAGES[1] )
          }, `Select a different type than "${assoc.displayValue}"`)
        ]) );
      }

      if( showRelatedPapers ){
        summaryChildren.push( h('div.interaction-info-reld-papers-title', 'Recommended articles') );
        
        summaryChildren.push( h('div.interaction-info-related-papers', [
          h(RelatedPapers, { document, source: el })
        ]) );
      } else if(!doc.editable()) {
        summaryChildren.push( h('div.editor-coming-soon-placeholder', `Biofactoid is looking for more information about this article from PubMed and pathway databases.  This information will appear here as soon as it is available.`) );
      }

      children.push( h('div.interaction-info-summary', summaryChildren) );
    } else if( stage === STAGES.ASSOCIATE ){
      let radioName = 'interaction-info-assoc-radioset-' + el.id();
      let radiosetChildren = [];

      INTERACTION_TYPES.forEach( IntnType => {
        let radioId = 'interaction-info-assoc-radioset-item-' + uuid();
        let checked = el.associated() && el.association().value === IntnType.value;
        let indented = [
          INTERACTION_TYPE.PHOSPHORYLATION,
          INTERACTION_TYPE.DEPHOSPHORYLATION,
          INTERACTION_TYPE.METHYLATION,
          INTERACTION_TYPE.DEMETHYLATION,
          INTERACTION_TYPE.UBIQUITINATION,
          INTERACTION_TYPE.DEUBIQUITINATION
        ].some( IndentedType => IndentedType.value === IntnType.value );

        radiosetChildren.push( h('input.interaction-info-type-radio', {
          type: 'radio',
          onChange: () => {
            this.associate( IntnType );
            progression.forward();
          },
          onClick: () => { // skip to next stage when clicking existing assoc
            if( checked ){ progression.forward(); }
          },
          id: radioId,
          name: radioName,
          value: IntnType.value,
          checked
        }) );

        radiosetChildren.push( h('label.interaction-info-assoc-radio-label', {
          className: indented ? 'interaction-info-type-radio-indented' : '',
          htmlFor: radioId
        }, IntnType.displayValue) );
      } );

      children.push( h('label.interaction-info-assoc-radioset-label', 'Interaction type') );

      children.push( h('div.interaction-info-assoc-radioset', radiosetChildren) );
    }

    return h('div.interaction-info' + (!doc.editable() ? '.interaction-info-ro' : '' ), children);
  }
}

export default props => h(InteractionInfo, Object.assign({ key: props.element.id() }, props));
