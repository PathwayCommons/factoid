import h from 'react-hyperscript';

export default function({ controller }){
  let avail = controller.data.undoRemoveAvailable;

  return h('div.editor-undo-rm' + (avail ? '' : '.editor-undo-rm-unavailable'), [
    h('button.plain-button.editor-undo-rm-button', {
      onClick: () => controller.undoRemove()
    }, [
      h('i.material-icons', 'undo'),
      h('span', ' Undo last delete')
    ])
  ]);
};
