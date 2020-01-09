import _ from 'lodash';
import * as defs from './defs';
import onKey from './on-key';
import { isInteractionNode, makeCyEles, cyUpdateParent, tryPromise } from '../../../../util';

function listenToDoc({ bus, cy, document, controller }){
  let complexWaitMap = new Map();

  let waitComplex = (complexId, handler) => {
    if ( !complexWaitMap.has( complexId ) ) {
      complexWaitMap.set( complexId, [] );
    }

    complexWaitMap.get( complexId ).push( handler );
  };

  let handleComplexWaiters = complexId => {
    if ( complexWaitMap.has( complexId ) ) {
      let handlers = complexWaitMap.get( complexId );
      complexWaitMap.delete( complexId );
      handlers.forEach( handler => handler() );
    }
  };

  let getCyEl = function( docEl ){
    return cy.getElementById( docEl.id() );
  };

  let getDocEl = function( el ){
    return document.get( el.id() );
  };

  let onDoc = function( docEl, handler ){
    let el = getCyEl( docEl );

    handler( docEl, el );
  };

  let onCy = function( el, handler ){ // eslint-disable-line no-unused-vars
    let docEl = getDocEl( el );

    handler( docEl, el );
  };

  let onDocElUpdateParent = function( newParentId, oldParentId ) {
    let handler = () => cyUpdateParent( cy, this, newParentId, oldParentId );
    if ( newParentId == null || ( document.has( newParentId ) && cy.getElementById( newParentId ).length != 0 ) ) {
      handler();
    }
    else {
      waitComplex( newParentId, handler );
    }
  };

  let applyEditAnimationAsOverlay = function( el ){
    let oldAni = el.scratch('_editAni');

    if( oldAni ){
      oldAni.stop();
    }

    if( el.removed() ){
      return;
    }

    el.style('overlay-color', defs.editAnimationColor);

    let ani = el.animation({
      style: {
        'overlay-opacity': defs.editAnimationOpacity,
      },
      duration: defs.editAnimationDuration / 2,
      easing: defs.editAnimationEasing
    });

    let ani2 = el.animation({
      style: {
        'overlay-opacity': 0
      },
      duration: defs.editAnimationDuration / 2,
      easing: defs.editAnimationEasing
    });

    el.scratch('_editAni', ani);

    ani.progress(0).play().promise('complete').then( () => {
      el.scratch('_editAni', ani2);

      return ani2.play().promise('complete');
    } ).then( () => {
      el.removeStyle('overlay-opacity');
      el.removeStyle('overlay-color');
    } );
  };

  let applyEditAnimation = function( el ){
    return applyEditAnimationAsOverlay( el );
  };

  let onEdit = function(){
    onDoc( this, (docEl, el) => applyEditAnimation( el ) );
  };

  let posThreshold = 0.0001;

  let samePos = (p1, p2) => Math.abs(p1.x - p2.x) < posThreshold && Math.abs(p1.y - p2.y) < posThreshold;

  let docNodePosQ = new Set();

  let debounceDocPos = defs.docPositionDebounceTime > 0 ? _.debounce : fn => fn;

  let scheduleDocPositionUpdate = debounceDocPos(function(){
    for( let el of docNodePosQ.values() ){
      let docEl = document.get( el.id() );

      updateFromDocPos( docEl, el );
    }

    nodesPosQ.clear();
  }, defs.docPositionDebounceTime);

  let updateFromDocPos = function( docEl, el ){
    let newPos = _.clone( docEl.position() );

    // no point in updating if no diff
    if( samePos( newPos, el.position() ) ){ return; }

    let oldAni = el.scratch('_docPosAni');

    if( oldAni ){
      oldAni.stop();
    }

    let ani = el.animation({
      position: newPos,
      duration: defs.positionAnimationDuration,
      easing: defs.positionAnimationEasing
    });

    el.scratch('_docPosAni', ani);

    ani.play();

    applyEditAnimation( el );
  };

  let onDocPos = function( pos2, pos1 ){
    onDoc( this, (docEl, el) => {
      if( el.grabbed() || isInteractionNode( el ) ){ return; }

      // no point in updating if no diff
      if( samePos( pos2, pos1 ) ){ return; }

      docNodePosQ.add( el );

      scheduleDocPositionUpdate();
    } );
  };

  let updateFromCyPos = function( docEl, el ){
    let newPos = _.clone( el.position() );

    if( docEl != null && !samePos( docEl.position(), newPos ) ){
      docEl.reposition( newPos );
    }

  };

  let nodesPosQ = new Set();

  let schedulePositionUpdate = _.debounce( function(){
    for( let el of nodesPosQ.values() ){
      let docEl = getDocEl( el );

      updateFromCyPos( docEl, el );
    }

    nodesPosQ.clear();
  }, defs.positionDebounceTime );

  let onCyPosEle = function( el ){
    nodesPosQ.add( el );

    schedulePositionUpdate();
  };

  let onCyPos = function(){
    let el = this;

    onCyPosEle( el );
  };

  let onCyAutomove = onCyPos;

  let onLayout = function(){
    cy.nodes().forEach( onCyPosEle );
  };

  let onLoad = function(){
    onAddEles( document.elements() );

    cy.fit( defs.padding );
  };

  let onDocRename = function(){
    onDoc( this, function( docEl, el ){
      el.data( 'name', docEl.name() );
    } );
  };

  let onRenameDebounce = function( docEl, name ){
    onDoc( docEl, function( docEl, el ){
      el.data( 'name', name );
    } );
  };

  let onDocModify = function( mod ){
    onDoc( this, function( docEl, el ){
      el.data( 'modification', mod.value );
    } );
  };

  let onDocRetypePpt = function( docPpt, type ){
    onDoc( this, function( docIntn, intnEdge ){
      let reversed = intnEdge.target().id() !== docPpt.id();

      intnEdge.data('sign', type.value);
      intnEdge.data('reversed', reversed);
    } );
  };

  let onDocRemRetypePpt = function( docEl, type ){ // eslint-disable-line no-unused-vars
    onDoc( this, function( docIntn, intnNode ){
      let edges = intnNode.connectedEdges();
      let isElNode = n => n.id() === docEl.id();
      let tgtEdge = edges.filter( e => e.connectedNodes().some( isElNode ) );

      applyEditAnimation( tgtEdge );
    } );
  };

  let reapplyAssocToCy = function( docEl, el ){
    el.data({
      associated: docEl.associated(),
      type: docEl.type()
    });
  };

  let reapplyCompeletionToCy = function( docEl, el ){
    el.data({
      completed: docEl.completed()
    });
  };

  let onDocAssoc = function(){
    onDoc( this, function( docEl, el ){
      if( !docEl.isInteraction() ){
        reapplyAssocToCy( docEl, el );
      }
    } );
  };

  let onDocUnassoc = function(){
    onDoc( this, function( docEl, el ){
      if( !docEl.isInteraction() ){
        reapplyAssocToCy( docEl, el );
      }
    } );
  };

  let onDocComplete = function(){
    onDoc( this, function( docEl, el ){
      reapplyCompeletionToCy( docEl, el );
    } );
  };

  let onDocUncomplete = function(){
    onDoc( this, function( docEl, el ){
      reapplyCompeletionToCy( docEl, el );
    } );
  };

  let updateIntnArity = function( docIntn ){
    onDoc( docIntn, function( docEl, el ){
      if( document.has( docIntn ) ){
        el.data('arity', docIntn.participants().length );
      }
    } );
  };

  let onDocAddPpt = function( /*docPpt*/ ){
    onDoc( this, function( /*docIntn, el*/ ){
      // disabled for binary interactions
    } );
  };

  let onDocRmPpt = function( docPpt ){
    onDoc( this, function( docEl ){
      if ( docEl.isInteraction() || docEl.isComplex() ) {
        onRmPpt( docPpt, docEl );
      }
      if ( docEl.isInteraction() ) {
        updateIntnArity( docEl );
      }
    } );
  };

  let onAddEles = function( docEls ){
    cy.add( makeCyEles( docEls ) );

    for( let docEl of docEls ){
      let el = cy.getElementById( docEl.id() );

      addEleListeners( docEl, el );

      onAddNewEle( docEl, el );

      if( docEl.isInteraction() ){
        updateIntnArity( docEl );
      }
    }
  };

  let onAddEle = function( docEl ){
    onAddEles([ docEl ]);

    if ( docEl.isComplex() ) {
      handleComplexWaiters( docEl.id() );
    }
  };

  let onAddNewEle = function( docEl, el ){ // eslint-disable-line no-unused-vars
    // don't animate add for now to make things snappier
  };

  let onDocElLoad = function(){
    onDoc( this, (/*docEl*/) => {
      // not needed for binary interactions
    } );
  };

  let animateRm = function( el ){
    // disable animations for now for speed
    if( isInteractionNode(el) ){
      el.style('opacity', 0);

      Promise.delay( defs.addRmAnimationDuration ).then( () => {
        el.remove();
      } );
    } else {
      el.animation({
        style: { 'opacity': 0 },
        duration: defs.addRmAnimationDuration,
        easing: defs.addRmAnimationEasing
      }).play().promise().then( () => {
        el.remove();
      } );
    }
  };

  let rm = function( el ){
    return el.remove();
  };

  // disable animations for now (more responsive)
  animateRm = rm;

  let onRmEle = function( docEl ){
    let el = cy.getElementById( docEl.id() );
    let els = el.union( el.connectedEdges() );

    // if a complex is being removed protect the children
    // by putting them out of complex before the removal
    el.children().move({ parent: null });

    bus.emit('removehandle', el);
    bus.emit('closetip', el);

    els.forEach( animateRm );

    rmEleListeners( docEl, el );
  };

  let addEleListeners = function( docEl, el ){
    el = el || cy.getElementById( docEl.id() );

    docEl.on('remotereposition', onDocPos);
    docEl.on('remoterename', onEdit);
    docEl.on('remoteredescribe', onEdit);
    docEl.on('remoteassociate', onEdit);
    docEl.on('remotemodify', onEdit);
    docEl.on('remoteretype', onDocRemRetypePpt);
    docEl.on('rename', onDocRename);
    docEl.on('add', onDocAddPpt);
    docEl.on('remove', onDocRmPpt);
    docEl.on('associate', onDocAssoc);
    docEl.on('unassociate', onDocUnassoc);
    docEl.on('complete', onDocComplete);
    docEl.on('uncomplete', onDocUncomplete);
    docEl.on('retype', onDocRetypePpt);
    docEl.on('modify', onDocModify);
    docEl.on('loadelements', onDocElLoad);
    docEl.on('updatedparent', onDocElUpdateParent);
    el.on('drag', onCyPos);
    el.on('automove', onCyAutomove);
  };

  let rmEleListeners = function( docEl, el ){
    el = el || cy.getElementById( docEl.id() );

    docEl.removeListener('remotereposition', onDocPos);
    docEl.removeListener('remoterename', onEdit);
    docEl.removeListener('remoteredescribe', onEdit);
    docEl.removeListener('remoteassociate', onEdit);
    docEl.removeListener('remotemodify', onEdit);
    docEl.removeListener('remoteretype', onDocRemRetypePpt);
    docEl.removeListener('rename', onDocRename);
    docEl.removeListener('add', onDocAddPpt);
    docEl.removeListener('remove', onDocRmPpt);
    docEl.removeListener('associate', onDocAssoc);
    docEl.removeListener('unassociate', onDocUnassoc);
    docEl.removeListener('complete', onDocComplete);
    docEl.removeListener('uncomplete', onDocUncomplete);
    docEl.removeListener('retype', onDocRetypePpt);
    docEl.removeListener('modify', onDocModify);
    docEl.removeListener('loadelements', onDocElLoad);
    el.removeListener('drag', onCyPos);
    el.removeListener('automove', onCyAutomove);
  };

  let onRmPpt = function( docPpt, docEl ){
    let removeSelf = () => document.remove( docEl );
    let elements = docEl.elements();
    let size = elements.length;

    if ( docEl.isInteraction() ) {
      let cyGet = id => cy.getElementById( id );
      let ppt = cyGet( docPpt.id() );
      let intn = cyGet( docEl.id() );
      let edge = ppt.edgesWith( intn );

      if( size <= 1 ){
        removeSelf();
      }

      animateRm( edge );
    }
    else if ( docEl.isComplex() ) {
      if ( size <= 1 ) {
        let moveSingleChild = () => {
          if ( size == 0 ) {
            return Promise.resolve();
          }

          let child = docEl.elements()[0];
          return child.updateParent( null, docEl );
        };

        tryPromise( moveSingleChild ).then( removeSelf );
      }
    }
  };

  function removeByCyEles( eles ){
    let docEls = eles.map( getDocEl );

    let rmComplex = el => {
      // when only one child left it will be freed and the complex
      // will be removed automatically
      let childrenToFree = el.elements().slice( 0, el.size() - 1 );
      Promise.all( childrenToFree.map( ppt => ppt.updateParent( null, el ) ) );
    };

    let rmEntity = el => {
      let currParent = document.get( el.getParentId() );
      let freeEl = () => el.updateParent( null, currParent ).then( () => el );
      tryPromise( freeEl ).then( rm );
    };

    let rm = el => document.remove( el );

    docEls.forEach( el => {
      if ( el.isComplex() ) {
        rmComplex( el );
      }
      else if ( el.isEntity() ){
        rmEntity( el );
      }
      else {
        rm( el );
      }
    } );
  }

  function removeSelected(){
    removeByCyEles( cy.$(':selected') );
  }

  function selectAll(){
    cy.elements().select();
  }

  function selectNone(){
    cy.elements().unselect();
  }

  let copyEventPosition = e => {
    let { x, y } = e.position;

    return { x, y };
  };

  // keys

  let lastMousePos;
  let onMouseMove = evt => lastMousePos = copyEventPosition(evt);

  cy.on('mousemove', onMouseMove);

  bus.on('addelementmouse', () => controller.addElement({ position: lastMousePos }).then( el => bus.emit('opentip', el) ));
  bus.on('addinteractionmouse', () => bus.emit('addinteraction', { position: lastMousePos }));

  onKey('1', () => bus.emit('addelementmouse'));
  onKey('a', selectAll);
  onKey('n', selectNone);
  onKey('backspace', removeSelected);
  onKey('del', removeSelected);
  onKey('esc', () => bus.emit('closetip'));


  // doc <=> cy synch

  document.on('add', onAddEle);
  document.on('remoteadd', docEl => applyEditAnimation( getCyEl( docEl ) ));
  document.on('remove', onRmEle);
  cy.on('layoutstop', onLayout);
  bus.on('renamedebounce', onRenameDebounce);
  bus.on('removeselected', removeSelected);
  bus.on('removebycy', removeByCyEles);

  if( document.filled() ){
    onLoad();
  } else {
    document.on('load', onLoad);
  }

  if( !document.editable() ){
    cy.autoungrabify( true );
  }

  let onTapHold = (e) => {
    if( e.target === cy ){
      let tapend = cy.pon('tapend');
      let add = controller.addElement({ position: copyEventPosition(e) });

      Promise.all([ add, tapend ]).then( ([ el ]) => bus.emit('opentip', el) );
    }
  };

  cy.on('taphold', onTapHold);

  cy.on('add', 'edge', e => {
    let edge = e.target;

    if( edge.connectedNodes(isInteractionNode).selected() ){
      edge.select();
    }
  });
}


export default listenToDoc;
