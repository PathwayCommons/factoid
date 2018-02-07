
const React = require('react');
const h = require('react-hyperscript');
const MultiStep = require('react-stepzilla').default;

const Editor = require('./editor');
const SubmitPage = require('./submit-page');


class MultiFormEditor extends React.Component {
  render() {
    return h('div.multi-form-editor', [
      h('div.editor-content', [
        h('div.editor-view', [
          h('div.editor-toolbar', 'toolbar'),
          h('div.editor-view-panel', 'editor view panel')
        ]),
        h('div.editor-context', 'context')
      ]),
      h('div.editor-stepper', [
        'stepper'
      ])
    ]);
  }
}

module.exports = MultiFormEditor;
