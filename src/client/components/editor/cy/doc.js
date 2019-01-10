const _ = require('lodash');
const defs = require('./defs');
const parse = require('date-fns/parse');
const isAfter = require('date-fns/is_after');
const subSeconds = require('date-fns/sub_seconds');
const date = { parse, isAfter, subSeconds };
const onKey = require('./on-key');
const { isInteractionNode, makeCyEles } = require('../../../../util');

function listenToDoc({ bus, cy, document, controller }){
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
    onDoc( this, function( docIntn ){
      onRmPpt( docPpt, docIntn );

      updateIntnArity( docIntn );
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
  };

  let onAddNewEle = function( docEl, el ){ // eslint-disable-line no-unused-vars
    // don't animate add for now to make things snappier
  };

  let onDocElLoad = function(){
    onDoc( this, (/*docEl*/) => {
      // not needed for binary interactions
    } );
  };

  let animateAdd = function( docEl, el ){ // eslint-disable-line no-unused-vars
    let timestamp = docEl.creationTimestamp();
    let whenCreated = timestamp == null ? null : date.parse( timestamp );
    let cutoff = date.subSeconds( Date.now(), 5 );
    let isNew = whenCreated != null && date.isAfter( whenCreated, cutoff );

    if( isNew ){
      if( docEl.isInteraction() && el.isNode() ){
        el.style({ 'opacity': 0 });

        Promise.delay( defs.addRmAnimationDuration ).then( () => {
          el.removeStyle('opacity');
        } );
      } else {
        el.style({ 'opacity': 0 }).animation({
          style: { 'opacity': 1 },
          duration: defs.addRmAnimationDuration,
          easing: defs.addRmAnimationEasing
        }).play().promise().then( () => {
          el.removeStyle('opacity');
        } );
      }
    }
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

  let onRmPpt = function( docPpt, docIntn ){
    let cyGet = id => cy.getElementById( id );
    let ppt = cyGet( docPpt.id() );
    let intn = cyGet( docIntn.id() );
    let edge = ppt.edgesWith( intn );

    if( docIntn.participants().length <= 1 ){
      document.remove( docIntn );
    }

    animateRm( edge );
  };

  function removeByCyEles( eles ){
    let rm = el => document.remove( getDocEl(el) );

    eles.forEach( rm );
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

  cy.on('tap', 'node, edge', _.debounce( e => {
    let tgt = e.target;

    if( tgt.isNode() && isInteractionNode(tgt) ){
      tgt.connectedEdges().select();
    } else if( tgt.isEdge() ){
      let intnNode = tgt.connectedNodes( isInteractionNode );

      intnNode.connectedEdges().select();
      intnNode.select();
    }
  }, 10 ));

  cy.on('add', 'edge', e => {
    let edge = e.target;

    if( edge.connectedNodes(isInteractionNode).selected() ){
      edge.select();
    }
  });
}


module.exports = listenToDoc;
