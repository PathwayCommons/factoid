const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const React = require('react');

class Debug extends React.Component {
  render(){
    return h('div.debug', [
      h('p', [
        h('i.icon.icon-logo.debug-logo-icon')
      ]),
      h('h1', 'Debug page'),
      h('p', 'This page is for testing purposes only.  It is not for users.  This page may be removed at any time.'),
      h('div.debug-links', [
        h('span.debug-link', [ h(Link, { className: 'plain-link', to: '/debug/new-document' }, 'Create new, blank document') ]),
        h('span.debug-link', [ h(Link, { className: 'plain-link', to: '/debug/new-document/fill' }, 'Create new document, filled from text') ])
      ])
    ]);
  }
}

module.exports = Debug;
