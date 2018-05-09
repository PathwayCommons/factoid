const Tooltip = require('../popover/tooltip');
const h = require('react-hyperscript');
const { makeClassList } = require('../../../util');

module.exports = ({ progression }) => {
  let { STAGES } = progression;
  let stage = progression.getStage();
  let isCompleted = stage === STAGES.COMPLETED;
  let buttonLabel = content => h('span.entity-info-progression-button-label', [ content ]);

  let backButtonLabel = buttonLabel( h('i.material-icons', 'chevron_left') );

  let forwardButtonLabel = buttonLabel(
    h('i.material-icons', {
      className: makeClassList({
        'entity-info-complete-icon': isCompleted
      })
    }, isCompleted ? 'check_circle' : 'chevron_right')
  );

  let tippyOpts = { placement: 'bottom' };

  return ( h('div.entity-info-progression', [
    h('button.entity-info-back.plain-button', {
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

    h('button.entity-info-forward.plain-button', {
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
