import DataComponent from '../data-component';
import h from 'react-hyperscript';
import ReactDom from 'react-dom';
import { initCache, error } from '../../../util';
import _ from 'lodash';
import * as defs from '../../defs';
import { animateDomForEdit } from '../animate';
import Progression from './progression';
import EventEmitter from 'eventemitter3';
// import { INTERACTION_TYPES, INTERACTION_TYPE } from '../../../model/element/interaction-type';
import { makeCancelable } from '../../../util';
import assocDisp from './entity-assoc-display';

let stageCache = new WeakMap();
let associationCache = new WeakMap();

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
    let assoc = initCache( associationCache, el, { matches: [], offset: 0 } );

    this.data = {
      el,
      stage,
      description: p.element.description(),
      progression,
      bus: p.bus || new EventEmitter(),
      limit: defs.associationSearchLimit,
      matches: assoc.matches,
      offset: assoc.offset,
      gettingMoreMatches: false
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
    let { progression, bus, el, matches } = this.data;
    let { STAGES } = progression;
    let stage = progression.getStage();

    progression.goToStage( stage );

    if( matches.length === 0 && el != null ){
      this.updateMatches();
    }

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

  updateMatches( offset = this.data.offset ) {
    let { limit, el } = this.data;
    let s = this.data;

    let sign;
    let sources, targets;

    let assoc = el.association();

    if ( assoc.isPositive() ) {
      sign = 'P';
    }
    else if ( assoc.isNegative() ) {
      sign = 'N';
    }
    else {
      sign = 'U';
    }

    if ( assoc.isSigned() ) {
      sources = [ assoc.getSource().name() ];
      targets = [ assoc.getTarget().name() ];
    }
    else {
      sources = el.participants().map( p => p.name() );
    }

    offset = offset || s.offset;

    let q = {
      sources,
      targets,
      limit,
      offset: offset,
      sign
    };

    let makeRequest = () => fetch( '/api/element-association/search-intn', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(q)
    } );

    let jsonify = res => res.json();

    let updateView = matches => {
      matches.forEach( m => s.matches.push(m) );

      // cache the matches in the element for re-creation of component
      associationCache.set( el, {
        matches: s.matches,
        offset
      } );

      this.setData({ matches: s.matches, offset, loadingMatches: false });
    };


    let setLoadingMatches = () => {
      this.setData({
        loadingMatches: true
      });
    };

    return makeCancelable(
      Promise.resolve()
        .then( setLoadingMatches )
        .then( makeRequest )
        .then( jsonify )
        .then( updateView )
    );
  }

  getMoreMatches( numMore = this.data.limit ){
    let s = this.data;

    if ( s.gettingMoreMatches ) { return Promise.resolve(); }

    let offset = s.offset + numMore;

    this.setData({
      gettingMoreMatches: true
    });

    return this.updateMatches( offset ).then( () => {
      this.setData({
        gettingMoreMatches: false
      });
    } );
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

      children.push( h('div.interaction-info-summary', summaryChildren) );
    } else if( stage === STAGES.ASSOCIATE ){

      let onMatchesScroll = _.debounce( div => {
        let scrollMax = div.scrollHeight;
        let scroll = div.scrollTop + div.clientHeight;

        if( scroll >= scrollMax ){
          this.getMoreMatches();
        }
      }, defs.updateDelay / 2 );

      let Loader = ({ loading = true }) => h('div.entity-info-matches-loading' + (loading ? '.entity-info-matches-loading-active' : ''), [
        loading ? h('i.icon.icon-spinner') : h('i.material-icons', 'remove')
      ]);

      let renderMatch = m => {
        return [
          h('div.entity-info-name', m.type),
          h('span.entity-info-section', [
            h('span', m.text)
          ])
        ];

      };


      let { matches, loadingMatches } = s;
      let getInteractions = () => matches.map( m => {
        return h('div.entity-info-match', [
          h('div.entity-info-match-target', {
            onClick: () => { // skip to next stage when clicking existing assoc
              progression.forward();
              // TODO: make the mapping between indra and factoid
              // and call this method after finding the correct factoid interaction type
              // this.associate( intnType );
            }
          }, renderMatch( m ) ),
          assocDisp.link( { id: m.pmid, namespace: 'intn' } )
        ]);
      } );

      let getContent = () => {
        if ( matches.length == 0 && loadingMatches ) {
          return h(Loader);
        }
        else {
          return getInteractionsContainer();
        }
      };

      let getInteractionsContainer = () => h('div.entity-info-matches', {
        onScroll: evt => {
          onMatchesScroll( evt.target );

          evt.stopPropagation();
        }
      }, [ ...getInteractions(), h(Loader, { loading: s.gettingMoreMatches }) ]);

      children.push(getContent());
    }

    return h('div.interaction-info', children);
  }
}

export default props => h(InteractionInfo, Object.assign({ key: props.element.id() }, props));
