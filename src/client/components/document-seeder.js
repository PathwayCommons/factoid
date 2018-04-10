const React = require('react');
const h = require('react-hyperscript');
const Promise = require('bluebird');
const ReactDom = require('react-dom');
const DocumentWizardStepper = require('./document-wizard-stepper');
const _ = require('lodash');
const IntervalHighlighter = require('./interval-highlighter');
const { makeClassList } = require('../../util');

const ENTITY_HIGHLIGHT_CLASS = 'document-seeder-highlighted-entity';
const INTERACTION_HIGHLIGHT_CLASS = 'document-seeder-highlighted-interaction';

class DocumentSeeder extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      submitting: false,
      reachHighlightIntervals: [],
      reachHighlightInput: '',
      reachHighlightEnabled: false
    };
  }

  getDocumentSeederTextVal(){
    return ReactDom.findDOMNode(this).querySelector('.document-seeder-text').value;
  }

  getReachResponse(){
    let text = this.state.reachHighlightInput;

    let makeRequest = () => fetch('/api/document/queryReach', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text })
    });

    let toJson = res => res.json();

    return Promise.try( makeRequest ).then( toJson );
  }

  updateReachHighlightInput(){
    let reachInput = this.getDocumentSeederTextVal();
    this.setState({
      reachHighlightInput: reachInput
    });
  }

  updateReachHighlightIntervals(reachResponse){
    let intervals = this.getReachHighlightIntervals(reachResponse);

    this.setState({
      reachHighlightIntervals: intervals
    });
  }

  clearReachHighlightState(){
    this.setState({
      reachHighlightInput: '',
      reachHighlightIntervals: []
    });
  }

  getReachHighlightIntervals(reachResponse){

    let frameToInterval = frame => {
      return {
        start: _.get( frame, ['start-pos', 'offset'] ),
        end: _.get( frame, ['end-pos', 'offset'] )
      }
    };

    let isEvtSentenceFrame = frame => evtSentencesSet.has( _.get( frame, 'frame-id' ) );

    let entityIntervals = _.get( reachResponse, ['entities', 'frames'], []).map( frameToInterval );
    let evtSentencesSet = new Set( _.get( reachResponse, ['events', 'frames'], []).map( frame => frame.sentence ) );

    let interactionIntervals = _.get( reachResponse, ['sentences', 'frames'], []).filter( isEvtSentenceFrame ).map( frameToInterval );

    return this.mergeIntervals(entityIntervals, interactionIntervals)
  }

  // merges entity intervals and interaction intervals, resulting array
  // contains objects that has an extra 'classes' field
  mergeIntervals(entityIntervals, interactionIntervals){

    let cmp = (int1, int2) => {
      return int1.start - int2.start;
    };

    // sort intervals by start index
    entityIntervals = entityIntervals.sort(cmp);
    interactionIntervals = interactionIntervals.sort(cmp);

    let entityIndex = 0;
    let interactionIndex = 0;
    let retVal = [];

    while ( entityIndex < entityIntervals.length && interactionIndex < interactionIntervals.length ) {
      let entityInt = entityIntervals[entityIndex];
      let interactionInt = interactionIntervals[interactionIndex];

      // push an interaction object for the part of interaction that intersects no entity
      if ( entityInt.start > interactionInt.start ) {
        let interactionObj = {
          start: interactionInt.start,
          end: Math.min(entityInt.start, interactionInt.end),
          classes: [ INTERACTION_HIGHLIGHT_CLASS ]
        };

        retVal.push(interactionObj);

        // update the beginining of interaction interval since we just covered some
        interactionInt.start = interactionObj.end;

        // if the whole interaction is covered pass to the next one
        // this would happen if interaction sentence does not include any entity
        if ( interactionInt.end === interactionObj.end ) {
          interactionIndex++;
          continue;
        }
      }

      let entityObj = {
        start: entityInt.start,
        end: entityInt.end,
        classes: [ ENTITY_HIGHLIGHT_CLASS ]
      };

      // if entity is covered by interaction it makes an intersection
      // so it should have the interaction class as well
      if ( entityInt.start >= interactionInt.start && entityInt.end <= interactionInt.end ) {
        entityObj.classes.push( INTERACTION_HIGHLIGHT_CLASS );
        interactionInt.start = entityInt.end;

        // we are done with this intersection pass to the next one
        if ( interactionInt.start >= interactionInt.end ) {
          interactionIndex++;
        }
      }

      retVal.push(entityObj);

      // pass to next entity
      entityIndex++;
    }

    let iterateRemaningIntervals = ( index, intervals, higlightClass ) => {
      while ( index < intervals.length ) {
        let interval = intervals[index];
        retVal.push({
          start: interval.start,
          end: interval.end,
          classes: [ higlightClass ]
        });
        index++;
      }
    }

    // iterate through the remaining intervals
    iterateRemaningIntervals( entityIndex, entityIntervals, ENTITY_HIGHLIGHT_CLASS );
    iterateRemaningIntervals( interactionIndex, interactionIntervals, INTERACTION_HIGHLIGHT_CLASS );

    return retVal;
  }

  toggleReachHighlights() {
    let toggleHighlightState = () => {
      this.setState({
        reachHighlightEnabled: !this.state.reachHighlightEnabled
      });
    }

    let highlightOrClear = () => {
      if (this.state.reachHighlightEnabled) {
        Promise.try(this.updateReachHighlightInput.bind(this))
                    .then(this.getReachResponse.bind(this))
                    .then(this.updateReachHighlightIntervals.bind(this));
      }
      else {
        this.clearReachHighlightState();
      }
    };

    Promise.try(toggleHighlightState).then(highlightOrClear);
  }

  createDoc(){
    let text = this.getDocumentSeederTextVal();

    let makeRequest = () => fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text })
    });

    let toJson = res => res.json();

    let updateState = documentJson => {
      documentJson.editable = true;

      this.setState({ documentJson, submitting: false });
    };

    this.setState({ submitting: true });

    return Promise.try( makeRequest ).then( toJson ).then( updateState );
  }

  goToChooser(){
    let { history } = this.props;
    let { id, secret } = this.state.documentJson;

    history.push(`/new/choice/${id}/${secret}`);
  }

  render(){
    let rootChildren = [
      h('h1', 'Enter paper text'),
      h('label.document-seeder-text-label', 'Paper text'),
      h('textarea.document-seeder-text', {
        className: makeClassList({
          'document-seeder-hidden': this.state.reachHighlightEnabled
        })
      }),
      h('div.document-seeder-highlight-panel', {
        className: makeClassList({
          'document-seeder-hidden': !this.state.reachHighlightEnabled
        })
      },[
        h(IntervalHighlighter, { text: this.state.reachHighlightInput, intervals: this.state.reachHighlightIntervals })
      ]),
      h('button.document-seeder-toggle-highlight', {
        onClick: () => {
          this.toggleReachHighlights();
        }
      }, `${this.state.reachHighlightEnabled ? 'Edit Text' : 'Highlight Entities and Interactions'}`),
      h(DocumentWizardStepper, {
        backEnabled: false,
        forward: () => {
          let create = () => this.createDoc();
          let go = () => this.goToChooser();

          return Promise.try( create ).then( go );
        }
      })
    ];

    return h('div.document-seeder.page-content', rootChildren);
  }
}

module.exports = DocumentSeeder;
