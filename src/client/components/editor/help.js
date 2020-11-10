import h from 'react-hyperscript';
import { makeClassList } from '../../dom';

export const Help = props => {
  const { showHelp, controller, document } = props;

  if( !document.editable() ){
    return null;
  }

  return h('div.editor-help-container', [
    h('div.editor-help-background', {
      className: makeClassList({
        'editor-help-background-shown': showHelp
      }),
      onClick: () => controller.toggleHelp()
    }),
    h('div.editor-help', {
      className: makeClassList({
        'editor-help-shown': showHelp
      })
    }, [
      h('div.editor-help-box', [
        h('div.editor-help-close-icon', {
          onClick: () => controller.toggleHelp()
        }, [
          h('i.material-icons', 'close')
        ]),
        h('div.editor-help-title', 'Welcome'),
        h('div.editor-scroll-box', [
          h('div.editor-help-copy', `
            In just a few simple steps you'll compose a profile containing the key biological interactions described in your article.
          `),
          h('div.editor-help-cells', [
            h('div.editor-help-cell', [
              h('img.editor-help-img', { src: '/image/welcome-aboard-1.svg' }),
              h('div.editor-help-caption', `1. Add your genes and chemicals`)
            ]),
            h('div.editor-help-cell', [
              h('img.editor-help-img', { src: '/image/welcome-aboard-2.svg' }),
              h('div.editor-help-caption', `2. Connect those that interact`)
            ]),
            h('div.editor-help-cell', [
              h('img.editor-help-img', { src: '/image/welcome-aboard-3.svg' }),
              h('div.editor-help-caption', `3. For complexes, drag items together`)
            ]),
            h('div.editor-help-cell', [
              h('img.editor-help-img', { src: '/image/welcome-aboard-4.svg' }),
              h('div.editor-help-caption', `4. Submit to finish`)
            ])
          ])
        ]),
        h('div.editor-help-close', [
          h('button.editor-help-close-button.active-button', {
            onClick: () => controller.toggleHelp()
          }, `OK, let's start`)
        ])
      ])
    ])
  ]);
};

export default Help;