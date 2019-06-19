import { tryPromise } from '../../../../util';

export default function({ cy, document, controller }){
    if( !document.editable() ){ return; }
    cy.compoundDragAndDrop();
    let lastOldParent = null;

    const getDocEl = id => id != null ? document.get(id) : null;
    const getElId = el => el == null ? null : el.id();
    const checkIfNonEmpty = el => el != null && el.length > 0;
    let startBatch = () => cy.startBatch();
    let endBatch = () => cy.endBatch();

    cy.on( 'cdndgrab', ( event ) => {
        let node = event.target;
        lastOldParent = node.isOrphan() ? null : node.parent()[0];
    } );

    cy.on( 'cdnddrop', ( event, dropTarget, dropSibling ) => {
        let oldParent = lastOldParent;
        let newParent = dropTarget.isNode() ? dropTarget : null;
        let dragNode = event.target;

        lastOldParent = null;

        if ( newParent == oldParent ) {
            return null;
        }

        let oldParentId = getElId( oldParent );
        let newParentId = getElId( newParent );
        let dragNodeId = dragNode.id();
        let dropSiblingId = checkIfNonEmpty( dropSibling ) ? dropSibling.id() : null;

        // move back to initial cy state and let doc listeners handle the rest
        dragNode = dragNode.move( { parent: oldParentId } );
        if ( checkIfNonEmpty( dropSibling ) ) {
            dropSibling = dropSibling.move( { parent: null } );
            newParent.remove();
        }

        let docDragEl = getDocEl( dragNodeId );
        let docDropSibling = getDocEl( dropSiblingId );
        let docNewParent = getDocEl( newParentId );
        let docOldParent = getDocEl( oldParentId );
        let doNotAdd = false;

        const handleNewComplex = () => {
          if ( dropSiblingId == null ) {
            return Promise.resolve();
          }

          doNotAdd = true;
          let entries = [ dragNodeId, dropSiblingId ]
            .map( id => ( { id } ) );

          const createComplex = () => controller.addComplex({ entries });
          const updateNewParent = complex => {
            newParentId = complex.id();
            docNewParent = getDocEl( newParentId );
          };

          return tryPromise( createComplex ).then( updateNewParent );
        };

        const updateParent = docEl => docEl.updateParent( docNewParent, docOldParent, doNotAdd );
        const updateSelfParent = () =>  updateParent( docDragEl );
        const updateSiblingParent = () => {
          if ( docDropSibling == null ) {
            return Promise.resolve();
          }

          return updateParent( docDropSibling );
        };

        return (
            tryPromise( startBatch )
                .then( handleNewComplex )
                .then( updateSelfParent )
                .then( updateSiblingParent )
                .then( endBatch )
        );
    } );
}
