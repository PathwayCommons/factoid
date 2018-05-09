const DataComponent = require('../data-component');
const h = require('react-hyperscript');
const ReactDom = require('react-dom');
const { focusDomElement, makeClassList, initCache, SingleValueCache } = require('../../../util');
const _ = require('lodash');
const defs = require('../../defs');
const Promise = require('bluebird');
const Heap = require('heap');
const Highlighter = require('../highlighter');
const Notification = require('../notification');
const InlineNotification = require('../notification/inline');
const Tooltip = require('../popover/tooltip');
const assocDisp = require('./entity-assoc-display');
const Progression = require('./progression');
const ProgressionStepper = require('./progression-stepper');

const { stringDistanceMetric } = require('../../../util');
const { animateDomForEdit } = require('../animate');

const MAX_FIXED_SYNONYMS = 5;
const MAX_SYNONYMS_SHOWN = 10;

let associationCache = new WeakMap();
let stageCache = new WeakMap();
let nameNotificationCache = new SingleValueCache();
let assocNotificationCache = new SingleValueCache();

class EntityInfo extends DataComponent {
  constructor( props ){
    super( props );

    let el = props.element;

    let assoc = initCache( associationCache, el, { matches: [], offset: 0 } );

    let progression = new Progression({
      STAGES: [ 'NAME', 'ASSOCIATE', 'COMPLETED' ],
      getStage: () => this.getStage(),
      canGoToStage: stage => this.canGoToStage(stage),
      goToStage: stage => this.goToStage(stage)
    });

    let { STAGES, ORDERED_STAGES } = progression;

    let stage = initCache( stageCache, el, el.completed() ? STAGES.COMPLETED : ORDERED_STAGES[0] );

    let nameNotification = initCache( nameNotificationCache, el, new Notification({ active: true }) );

    let assocNotification = initCache( assocNotificationCache, el, new Notification({ active: true }) );

    this.debouncedRename = _.debounce( name => {
      this.data.element.rename( name );

      this.updateMatches( name );
    }, defs.updateDelay );

    this.debouncedUpdateMatches = _.debounce( name => {
      this.updateMatches( name );
    }, defs.updateDelay );

    this.debouncedFocusNameInput = _.debounce( () => {
      if( this._unmounted ){ return; }

      let root = ReactDom.findDOMNode( this );
      let input = root.querySelector('.entity-info-name-input');

      if( input != null ){
        focusDomElement( input );
      }
    }, 50 );

    this.data = {
      element: el,
      name: el.name(),
      oldName: el.name(),
      matches: assoc.matches,
      gettingMoreMatches: false,
      limit: defs.associationSearchLimit,
      offset: assoc.offset,
      stage,
      nameNotification,
      assocNotification,
      progression
    };
  }

  focusNameInput(){
    this.debouncedFocusNameInput();
  }

  componentDidMount(){
    let root = ReactDom.findDOMNode( this );
    let input = root.querySelector('.entity-info-name-input');
    let p = this.props;
    let s = this.data;
    let doc = p.document;
    let progression = s.progression;
    let { ORDERED_STAGES } = progression;

    if( s.stage === ORDERED_STAGES[0] ){
      progression.goToStage( s.stage );
    }

    this.onRemoteRename = () => {
      this.setData({ name: this.data.element.name() });

      if( this.remRenameAni ){
        this.remRenameAni.pause();
      }

      this.remRenameAni = animateDomForEdit( input );
    };

    s.element.on('remoterename', this.onRemoteRename);

    this.onToggleOrganism = () => {
      associationCache = new WeakMap(); // all entities invalidated

      this.updateMatches( this.data.name, s.offset, true );
    };

    doc.on('toggleorganism', this.onToggleOrganism);

    if( s.matches.length === 0 && s.name != null && s.name != '' ){
      this.updateMatches();
    }
  }

  componentWillUnmount(){
    let { document, element } = this.props;
    let update = this.data.updatePromise;

    element.removeListener('remoterename', this.onRemoteRename);

    document.removeListener('toggleorganism', this.onToggleOrganism);

    if( update ){ update.cancel(); }

    this._unmounted = true;
  }

  rename( name ){
    let s = this.data;
    let el = s.element;

    el.rename( name );

    this.updateMatches( name );

    this.setData({
      name: name,
      updateDirty: true
    });
  }

  updateCachedName( name ){
    this.setData({ name });

    this.debouncedUpdateMatches( name );
  }

  clear(){
    this.setData({
      name: '',
      matches: []
    });
  }

  associate( match ){
    let s = this.data;
    let el = s.element;

    el.associate( match );

    // this indicates to render the match immediately though the data on the server may not be updated yet
    this.setData({
      match: match
    });
  }

  unassociate(){
    let s = this.data;
    let el = s.element;

    el.unassociate();

    this.setData({
      matches: [],
      match: null
    }, () =>  this.focusNameInput());

    this.updateMatches();
  }

  updateMatches( name = this.data.name, offset = this.data.offset, changedOrganisms = false ){
    let s = this.data;
    let p = this.props;
    let el = s.element;
    let doc = p.document;

    let isNewName = name !== s.oldName;
    let clearOldMatches = isNewName || changedOrganisms;
    let needsUpdate = isNewName || changedOrganisms || offset != this.data.offset || s.matches.length === 0;

    if( !needsUpdate ){ return Promise.resolve(); }

    if( this._unmounted ){ return Promise.resolve(); }

    if( clearOldMatches ){
      offset = 0;

      this.setData({ matches: [] });
    }

    let q = {
      name: name,
      limit: s.limit,
      offset: offset,
      organismCounts: doc.organismCountsJson()
    };

    if( s.updatePromise ){
      s.updatePromise.cancel();
    }

    let update;

    if( name ){
      update = (
        Promise.try( () => fetch( '/api/element-association/search', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify(q)
        } ) )
        .then( res => res.json() )
        .then( matches => {
          if( this._unmounted ){ return; }

          let getShortSynonyms = (synonyms, cmpStr = name) => {
            if (synonyms.length <= MAX_SYNONYMS_SHOWN) {
              return synonyms;
            }

            // use a memoized distance function to avoid re-calculating the same distances inside nsmallest function
            let distance = _.memoize( s => {
              return stringDistanceMetric(s, cmpStr);
            } );

            let cmp = (s1, s2) => {
              return distance(s1) - distance(s2);
            };

            // fix the first constant number of synonyms
            let fixed = synonyms.slice(0, MAX_FIXED_SYNONYMS);
            // complete the short list by the best matches among the remaining synonyms
            let remainingBestMatch = Heap.nsmallest(synonyms.slice(MAX_FIXED_SYNONYMS), MAX_SYNONYMS_SHOWN - MAX_FIXED_SYNONYMS, cmp);

            return [...fixed, ...remainingBestMatch];
          };

          matches.forEach( (match) => {
            if (match.synonyms) {
              match.shortSynonyms = getShortSynonyms(match.synonyms);
            }
          } );

          if( clearOldMatches ){
            s.matches = matches;
          } else {
            matches.forEach( m => s.matches.push(m) );
          }

          // cache the matches in the element for re-creation of component
          associationCache.set( el, {
            matches: s.matches,
            offset: offset
          } );

          this.setData({
            matches: s.matches,
            replacingMatches: false,
            loadingMatches: false,
            updatePromise: null,
            updateDirty: false
          }, () => {
            if( clearOldMatches ){
              let root = ReactDom.findDOMNode(this);
              let matchesDom = root != null ? root.querySelector('.entity-info-matches') : null;

              if( matchesDom != null ){
                matchesDom.scrollTop = 0;
              }
            }
          });
        } )
      );
    } else {
      update = Promise.resolve();

      associationCache.set( el, { matches: [], offset: 0 } );

      this.setData({
        updateDirty: false
      });
    }

    this.setData({
      loadingMatches: name ? true : false,
      oldName: name,
      updatePromise: update,
      offset: offset,
      matches: name ? s.matches : [],
      replacingMatches: clearOldMatches
    });

    return update;
  }

  getMoreMatches( numMore = this.data.limit ){
    let s = this.data;

    if( !s.name || s.gettingMoreMatches || this._unmounted ){ return Promise.resolve(); }

    let offset = s.offset + numMore;

    this.setData({
      gettingMoreMatches: true
    });

    return this.updateMatches( s.name, offset ).then( () => {
      this.setData({
        gettingMoreMatches: false
      });
    } );
  }

  getStage(){
    return this.data.stage;
  }

  canGoToStage( stage ){
    let { element: el, stage: currentStage, name: cachedName } = this.data;
    let { STAGES } = this.data.progression;

    switch( stage ){
      case STAGES.NAME:
        return true;
      case STAGES.ASSOCIATE:
        return cachedName != null && cachedName != '';
      case STAGES.COMPLETED:
        return currentStage === STAGES.ASSOCIATE && el.associated();
    }
  }

  goToStage( stage ){
    let { stage: currentStage, name, element, progression } = this.data;
    let { STAGES } = progression;

    if(
      currentStage === STAGES.NAME && stage === STAGES.ASSOCIATE
      && name != null && name !== '' && name !== element.name()
    ){
      this.rename( name );
    }

    if( progression.canGoToStage(stage) ){
      this.setData({ stage, stageError: null });

      stageCache.set( this.data.element, stage );

      switch( stage ){
        case STAGES.NAME:
          if( this.data.name ){
            this.data.nameNotification.message(`Amend the name of "${this.data.name}", if necessary.`);
          } else {
            this.data.nameNotification.message(`Name the entity.`);
          }


          this.focusNameInput();
          break;

        case STAGES.ASSOCIATE:
          this.data.assocNotification.message(`Select the best match for "${this.data.name}".`);
          break;

        case STAGES.COMPLETED:
          this.complete();
          break;
      }
    } else {
      let stageError;

      switch( currentStage ){
        case STAGES.ASSOCIATE:
          stageError = `Link "${this.data.name}" with an identifier before proceeding.`;
          break;
        default:
          stageError = 'This step should be completed before proceeding.';
      }

      this.setData({ stageError });
    }
  }

  complete(){
    let { element: el } = this.data;

    return el.complete();
  }

  render(){
    let s = this.data;
    let p = this.props;
    let doc = p.document;
    let children = [];

    let Loader = ({ loading = true }) => h('div.entity-info-matches-loading' + (loading ? '.entity-info-matches-loading-active' : ''), [
      loading ? h('i.icon.icon-spinner') : h('i.material-icons', 'remove')
    ]);

    let onMatchesScroll = _.debounce( div => {
      let scrollMax = div.scrollHeight;
      let scroll = div.scrollTop + div.clientHeight;

      if( scroll >= scrollMax ){
        this.getMoreMatches();
      }
    }, defs.updateDelay / 2 );

    let { progression } = this.data;
    let { STAGES, ORDERED_STAGES } = progression;
    let stage = progression.getStage();

    let assoc;

    if( s.match != null ){
      assoc = s.match;
    } else if( s.element.associated() ){
      assoc = s.element.association();
    } else {
      assoc = null;
    }

    let targetFromAssoc = (m) => {
      let complete = stage === STAGES.COMPLETED;
      let highlight = !complete;
      let searchStr = highlight ? s.name : null;
      let searchTerms = searchStr ? searchStr.split(/\s+/) : [];
      let showEditIcon = complete && doc.editable();

      let nameChildren = [];

      let matchName = () => h(Highlighter, { key: m.id, text: m.name, terms: searchTerms });

      if( complete ){
        nameChildren.push( h('span', s.name) );
      } else {
        nameChildren.push( matchName() );
      }

      if( showEditIcon ){
        nameChildren.push( h(Tooltip, { description: 'Edit from the beginning' }, [
          h('button.entity-info-edit.plain-button', {
            onClick: () => progression.goToStage( ORDERED_STAGES[0] )
          }, [ h('i.material-icons', 'edit') ])
        ]) );
      }

      if( complete && m.name.toLowerCase() !== s.name.toLowerCase() ){
        nameChildren.push(
          h('br'),
          h('span', '('),
          matchName(),
          h('span', ')')
        );
      }

      let pre = [
        h('div.entity-info-name', nameChildren.filter( domEl => domEl != null ))
      ];

      let body = assocDisp[ m.type ]( m, searchTerms );

      let post = [];

      return _.concat( pre, body, post );
    };

    let allAssoc = m => _.concat(
      targetFromAssoc(m),
      assocDisp.link(m)
    );

    if( !doc.editable() || stage === STAGES.COMPLETED ){
      if( assoc == null ){
        children.push( h('div.entity-info-no-assoc', [
          h('div.element-info-message.element-info-no-data', [
            h('i.material-icons', 'info'),
            h('span', ' This entity has no data associated with it.')
          ])
        ]) );
      } else {
        children.push( h('div.entity-info-assoc', allAssoc( assoc )) );
      }
    } else if( stage === STAGES.NAME ){
      let NameNotification = () => {
        let notification = s.nameNotification;

        return h(InlineNotification, { notification, key: notification.id(), className: 'entity-info-notification' });
      };

      children.push( h(NameNotification) );

      children.push(
        h('div.entity-info-name-input-area', [
          h('input.input-round.input-joined.entity-info-name-input', {
            type: 'text',
            placeholder: 'Entity name',
            value: s.name,
            spellCheck: false,
            onChange: evt => this.updateCachedName( evt.target.value ),
            onKeyDown: evt => {
              switch( evt.keyCode ){
                case 27: // ESC
                  evt.target.blur();
                  break;
                case 13: // ENTER
                  progression.forward();
                  break;
              }
            }
          }),

          h('button', {
            className: makeClassList({
              'entity-info-name-clear': true,
              'entity-info-name-clear-disabled': !s.name
            }),
            onClick: () => {
              this.clear();
              this.focusNameInput();
            }
          }, [
            h('i.material-icons', 'close')
          ])
        ])
      );
    } else if( stage === STAGES.ASSOCIATE ){
      let AssocMsg = () => {
        let notification = s.assocNotification;

        return h(InlineNotification, { notification, key: notification.id(), className: 'entity-info-notification' });
      };

      if( s.matches.length > 0 ){
        children.push( h('div.entity-info-matches', {
          className: s.replacingMatches ? 'entity-info-matches-replacing' : '',
          onScroll: evt => {
            onMatchesScroll( evt.target );

            evt.stopPropagation();
          }
        }, [
          h(AssocMsg),

          ...s.matches.map( m => {
            return h('div.entity-info-match', [
              h('div.entity-info-match-target', {
                onClick: () => {
                  this.associate( m );
                  progression.forward();
                }
              }, targetFromAssoc( m )),
              assocDisp.link( m )
            ]);
          }),

          h(Loader, { loading: s.gettingMoreMatches })
        ] ) );
      } else if( !s.loadingMatches && s.name && !s.updateDirty ){
        children.push( h(AssocMsg) );

        children.push( h('div.entity-info-match-empty', [
        ` No identifiers could be found.  Try going back and renaming "${s.name}" to a clearer name.`
        ] ) );
      } else {
        children.push(
          h(AssocMsg),
          h(Loader)
        );
      }
    }

    if( doc.editable() ){
      children.push( h(ProgressionStepper, { progression, key: s.element.id() }) );
    }

    return h('div.entity-info', children);
  }
}

module.exports = props => h(EntityInfo, Object.assign({ key: props.element.id() }, props));
