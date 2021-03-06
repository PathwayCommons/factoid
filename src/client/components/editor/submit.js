import EventEmitter from 'eventemitter3';

import { TaskView } from '../tasks';
import Popover from '../popover/popover';
import { makeClassList } from '../../dom';
import h from 'react-hyperscript';

export const Submit = props => {

  const emitter = new EventEmitter();
  const { document, bus, controller } = props;

  if( !document.editable() ){
    return null;
  }

  return h('div.editor-submit', [
    h(Popover, {
      hide: hideNow => bus.on('closesubmit', hideNow),
      tippy: {
        html: h(TaskView, { document, bus, controller, emitter } ),
        sticky: true
      }
    }, [
      h('button.editor-submit-button', {
        disabled: document.trashed(),
        className: makeClassList({
          'super-salient-button': true,
          'submitted': controller.done()
        })
      }, controller.done() ?  'Submitted' : 'Submit')
    ])
  ]);
};

export default Submit;