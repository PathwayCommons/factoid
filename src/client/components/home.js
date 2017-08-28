const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const React = require('react');

class Home extends React.Component {
  render(){
    return h('div.home', [
      h('i.home-icon'),
      h('div.home-links', [
        h('span.home-link', [ h(Link, { className: 'plain-link', to: '/new-document' }, 'Create new, blank document') ]),
        h('span.home-link', [ h(Link, { className: 'plain-link', to: '/new-document/fill' }, 'Create new document, filled from text') ])
      ])
    ]);
  }
}

module.exports = Home;
