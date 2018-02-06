const React = require('react');
const h = require('react-hyperscript');

class SubmitPage extends React.Component {
  render() {
    return h('div.submit-page', [
      h('div.submit-panel', [
        'View the result to submit here'
      ]),
      h('div.submit-context', [
        h('div.context-box', [
          'context to explain stuff goes here'
        ]),
        h('div.submit-button', [
          'submit button goes here'
        ])
      ])
    ]);
  }
}

module.exports = SubmitPage;