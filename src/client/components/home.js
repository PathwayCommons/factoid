const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const { Component } = require('react');

class Home extends Component {
  render(){
    return h('div.home', [
      h('h1', [
        h('i.icon.icon-logo.home-logo-icon'),
        ' Factoid'
      ]),
      h('h3', 'Share your pathway with the world'),
      h('p', `
        Factoid gives your biological research visibility by linking your paper to digital data for your pathway.

        We do this in four easy steps:
      `),
      h('p', [ h('span.home-steps-figure') ]),
      h('ol', [
        h('li', 'The paper is submitted to the journal.'),
        h('li', 'The author receives an email from Factoid, with a link to edit the Factoid document associated with the paper.  '),
        h('li', [
          h('span', 'Next, the author edits the document (e.g. '),
          h(Link, { className: 'plain-link', to: '/example-document' }, 'sample document'),
          h('span', ') to ensure that it accurately portrays the paper.'),
        ]),
        h('li', 'The author then finalises the document, and the data is automatically sent to the journal.  The data is publicly available for anyone to use and cite.')
      ])
    ]);
  }
}

module.exports = Home;
