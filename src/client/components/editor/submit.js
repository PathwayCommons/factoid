const h = require('react-hyperscript');
const Popover = require('../popover');
const isNonNil = x => x != null;
const _ = require('lodash');

module.exports = function({ controller, document }){
  let infos = [];
  let d = controller.data;

  if( d.subNoEnts ){
    infos.push( h('div.editor-submit-info-err', [
      h('p', 'Submission requires a non-empty document.')
    ]) );
  } else if( d.subUnassocEnts && d.subUnassocEnts.length > 0 ){
    infos.push( h('div.editor-submit-info-err', [
      h('p', 'Unidentified entities (in red) should be matched prior to submission.')
    ]) );
  } else if( d.submitting ){
    infos.push( h('div.editor-submit-info-submitting', [
      h('i.icon.icon-spinner')
    ]) );
  } else if( d.submitted ){
    infos.push( h( 'div.editor-submit-info-submitted', [ h('i.material-icons', 'check') ] ) );
  }

  return h('div.editor-submit', [
    document.editable() ? h(Popover, {
      tippy: {
        html: h('div.editor-submit-info', infos),
        onShow: () => controller.onShowSubmit(),
        onHide: () => controller.onHideSubmit()
      }
    }, [
      h('button.editor-submit-button.active-button', {
        onClick: () => controller.submit().catch( _.noop ) // consume error since already marked in ui
      }, 'Submit')
    ]) : null
  ].filter( isNonNil ));
};
