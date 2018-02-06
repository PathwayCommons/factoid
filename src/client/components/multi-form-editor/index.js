
const React = require('react');
const h = require('react-hyperscript');
const MultiStep = require('react-stepzilla').default;

const Editor = require('./editor');
const SubmitPage = require('./submit-page');

const steps = [
  {name: 'Edit', component: h(Editor)},
  {name: 'Submit', component: h(SubmitPage)}
];

class MultiFormEditor extends React.Component {
  render() {
    return h('div', [
      h(MultiStep, {
        steps: steps,
        showSteps: false
      })
    ]);
  }
}

module.exports = MultiFormEditor;
