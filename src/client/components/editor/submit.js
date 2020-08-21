import { TaskView } from '../tasks';
import Popover from '../popover/popover';
import { makeClassList } from '../../../util';
import h from 'react-hyperscript';

export const Submit = props => {
  const { document, bus, controller } = props;

  if( !document.editable() ){
    return null;
  }

  return h('div.editor-submit', [
    h(Popover, { tippy: { html: h(TaskView, { document, bus, controller } ) } }, [
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