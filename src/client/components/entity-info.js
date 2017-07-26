const React = require('react');
const h = require('react-hyperscript');
const ReactDom = require('react-dom');
const { delay } = require('../../util');
const _ = require('lodash');
const defs = require('../defs');
const anime = require('animejs');
const queryString = require('query-string');
const Promise = require('bluebird');
const OrganismToggle = require('./organism-toggle');
const Organism = require('../../model/organism');
const Tooltip = require('./tooltip');

let associationCache = new WeakMap();

class EntityInfo extends React.Component {
  constructor( props ){
    super( props );

    let el = props.element;
    let cache = associationCache.get( el );

    if( cache == null ){
      cache = { matches: [], offset: 0 };

      associationCache.set( el, cache );
    }

    this.debouncedRename = _.debounce( name => {
      el.rename( name );

      this.updateMatches( name );
    }, defs.updateDelay );

    this.state = {
      element: el,
      name: el.name(),
      oldName: el.name(),
      matches: cache.matches,
      limit: defs.associationSearchLimit,
      offset: cache.offset
    };
  }

  focusNameInput(){
    if( this._unmounted ){ return; }

    let root = ReactDom.findDOMNode( this );
    let input = root.querySelector('.entity-info-name-input');

    if( input != null ){
      input.focus();
    }
  }

  componentDidMount(){
    let root = ReactDom.findDOMNode( this );
    let input = root.querySelector('.entity-info-name-input');
    let p = this.props;
    let s = this.state;
    let doc = p.document;

    if( input != null ){
      delay(0).then( () => this.focusNameInput() );
    }

    this.onRemoteRename = () => {
      this.setState({ name: this.state.element.name() });

      if( this.remRenameAni ){
        this.remRenameAni.pause();
      }

      this.remRenameAni = anime({
        targets: input,
        backgroundColor: [defs.editAnimationWhite, defs.editAnimationColor, defs.editAnimationWhite],
        duration: defs.editAnimationDuration,
        easing: defs.editAnimationEasing
      });
    };

    s.element.on('remoterename', this.onRemoteRename);

    this.onToggleOrganism = () => {
      associationCache = new WeakMap(); // all entities invalidated

      this.updateMatches( this.state.name, s.offset, true );
    };

    doc.on('toggleorganism', this.onToggleOrganism);

    this.onReplaceEle = ( oldEle, newEle ) => {
      if( oldEle.id() === this.state.element.id() ){
        oldEle.removeListener('remoterename', this.onRemoteRename);
        newEle.on('remoterename', this.onRemoteRename);

        this.setState({ element: newEle });
      }
    };

    doc.on('replace', this.onReplaceEle);

    if( s.matches.length === 0 && s.name != null && s.name != '' ){
      this.updateMatches();
    }
  }

  componentWillUnmount(){
    let { document, element } = this.props;
    let update = this.state.updatePromise;

    element.removeListener('remoterename', this.onRemoteRename);

    document.removeListener('toggleorganism', this.onToggleOrganism);

    document.removeListener('replace', this.onReplaceEle);

    if( update ){ update.cancel(); }

    this._unmounted = true;
  }

  rename( name ){
    let p = this.props;
    let s = this.state;
    let el = s.element;

    this.debouncedRename( name );

    p.bus.emit('renamedebounce', el, name);

    this.setState({
      name: name,
      updateDirty: true
    });
  }

  associate( match ){
    let s = this.state;
    let el = s.element;

    el.associate( match );

    // this indicates to render the match immediately though the data on the server may not be updated yet
    this.setState({
      match: match,
      name: match.name
    });
  }

  unassociate(){
    let s = this.state;
    let el = s.element;

    el.unassociate();

    this.setState({
      name: '',
      matches: [],
      match: null
    });

    delay(0).then( () => this.focusNameInput() );
  }

  updateMatches( name = this.state.name, offset = this.state.offset, changedOrganisms = false ){
    let s = this.state;
    let p = this.props;
    let el = s.element;
    let doc = p.document;
    let qOrgs = doc.organisms().map( org => org.id() ).join(',');

    let isNewName = name != s.oldName;
    let clearOldMatchesAfterSearch = isNewName || changedOrganisms;

    if( this._unmounted ){ return Promise.resolve(); }

    if( clearOldMatchesAfterSearch ){
      offset = 0;
    }

    let q = {
      name: name,
      limit: s.limit,
      offset: offset,
      organism: qOrgs
    };

    if( s.updatePromise ){
      s.updatePromise.cancel();
    }

    let update;

    let orgIsDefinedForMatch = m => {
      let org = Organism.fromId( m.organism );

      if( org !== Organism.OTHER ){
        return true;
      } else {
        return false;
      }
    };

    if( name ){
      update = (
        Promise.try( () => fetch( '/api/element-association/search?' + queryString.stringify(q) ) )
        .then( res => res.json() )
        .then( matches => matches.filter( orgIsDefinedForMatch ) )
        .then( matches => {
          if( this._unmounted ){ return; }

          if( clearOldMatchesAfterSearch ){
            s.matches = matches;
          } else {
            matches.forEach( m => s.matches.push(m) );
          }

          // cache the matches in the element for re-creation of component
          associationCache.set( el, {
            matches: s.matches,
            offset: offset
          } );

          this.setState({
            matches: s.matches,
            replacingMatches: false,
            loadingMatches: false,
            updatePromise: null,
            updateDirty: false
          }, () => {
            if( clearOldMatchesAfterSearch ){
              let root = ReactDom.findDOMNode(this);
              let matches = root != null ? root.querySelector('.entity-info-matches') : null;

              if( matches != null ){
                matches.scrollTop = 0;
              }
            }
          });
        } )
      );
    } else {
      update = Promise.resolve();

      associationCache.set( el, { matches: [], offset: 0 } );

      this.setState({
        updateDirty: false
      });
    }

    this.setState({
      loadingMatches: name ? true : false,
      oldName: name,
      updatePromise: update,
      offset: offset,
      matches: name ? s.matches : [],
      replacingMatches: clearOldMatchesAfterSearch
    });

    return update;
  }

  getMoreMatches( numMore = this.state.limit ){
    let s = this.state;

    if( !s.name || s.gettingMoreMatches || this._unmounted ){ return Promise.resolve(); }

    let offset = s.offset + numMore;

    this.setState({
      gettingMoreMatches: true
    });

    return this.updateMatches( s.name, offset ).then( () => {
      this.setState({
        gettingMoreMatches: false
      });
    } );
  }

  clear(){
    this.rename('');

    this.setState({ matches: [] });
  }

  render(){
    let s = this.state;
    let p = this.props;
    let el = s.element;
    let doc = p.document;
    let children = [];

    let Loader = ({ loading }) => h('div.entity-info-matches-loading' + (loading ? '.entity-info-matches-loading-active' : ''), [
      loading ? h('i.icon.icon-spinner') : h('i.material-icons', 'brightness_1')
    ]);

    if( !el.associated() && doc.editable() ){

      if( s.loadingMatches ){
        children.push( h('span.input-icon', [
          h('i.icon.icon-spinner')
        ]) );
      } else {
        children.push( h('i.input-icon.material-icons', 'search') );
      }

      children.push( h('input.input-round.input-joined.entity-info-name-input', {
        type: 'text',
        placeholder: 'Entity name',
        value: s.name,
        spellCheck: false,
        onChange: evt => this.rename( evt.target.value ),
        onKeyDown: evt => {
          if( evt.keyCode === 27 ){ // esc
            evt.target.blur();
          }
        }
      }) );

      children.push( h('button', {
        onClick: () => {
          this.clear();
          this.focusNameInput();
        }
      }, [
        h('i.material-icons', 'close')
      ]) );

      children.push( h('div.entity-info-organism-toggles', Organism.ALL.map( organism => {
        let onToggle = () => doc.toggleOrganism( organism );
        let getState = () => doc.organisms().find( o => o.id() === organism.id() ) != null;

        return h(OrganismToggle, { organism, onToggle, getState });
      } )) );
    }

    let onScroll = _.debounce( div => {
      let scrollMax = div.scrollHeight;
      let scroll = div.scrollTop + div.clientHeight;

      if( scroll >= scrollMax ){
        this.getMoreMatches();
      }
    }, defs.updateDelay / 2 );

    let assoc;

    if( s.match != null ){
      assoc = s.match;
    } else if( el.associated() ){
      assoc = el.association();
    } else {
      assoc = null;
    }

    let proteinFromAssoc = m => {
      return [
        h('div.entity-info-name', m.name),
        h('div.entity-info-organism-section', [
          h('span.entity-info-organism-name-title', 'Organism'),
          h('span.entity-info-organism-name', Organism.fromId(m.organism).name())
        ]),
        h('div.entity-info-protein-names', !m.proteinNames ? [] : [
          h('span.entity-info-protein-names-title', 'Protein names'),
          ...m.proteinNames.map( name => h('span.entity-info-protein-name', name))
        ]),
        h('div.entity-info-gene-names', !m.geneNames ? [] : [
          h('span.entity-info-gene-names-title', 'Gene names'),
          ...m.geneNames.map( name => h('span.entity-info-gene-name', name))
        ])
      ];
    };

    let linkFromAssoc = m => {
      return h('div.entity-info-match-link', [
        h('a.plain-link', { href: m.url, target: '_blank' }, [
          'More information ',
          h('i.material-icons', 'open_in_new')
        ])
      ]);
    };

    let targetFromAssoc = proteinFromAssoc;

    let allAssoc = m => proteinFromAssoc(m).concat( linkFromAssoc(m) ); // that's all our service (uniprot) supports

    if( assoc != null ){
      children.push( h(Tooltip, { description: 'Respecify via search', tippy: { position: 'left' } }, [
        h('button.plain-button.entity-info-unassoc', {
          onClick: () => this.unassociate()
        }, [
          h('i.material-icons', 'youtube_searched_for')
        ])
      ]) );

      children.push( h('div.entity-info-assoc', allAssoc( assoc )) );

      children.push( h('label.entity-info-mod-label', { htmlFor: 'entity-info-mod-select-' + el.id() }, 'Modification') );

      children.push( h('select.entity-info-mod-select', {
        id: 'entity-info-mod-select-' + el.id(),
        defaultValue: el.modification().value,
        onChange: (evt) => el.modify( evt.target.value )
      }, el.ORDERED_MODIFICATIONS.map( mod => {
        return h('option', {
          value: mod.value
        }, mod.displayValue);
      } )) );
    } else if( !doc.editable() ){
      children.push( h('div.entity-info-no-assoc', [
        h('div.element-info-message', [
          h('i.material-icons', 'info'),
          h('span', ' This entity has no data associated with it.')
        ])
      ]) );
    } else if( s.matches.length > 0 ){
      children.push( h('div.entity-info-matches', {
        className: s.replacingMatches ? 'entity-info-matches-replacing' : '',
        onScroll: evt => {
          onScroll( evt.target );

          evt.stopPropagation();
        }
      }, [ ...s.matches.map( m => {
        return h('div.entity-info-match', [
          h('div.entity-info-match-target', {
            onClick: () => this.associate( m )
          }, targetFromAssoc( m )),
          linkFromAssoc( m )
        ]);
      }),
      h(Loader, { loading: s.gettingMoreMatches })
      ] ) );
    } else if( !s.loadingMatches && s.name && !s.updateDirty ){
      children.push( h('div.entity-info-match-empty', [
        h('i.material-icons', 'not_interested'),
        ' No entities were found'
      ]) );
    }

    return h('div.entity-info', children);
  }
}

module.exports = EntityInfo;
