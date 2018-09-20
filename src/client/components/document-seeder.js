const React = require('react');
const h = require('react-hyperscript');
const Promise = require('bluebird');
const _ = require('lodash');
const { makeClassList } = require('../../util');


const DocumentWizardStepper = require('./document-wizard-stepper');
const IntervalHighlighter = require('./interval-highlighter');
const Tooltip = require('./popover/tooltip');
const Popover = require('./popover/popover');
const AppNav = require('./app-nav');

const ENTITY_HIGHLIGHT_CLASS = 'document-seeder-highlighted-entity';
const INTN_SENTENCE_HIGHLIGHT_CLASS = 'document-seeder-highlighted-interaction-sentence';
const INTN_TRIGGER_HIGHLIGHT_CLASS = 'document-seeder-highlighted-interaction-trigger';

class DocumentSeeder extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      submitting: false,
      reachHighlightIntervals: [],
      reachHighlightInput: '',
      reachHighlightEnabled: false,
      docTitle: '',
      docText: ''
    };
  }

  getDocumentSeederTextVal(){
    return this.state.docText;
  }

  getDocumentTitleTextVal(){
    return this.state.docTitle;
  }

  getReachResponse(){
    let text = this.state.reachHighlightInput;

    let makeRequest = () => fetch('/api/document/query-reach', {
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
      };
    };

    // extract interval of the trigger word from the event frame where "trigger" field exists
    let frameToTriggerInterval = frame => {
      let frameText = _.get(frame, 'text');
      let frameStart = _.get(frame, ['start-pos', 'offset']);
      let triggerWord = _.get(frame, 'trigger');

      if (triggerWord === undefined) {
        throw 'Frame should have a trigger field!';
      }

      let relativeTriggerIndex = frameText.indexOf(triggerWord);
      let triggerStart = frameStart + relativeTriggerIndex;
      let triggerEnd = triggerStart + triggerWord.length;

      return {
        start: triggerStart,
        end: triggerEnd
      };
    };

    // attaches the given class to each of given intervals
    let attachHighlightClass = (intervals, className) => {
      intervals.forEach(interval => {
        _.set(interval, 'class', className);
      });
    };

    let isEvtSentenceFrame = frame => evtSentencesSet.has( _.get( frame, 'frame-id' ) );

    let evtFrames = _.get( reachResponse, ['events', 'frames'], [] );

    let entityIntervals = _.get( reachResponse, ['entities', 'frames'], []).map( frameToInterval );
    let evtSentencesSet = new Set( evtFrames.map( frame => frame.sentence ) );

    let sentenceIntervals = _.get( reachResponse, ['sentences', 'frames'], []).filter( isEvtSentenceFrame ).map( frameToInterval );
    let triggerIntervals = evtFrames.filter( frame => frame.trigger !== undefined ).map( frameToTriggerInterval );

    attachHighlightClass(entityIntervals, ENTITY_HIGHLIGHT_CLASS);
    attachHighlightClass(triggerIntervals, INTN_TRIGGER_HIGHLIGHT_CLASS);
    attachHighlightClass(sentenceIntervals, INTN_SENTENCE_HIGHLIGHT_CLASS);

    // combine entityIntervals and triggerIntervals as basicIntervals
    let basicIntervals = [...entityIntervals, ...triggerIntervals];

    return this.mergeIntervals(basicIntervals, sentenceIntervals);
  }

  // Merges basic intervals and complex intervals, resulting array
  // contains objects that has 'start', 'end' and 'classes' fields.
  // Complex intervals may cover basic intervals but the other way around is
  // not valid.
  mergeIntervals(basicIntervals, complexIntervals){

    let cmp = (int1, int2) => {
      return int1.start - int2.start;
    };

    // sort intervals by start index
    basicIntervals = basicIntervals.sort(cmp);
    complexIntervals = complexIntervals.sort(cmp);

    let eliminateDuplication = sortedArr => {
      return sortedArr.filter( ( currVal, currIndex ) => {
        let compPrev = () => {
          let prevVal = sortedArr[ currIndex - 1 ];

          return currVal.start === prevVal.start && currVal.end === prevVal.end;
        };

        return currIndex === 0 || !compPrev();
      } );
    };

    // same intervals would be repeated based on text mining results
    // handle such cases by removing any duplication of intervals
    basicIntervals = eliminateDuplication( basicIntervals );
    complexIntervals = eliminateDuplication( complexIntervals );

    let basicIndex = 0;
    let complexIndex = 0;
    let retVal = [];

    while ( basicIndex < basicIntervals.length && complexIndex < complexIntervals.length ) {
      let basicInt = basicIntervals[basicIndex];
      let complexInt = complexIntervals[complexIndex];

      // push a complex object for the part of complex interval that intersects no basic interval
      if ( basicInt.start > complexInt.start ) {
        let complexObj = {
          start: complexInt.start,
          end: Math.min(basicInt.start, complexInt.end),
          classes: [ complexInt.class ]
        };

        retVal.push(complexObj);

        // update the beginining of complex interval since we just covered some
        complexInt.start = complexObj.end;

        // if the whole complex interval is covered pass to the next one
        // this would happen if complex interval does not include any basic interval
        if ( complexInt.end === complexObj.end ) {
          complexIndex++;
          continue;
        }
      }

      let basicObj = {
        start: basicInt.start,
        end: basicInt.end,
        classes: [ basicInt.class ]
      };

      // if basic interval is covered by complex interval it makes an intersection
      // so it should have the complex class as well
      if ( basicInt.start >= complexInt.start && basicInt.end <= complexInt.end ) {
        basicObj.classes.push( complexInt.class );
        complexInt.start = basicInt.end;

        // we are done with this intersection pass to the next one
        if ( complexInt.start >= complexInt.end ) {
          complexIndex++;
        }
      }

      retVal.push(basicObj);

      // pass to next basic interval
      basicIndex++;
    }

    let iterateRemaningIntervals = ( index, intervals ) => {
      while ( index < intervals.length ) {
        let interval = intervals[index];
        retVal.push({
          start: interval.start,
          end: interval.end,
          classes: [ interval.class ]
        });
        index++;
      }
    };

    // iterate through the remaining intervals
    iterateRemaningIntervals( basicIndex, basicIntervals );
    iterateRemaningIntervals( complexIndex, complexIntervals );

    return retVal;
  }

  toggleReachHighlights() {
    let toggleHighlightState = () => {
      this.setState({
        reachHighlightEnabled: !this.state.reachHighlightEnabled
      });
    };

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
    let title = this.getDocumentTitleTextVal();

    let makeRequest = () => fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text, title })
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
    let { history } = this.props;

    return h('div.document-seeder', [
      h('div.document-seeder-content', [
        h('h2', 'Enter Paper Details'),
        h('label.document-seeder-text-label', 'Paper title'),
        h('input.document-seeder-doc-title', {
          type: 'text',
          placeholder: 'Untitled document',
          onChange: e => this.setState({docTitle: e.target.value})
        }),
        h('label.document-seeder-text-label', 'Paper text'),
        h('textarea.document-seeder-text', {
          className: makeClassList({
            'document-seeder-hidden': this.state.reachHighlightEnabled
          }),
          onChange: e => this.setState({docText: e.target.value})
        }),
        h('div.document-seeder-highlight-panel', {
          className: makeClassList({
            'document-seeder-hidden': !this.state.reachHighlightEnabled
          })
        },[
          h(IntervalHighlighter, { text: this.state.reachHighlightInput, intervals: this.state.reachHighlightIntervals })
        ]),
        h('div.document-seeder-buttons', [
          h('button.document-seeder-toggle-highlight', {
            onClick: () => {
              this.toggleReachHighlights();
            }
          }, `${this.state.reachHighlightEnabled ? 'Edit Text' : 'Highlight Entities and Interactions'}`),
          h(DocumentWizardStepper, {
            forwardText: 'Submit',
            forwardIcon: '',
            backEnabled: false,
            forward: () => {
              let create = () => this.createDoc();
              let go = () => this.goToChooser();

              return Promise.try( create ).then( go );
            }
          })
        ])
      ]),
      h('div.document-stepper-app-bar', [
        h('div.document-stepper-app-buttons', [
          h(Tooltip, { description: 'Home' }, [
            h('button.editor-button.plain-button', { onClick: () => history.push('/') }, [
              h('i.app-icon')
            ])
          ]),
          h(Popover, {
            tippy: {
              position: 'right',
              followCursor: false,
              html: h(AppNav, [
                h('button.editor-more-button.plain-button', {
                  onClick: () => history.push('/new')
                }, [
                  h('span', ' New factoid')
                ]),
                h('button.editor-more-button.plain-button', {
                  onClick: () => history.push('/documents')
                }, [
                  h('span', ' My factoids')
                ]),
                h('button.editor-more-button.plain-button', {
                  onClick: () => history.push('/')
                }, [
                  h('span', ' About & contact')
                ])
              ])
            }
            }, [
            h('button.editor-button.plain-button', [
              h('i.material-icons', 'more_vert')
            ])
          ])
        ])
      ])

    ]);
  }
}

module.exports = DocumentSeeder;
