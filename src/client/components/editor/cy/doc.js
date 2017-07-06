let { makeCyEles, makePptEdges } = require('./make-cy-eles');
let _ = require('lodash');
let defs = require('./defs');
let moment = require('moment');
let onKey = require('./on-key');

function listenToDoc({ bus, cy, document }){
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

  let onCy = function( el, handler ){
    let docEl = getDocEl( el );

    handler( docEl, el );
  };

  let applyEditAnimationAsOverlay = function( el ){
    let oldAni = el.scratch('_editAni');

    if( oldAni ){
      oldAni.stop();
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
      // if the user is grabbing the node, then remote updates to position shouldn't take effect
      if( el.grabbed() ){ return; }

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
      let docEl = document.get( el.id() );

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

  let reapplyAssocToCy = function( docEl, el ){
    el.data({
      associated: docEl.associated(),
      name: docEl.name(),
      type: docEl.type()
    });
  };

  let onDocAssoc = function(){
    onDoc( this, function( docEl, el ){
      reapplyAssocToCy( docEl, el );
    } );
  };

  let onDocUnassoc = function(){
    onDoc( this, function( docEl, el ){
      reapplyAssocToCy( docEl, el );
    } );
  };

  let onReplaceEle = function( oldDocEl, newDocEl ){
    rmEleListeners( oldDocEl );
    addEleListeners( newDocEl );
  };

  let onDocAddPpt = function( docPpt ){
    onDoc( this, function( docEl/*, el*/ ){
      let edges = cy.add( makePptEdges( docEl, docPpt ) );

      edges.forEach( edge => onAddNewEle( docEl, edge ) );
    } );
  };

  let onDocRmPpt = function( docPpt ){
    onDoc( this, function( docIntn ){
      onRmPpt( docPpt, docIntn );
    } );
  };

  let onAddEles = function( docEls ){
    cy.add( makeCyEles( docEls ) );

    for( let docEl of docEls ){
      let el = cy.getElementById( docEl.id() );

      addEleListeners( docEl, el );

      onAddNewEle( docEl, el );
    }
  };

  let onAddEle = function( docEl ){
    onAddEles([ docEl ]);
  };

  let onAddNewEle = function( docEl, el ){
    let timestamp = docEl.creationTimestamp();
    let isNew = timestamp != null && moment( timestamp ).isAfter( moment().subtract(5, 'seconds') );

    if( !isNew ){ return; }

    el.style({ 'opacity': 0 }).animation({
      style: { 'opacity': 1 },
      duration: defs.addRmAnimationDuration,
      easing: defs.addRmAnimationEasing
    }).play().promise().then( () => {
      el.removeStyle('opacity');
    } );
  };

  let animateRm = function( el ){
    el.animation({
      style: { 'opacity': 0 },
      duration: defs.addRmAnimationDuration,
      easing: defs.addRmAnimationEasing
    }).play().promise().then( () => {
      el.remove();
    } );
  };

  let onRmEle = function( docEl ){
    let el = cy.getElementById( docEl.id() );
    let els = el.union( el.connectedEdges() );

    bus.emit('removehandle', el);

    els.forEach( animateRm );

    rmEleListeners( docEl, el );
  };

  let addEleListeners = function( docEl, el ){
    el = el || cy.getElementById( docEl.id() );

    docEl.on('remotereposition', onDocPos);
    docEl.on('remoterename', onEdit);
    docEl.on('remoteredescribe', onEdit);
    docEl.on('remoteassociate', onEdit);
    docEl.on('rename', onDocRename);
    docEl.on('add', onDocAddPpt);
    docEl.on('remove', onDocRmPpt);
    docEl.on('associate', onDocAssoc);
    docEl.on('unassociate', onDocUnassoc);
    el.on('drag', onCyPos);
    el.on('automove', onCyAutomove);
  };

  let rmEleListeners = function( docEl, el ){
    el = el || cy.getElementById( docEl.id() );

    docEl.removeListener('remotereposition', onDocPos);
    docEl.removeListener('remoterename', onEdit);
    docEl.removeListener('remoteredescribe', onEdit);
    docEl.removeListener('remoteassociate', onEdit);
    docEl.removeListener('rename', onDocRename);
    docEl.removeListener('add', onDocAddPpt);
    docEl.removeListener('remove', onDocRmPpt);
    docEl.removeListener('associate', onDocAssoc);
    docEl.removeListener('unassociate', onDocUnassoc);
    el.removeListener('drag', onCyPos);
    el.removeListener('automove', onCyAutomove);
  };

  let onRmPpt = function( docPpt, docIntn ){
    let cyGet = id => cy.getElementById( id );
    let ppt = cyGet( docPpt.id() );
    let intn = cyGet( docIntn.id() );
    let edge = ppt.edgesWith( intn );

    animateRm( edge );
  };

  function removeByCyEles( eles ){
    let rm = docEl => document.remove( docEl );

    let rmNode = el => {
      let docEl = document.get( el.id() );

      if( docEl ){ rm( docEl ); }
    };

    let rmFromIntn = (intn, ppt) => {
      let docIntn = document.get( intn.id() );
      let docPpt = document.get( ppt.id() );

      if( docIntn.isInteraction() && docIntn.has( docPpt ) ){
        docIntn.remove( docPpt );
      }
    };

    let rmEdge = el => {
      let src = el.source();
      let tgt = el.target();

      rmFromIntn( src, tgt );
      rmFromIntn( tgt, src );
    };

    eles.forEach( el => {
      if( el.isNode() ){
        rmNode( el );
      } else if( el.isEdge() ){
        rmEdge( el );
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

  bus.on('addelementmouse', () => bus.emit('addelement', { position: lastMousePos }));
  bus.on('addinteractionmouse', () => bus.emit('addinteraction', { position: lastMousePos }));

  onKey('e', () => bus.emit('addelementmouse'));
  onKey('i', () => bus.emit('addinteractionmouse'));
  onKey('a', selectAll);
  onKey('n', selectNone);
  onKey('backspace', removeSelected);
  onKey('del', removeSelected);
  onKey('esc', () => bus.emit('closetip'));


  // doc <=> cy synch

  document.on('add', onAddEle);
  document.on('replace', onReplaceEle);
  document.on('remoteadd', docEl => applyEditAnimation( getCyEl( docEl ) ));
  document.on('remove', onRmEle);
  document.on('remoteremove', docEl => applyEditAnimation( getCyEl( docEl ) ));
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
    cy.autolock( true );
  }

  let onTapHold = (e) => {
    if( e.target === cy ){
      bus.emit('addelement', { position: copyEventPosition(e) });
    }
  };

  cy.on('taphold', onTapHold);

  // TODO emit close on bus when doc closed / new doc loaded?
  bus.on('close', function(){
    // TODO handle removing listeners
  });
}


module.exports = listenToDoc;
