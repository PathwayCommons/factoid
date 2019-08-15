import DataComponent from '../data-component';
import h from 'react-hyperscript';
import ReactDom from 'react-dom';
import { focusDomElement, makeClassList, initCache, SingleValueCache, makeCancelable } from '../../../util';
import _ from 'lodash';
import * as defs from '../../defs';
import Heap from 'heap';
import Highlighter from '../highlighter';
import Notification from '../notification';
import InlineNotification from '../notification/inline';
import Tooltip from '../popover/tooltip';
import assocDisp from './entity-assoc-display';
import CancelablePromise from 'p-cancelable';

import { stringDistanceMetric } from '../../../util';
import { animateDomForEdit } from '../animate';

const MAX_FIXED_SYNONYMS = 5;
const MAX_SYNONYMS_SHOWN = 10;

let associationCache = new WeakMap();
let nameNotificationCache = new SingleValueCache();
let assocNotificationCache = new SingleValueCache();

class EntityInfo extends DataComponent {
  constructor( props ){
    super( props );

    let el = props.element;

    let assoc = initCache( associationCache, el, { matches: [], offset: 0 } );

    let nameNotification = initCache( nameNotificationCache, el, new Notification({ active: true }) );

    let assocNotification = initCache( assocNotificationCache, el, new Notification({ active: true }) );

    this.debouncedUpdateMatches = _.debounce( (name, postStep = _.nop) => {
      this.updateMatches(name).then(postStep);
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
      nameNotification,
      assocNotification
    };
  }

  focusNameInput(){
    this.debouncedFocusNameInput();
  }

  componentDidMount(){
    let s = this.data;

    this.onRename = () => {
      this.setData({ name: this.data.element.name() });
    };

    s.element.on('rename', this.onRename);

    this.focusNameInput();

    if( s.matches.length === 0 && s.name != null && s.name != '' ){
      this.updateMatches();
    }
  }

  componentWillUnmount(){
    let { element } = this.props;
    let update = this.data.updatePromise;

    element.removeListener('rename', this.onRename);

    if( update ){ update.cancel(); }

    this._unmounted = true;
  }

  rename( name ){
    let s = this.data;
    let el = s.element;

    el.rename( name );

    const associate = matches => {
      console.log('associate on rename', matches);

      if( matches && matches.length > 0 ){
        this.associate(matches[0]);
      } else {
        this.unassociate();
      }
    };

    this.debouncedUpdateMatches( name, associate );

    this.setData({
      name: name,
      updateDirty: true
    });
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
      match: match,
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
      let makeRequest = () => makeCancelable(fetch( '/api/element-association/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(q)
      } ));

      let jsonify = res => makeCancelable(res.json());

      let updateView = matches => {
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

        return matches;
      };

      update = makeCancelable(
        Promise.resolve()
        .then(makeRequest)
        .then(jsonify)
        .then(updateView)
      );
    } else {
      update = new CancelablePromise(resolve => resolve());

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

  enableManualMatchMode(){
    this.setData({
      manualAssocMode: true
    });
  }

  disableManualMatchMode(){
    this.setData({
      manualAssocMode: false
    });
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


    let assoc;

    if( s.match != null ){
      assoc = s.match;
    } else if( s.element.associated() ){
      assoc = s.element.association();
    } else {
      assoc = null;
    }

    let targetFromAssoc = (m, complete) => {
      let highlight = !complete;
      let searchStr = highlight ? s.name : null;
      let searchTerms = searchStr ? searchStr.split(/\s+/) : [];

      let nameChildren = [];

      let matchName = () => h(Highlighter, { key: m.id, text: m.name, terms: searchTerms });

      if( complete ){
        nameChildren.push( h('span', s.name) );
      } else {
        nameChildren.push( matchName() );
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

    let allAssoc = (m, complete = false) => _.concat(
      targetFromAssoc(m, complete),
      assocDisp.link(m)
    );

    if( !doc.editable() ){
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
    } else {
      let NameNotification = () => {
        let notification = s.nameNotification;

        return h(InlineNotification, { notification, key: notification.id(), className: 'entity-info-notification' });
      };

      // children.push( h(NameNotification) );

      children.push(
        h('div.entity-info-name-input-area', [
          h('input.input-round.input-joined.entity-info-name-input', {
            type: 'text',
            placeholder: 'Entity name',
            value: s.name,
            spellCheck: false,
            onChange: evt => this.rename( evt.target.value ),
            onKeyDown: evt => {
              switch( evt.keyCode ){
                case 27: // ESC
                  evt.target.blur();
                  break;
                case 13: // ENTER
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

      if( s.name && (s.loadingMatches || s.updateDirty) && !s.manualAssocMode ){
        children.push(
          h(Loader)
        );
      } else if( s.matches.length > 0 && s.manualAssocMode ){
        children.push( h('div.entity-info-matches', {
          className: s.replacingMatches ? 'entity-info-matches-replacing' : '',
          onScroll: evt => {
            onMatchesScroll( evt.target );

            evt.stopPropagation();
          }
        }, [
          // h(AssocMsg),

          ...s.matches.map( m => {
            return h('div.entity-info-match', [
              h('div.entity-info-match-target', {
                onClick: () => {
                  this.disableManualMatchMode();
                  this.associate( m );
                }
              }, targetFromAssoc( m )),
              assocDisp.link( m )
            ]);
          }),

          h(Loader, { loading: s.gettingMoreMatches })
        ] ) );
      } else if( s.name && assoc ){
        children.push( h('div.entity-info-assoc', allAssoc( assoc, true )) );

        children.push(
          h('div.entity-info-assoc-manual', [
            h('button.entity-info-assoc-button', {
              onClick: () => this.enableManualMatchMode()
            }, [
              `Select a better match for "${s.name}"`
            ])
          ])
        );
      } else if( !s.loadingMatches && s.name && !s.updateDirty ){
        children.push( h('div.entity-info-match-empty', [
        `We aren't able to disambiguate  "${s.name}".  Please try renaming "${s.name}" to a clearer, perhaps more standard name.`
        ] ) );
      }
    }

    return h('div.entity-info', children);
  }
}

export default props => h(EntityInfo, Object.assign({ key: props.element.id() }, props));
