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
    h('div.element-info-back-area', [
      h(Tooltip, {
        description: 'Back',
        tippy: tippyOpts
      }, [
        h('button.element-info-back.plain-button', {
          disabled: !progression.canGoBack(),
          onClick: () => progression.back()
        }, [
          backButtonLabel
        ])
      ])
    ]),

    h(Tooltip, {
      description: isCompleted ? 'Completed' : 'Next',
      tippy: tippyOpts
    }, [
      h('div.element-info-forward-area', [
        h('button.element-info-forward.plain-button', {
          disabled: !progression.canGoForward(),
          onClick: () => progression.forward()
        }, [
          forwardButtonLabel
        ])
      ])
    ])
  ]) );
};
