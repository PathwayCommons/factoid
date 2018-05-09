const Tooltip = require('../popover/tooltip');
const h = require('react-hyperscript');
const { makeClassList } = require('../../../util');

module.exports = ({ progression }) => {
  let { STAGES } = progression;
  let stage = progression.getStage();
  let isCompleted = stage === STAGES.COMPLETED;
  let buttonLabel = content => h('span.element-info-progression-button-label', [ content ]);

  let backButtonLabel = buttonLabel( h('i.material-icons', 'chevron_left') );

  let forwardButtonLabel = buttonLabel(
    h('i.material-icons', {
      className: makeClassList({
        'element-info-complete-icon': isCompleted
      })
    }, isCompleted ? 'check_circle' : 'chevron_right')
  );

  let tippyOpts = { placement: 'bottom' };

  return ( h('div.element-info-progression', [
    h('button.element-info-back.plain-button', {
      disabled: !progression.canGoBack(),
      onClick: () => progression.back()
    }, [
      h(Tooltip, {
        description: 'Go to the previous step.',
        tippy: tippyOpts
      }, [
        backButtonLabel
      ])
    ]),

    h('button.element-info-forward.plain-button', {
      disabled: !progression.canGoForward(),
      onClick: () => progression.forward()
    }, [
      h(Tooltip, {
        description: isCompleted ? 'This entity is completed.' : 'Go to the next step.',
        tippy: tippyOpts
      }, [
        forwardButtonLabel
      ])
    ])
  ]) );
};
