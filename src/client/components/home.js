const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const { Component } = require('react');

class Home extends Component {
  render(){
    return h('div.home', [
      h('section.hero', [
        h('div.page-content', [
          h('header.nav-bar', [
            h('div.nav-bar-logo.icon.icon-logo'),
            h('div.nav-bar-links', [
              h('div.nav-bar-link', [
                h('a', { href: '/' }, 'Some link')
              ]),
              h('div.nav-bar-link', [
                h('a', { href: '/' }, 'Some link')
              ]),
              h('div.nav-bar-link', [
                h('a', { href: '/' }, 'Some link')
              ])
            ])
          ]),
          h('h1.hero-title', 'Factoid'),
          h('div.hero-subtitle', 'Share your pathway with the world'),
          h('div.hero-buttons', [
            h('button.hero-button', 'View Factoid demo'),
            h('button.hero-button', 'Try Factoid with your abstract')
          ])
        ])
      ]),
      h('section.home-section', [
        h('div.page-content', [
          h('h2', 'How does Factoid work?'),
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
        ])
      ]),
      h('section.home-section', [
        h('div.page-content', [
          h('p', 'Some random content')
        ])
      ]),
      h('section.home-section', [
        h('div.page-content', [
          h('p', 'Some random content')
        ])
      ]),
      h('section.home-section', [
        h('div.page-content', [
          h('p', 'Some random content')
        ])
      ]),
      h('section.home-section', [
        h('div.page-content', [
          h('p', 'Some random content')
        ])
      ]),
    ]);
  }
}

module.exports = Home;
