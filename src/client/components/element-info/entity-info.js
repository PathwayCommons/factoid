import DataComponent from '../data-component';
import h from 'react-hyperscript';
import ReactDom from 'react-dom';
import _ from 'lodash';
import * as defs from '../../defs';
import Heap from 'heap';
import Highlighter from '../highlighter';
import Notification from '../notification';
import assocDisp from './entity-assoc-display';
import CancelablePromise from 'p-cancelable';
import { isComplex, isGGP, ELEMENT_TYPE } from '../../../model/element/element-type';
import RelatedPapers from '../related-papers';
import Organism from '../../../model/organism';

import { makeClassList, focusDomElement } from '../../dom';

import {
  initCache, SingleValueCache,
  makeCancelable, stringDistanceMetric
} from '../../../util';

const MAX_FIXED_SYNONYMS = 5;
const MAX_SYNONYMS_SHOWN = 10;

let associationCache = new WeakMap();
let chosenTypeCache = new WeakMap();
let nameNotificationCache = new SingleValueCache();
let assocNotificationCache = new SingleValueCache();

const isSameGrounding = (g1, g2) => g1.namespace === g2.namespace && g1.id === g2.id;

class EntityInfo extends DataComponent {
  constructor( props ){
    super( props );

    let el = props.element;

    let assoc = initCache( associationCache, el, { matches: [], offset: 0 } );

    let nameNotification = initCache( nameNotificationCache, el, new Notification({ active: true }) );

    let assocNotification = initCache( assocNotificationCache, el, new Notification({ active: true }) );

    let chosenType = initCache( chosenTypeCache, el, null );

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
      chosenType,
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

    let associate = matches => {
      if( matches && matches.length > 0 ){
        this.associate(matches[0]);
      } else {
        this.unassociate();
      }
    };

    if( isComplex(el.type()) ){
      associate = _.nop;
    } else {
      this.debouncedUpdateMatches( name, associate );
    }

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

    if( s.chosenType && match.type !== 'chemical' ){
      match = Object.assign({}, match, {
        type: s.chosenType
      });

      delete match.typeOfGene; // n.b. the model overrides via this field
    }

    el.associate( match );
    el.complete();

    // this indicates to render the match immediately though the data on the server may not be updated yet
    this.setData({
      match: match,
    });
  }

  unassociate(){
    let s = this.data;
    let el = s.element;

    el.unassociate();
    el.uncomplete();

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
      organismCounts: doc.organismCountsJson(el) // exclude el from org count (avoids mid typing biases)
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

    let targetFromAssoc = (m, complete = false, showRefinement = false) => {
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

      if( m.organism != null ){
        nameChildren.push(
          h('span', ' ('),
          Organism.fromId(m.organism).name(),
          h('span', ')')
        );
      }

      let pre = [
        h('div.entity-info-name', nameChildren.filter( domEl => domEl != null ))
      ];

      let refineEditableGgp = doc.editable() && complete && showRefinement && isGGP(m.type);

      let subtype = null;

      if( refineEditableGgp ){
        let radios = [];

        let addType = (typeVal, displayName) => {
          radios.push(
            h('input', {
              type: 'radio',
              name: 'entity-info-subtype-radio',
              id: `entity-info-subtype-radio-${typeVal}`,
              value: typeVal,
              checked: typeVal === m.type,
              onChange: e => {
                let newlySelectedType = e.target.value;
                let newMatch = Object.assign({}, m, { type: newlySelectedType });

                this.setData({ chosenType: newlySelectedType });

                chosenTypeCache.set(s.element, newlySelectedType);

                this.associate(newMatch);
              }
            }),
            h('label', {
              htmlFor: `entity-info-subtype-radio-${typeVal}`
            }, displayName)
          );
        };

        addType(ELEMENT_TYPE.GGP, 'Gene or gene product');
        addType(ELEMENT_TYPE.DNA, 'DNA');
        addType(ELEMENT_TYPE.RNA, 'RNA');
        addType(ELEMENT_TYPE.PROTEIN, 'Protein');

        let radioParent = h('div.radioset', radios);

        subtype = h('div.entity-info-subtype.entity-info-section', [
          h('span.entity-info-title', 'Type'),
          radioParent
        ]);
      }

      let organism = null;
      let disambiguation = null;

      if( refineEditableGgp ){
        let isPerfectNameMatch = m => m.distance === 0;
        let isChemicalMatch = m => m.type == 'chemical';
        let isOrgMatch = m => isPerfectNameMatch(m) && !isChemicalMatch(m);
        let orgMatches = s.matches.filter(isOrgMatch);
        let orgToMatches = new Map();
        let orgDropDownMatches = [];

        orgMatches.forEach(om => {
          let org = om.organism;
          let arr;

          if( orgToMatches.has(org) ){
            arr = orgToMatches.get(org);
          } else {
            arr = [];
            orgToMatches.set(org, arr);
          }

          arr.push(om);
        });

        const orgIds = Array.from(orgToMatches.keys());
        const selectedOrg = assoc ? assoc.organism : null;

        orgIds.forEach(orgId => {
          const oms = orgToMatches.get(orgId);
          let om = oms[0]; // first by default

          // use the selected grounding as the top-level org dropdown id, if possible
          oms.forEach(omi => {
            if( assoc && isSameGrounding(omi, assoc) ){
              om = omi;
            }
          });

          orgDropDownMatches.push(om);
        });

        orgDropDownMatches = _.sortBy(orgDropDownMatches, m => m.organismName);

        const getSelectDisplay = (om, includeName = false) => {
          // const matches = orgToMatches.get(om.organism) || [];
          // let count = matches.length;

          if( includeName ){
            return `${om.organismName} (${om.name})`;
          } else {
            return `${om.organismName}`;
          }
        };

        const getDisamtDisplay = (om) => {
          const sortedSyns = _.sortBy(om.synonyms, syn => stringDistanceMetric(syn, s.name));

          return `${om.name} : ` + sortedSyns.slice(0, 3).join(', ');
        };

        if( orgMatches.length > 1 ){
          organism = h('div.entity-info-section.entity-info-organism-refinement', [
            h('span.entity-info-title', 'Organism'),
            h('select.entity-info-organism-dropdown', {
              value: `${m.namespace}:${m.id}`,
              onChange: e => {
                const val = e.target.value;
                const [ns, id] = val.split(':');
                const om = s.matches.find(match => match.namespace === ns && match.id === id);

                if( om ){
                  this.associate(om);
                } else {
                  this.enableManualMatchMode();
                }
              }
            }, orgDropDownMatches.map((om) => {
              const value = `${om.namespace}:${om.id}`;

              return h('option', { value }, getSelectDisplay(om));
            }).concat([
              // selectedIndex < 0 ? h('option', { value: -1 }, getSelectDisplay(m, true)) : null,
              h('option', { value: -2 }, 'Other')
            ]))
          ]);
        } else {
          organism = null;
        }

        if( assoc && selectedOrg ){
          const ambigGrs = orgToMatches.get(selectedOrg);
          const needDisam = ambigGrs && ambigGrs.length > 1;

          if( needDisam ){
            disambiguation = h('div.entity-info-section.entity-info-organism-refinement', [
              h('span.entity-info-title', 'Which' + (s.name ? ` ${s.name}` : '') + ''),
              h('select.entity-info-organism-dropdown', {
                value: `${m.namespace}:${m.id}`,
                onChange: e => {
                  const val = e.target.value;
                  const [ns, id] = val.split(':');
                  const om = s.matches.find(om => om.namespace === ns && om.id === id);
    
                  if( om ){
                    this.associate(om);
                  } else {
                    this.enableManualMatchMode();
                  }
                }
              }, ambigGrs.map((om) => {
                const value = `${om.namespace}:${om.id}`;
    
                return h('option', { value }, getDisamtDisplay(om));
              }).concat([
                // selectedIndex < 0 ? h('option', { value: -1 }, getSelectDisplay(m, true)) : null,
                h('option', { value: 'other:other' }, 'Other')
              ]))
            ]);
          }
        }
      }

      let body = assocDisp[ m.type ]( m, searchTerms, false );

      let post = [];

      return _.concat( pre, subtype, organism, disambiguation, body, post );
    };

    let allAssoc = (m, complete = false, showRefinement = false) => _.concat(
      targetFromAssoc(m, complete, showRefinement),
      assocDisp.link(m)
    );

    if( !doc.editable() ){
      if( assoc == null ){
        const type = s.element.type();
        const name = s.name;
        const entityNames = s.element.participants().map(ppt => ppt.name());

        if( isComplex(s.element.type()) ){
          children.push( h('div.entity-info-assoc', targetFromAssoc({ type, name, entityNames }, true )) );
        } else {
          children.push( h('div.entity-info-no-assoc', [
            h('div.element-info-message.element-info-no-data', [
              h('i.material-icons', 'info'),
              h('span', ' This entity has no data associated with it.')
            ])
          ]) );
        }
      } else {
        children.push( h('div.entity-info-assoc', allAssoc( assoc, true, false )) );

        children.push( h('div.entity-info-reld-papers-title', `Recommended articles`) );
        
        children.push( h('div.entity-info-related-papers', [
          h(RelatedPapers, { document, source: s.element })
        ]) );
      }
    } else {
      let placeholder;

      if( isComplex(s.element.type()) ){
        placeholder = 'Name of complex';
      } else {
        placeholder = 'Name of gene or chemical (e.g. p53)';
      }

      children.push(
        h('div.entity-info-name-input-area', [
          h('input.input-round.entity-info-name-input', {
            type: 'text',
            placeholder,
            value: s.element.named() ? s.name : '',
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
          })
        ])
      );

      if( s.name && isComplex(s.element.type()) ){
        let type = s.element.type();
        let name = s.name;
        let entityNames = s.element.participants().map(ppt => ppt.name());

        children.push( h('div.entity-info-assoc', targetFromAssoc({ type, name, entityNames }, true )) );
      } else if( s.name && (s.loadingMatches || s.updateDirty) && !s.manualAssocMode ){
        children.push(
          h(Loader)
        );
      } else if( s.matches.length > 0 && s.manualAssocMode ){
        children.push( h('div.entity-info-matches-instructions', [
          h('p', `Select a better match for "${s.name}"`)
        ]) );

        children.push( h('div.entity-info-matches', {
          className: s.replacingMatches ? 'entity-info-matches-replacing' : '',
          onScroll: evt => {
            onMatchesScroll( evt.target );

            evt.stopPropagation();
          }
        }, [
          ...s.matches.map( m => {
            const isCurrentMatch = m.namespace == assoc.namespace && m.id == assoc.id;

            return h('div.entity-info-match', [
              h('div.entity-info-match-target', {
                className: makeClassList({
                  'entity-info-match-target-selected': isCurrentMatch
                }),
                onClick: () => {
                  this.disableManualMatchMode();
                  this.associate( m );
                }
              }, targetFromAssoc( m, isCurrentMatch ).concat( isCurrentMatch ? h('span.entity-info-match-current-indicator', 'Selected') : null )),
              assocDisp.link( m )
            ]);
          }),

          h(Loader, { loading: s.gettingMoreMatches })
        ] ) );
      } else if( s.name && assoc ){
        children.push( h('div.entity-info-assoc.entity-info-assoc-refinement', allAssoc( assoc, true, true )) );

        children.push(
          h('div.entity-info-assoc-manual', [
            h('button.salient-button.entity-info-assoc-button', {
              onClick: () => this.enableManualMatchMode()
            }, [
              `Select a better match for "${s.name}"`
            ])
          ])
        );
      } else if( !s.loadingMatches && s.name && !s.updateDirty ){
        children.push( h('div.entity-info-match-empty', [
        `We couldn't find  "${s.name}".  Please try renaming "${s.name}" to a clearer, perhaps more standard name.`
        ] ) );
      }
    }

    return h('div.entity-info', children);
  }
}

export default props => h(EntityInfo, Object.assign({ key: props.element.id() }, props));
