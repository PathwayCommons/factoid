const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const { Component } = require('react');

class Home extends Component {
  render(){
    return h('div.home', [
      h('section.hero', [
        h('div.page-content', [
          h('header.nav-bar', [
            h('div'),
            h('div.nav-bar-links', [
              h('div.nav-bar-link', [
                h('a', { href: '/' }, 'About')
              ]),
              h('div.nav-bar-link', [
                h('a', { href: '/' }, 'Features')
              ]),
              h('div.nav-bar-link', [
                h('a', { href: '/' }, 'Team')
              ]),
              h('div.nav-bar-link', [
                h('a', { href: '/' }, 'Contact')
              ])
            ])
          ]),
          h('div.hero-title-container', [
            h('div.hero-title', 'Factoid')
          ]),
          h('div.hero-subtitle', 'SHARE YOUR PATHWAY WITH THE WORLD'),
          h('div.hero-description', 'Publishing and getting your research noticed is essential. Factoid helps you increase the visibility of your publications by linking your research to pathways.'),
          h('div.hero-buttons', [
            h('button.hero-button', 'TRY FACTOID'),
            // h('button.hero-button.hero-alt', 'View Demo')
          ])
        ])
      ]),
      h('section.home-section', [
        h('div.page-content', [
          h('h2.how-it-works', 'How does Factoid work?'),
          h('p.how-it-works-description', `
            Factoid works in tandem with publishers and authors to give your biological research visibility by linking your paper to digital data for your pathway.
          `),
          h('p', [ h('span.home-steps-figure') ]),
          h('ol', [
            h('li.how-it-works-description', [
              h('h2', 'We receive your paper'),
              h('p', 'Factoid receives your research paper and digitally captures information from it.')
            ]),
            h('li.how-it-works-description', [
              h('h2', 'You receive an email'),
              h('p', 'You get an email from Factoid with a link to a document containing your digitally captured information.')
            ]),
            h('li.how-it-works-description', [
              h('h2', 'Edit the Factoid document'),
              h('p', [
                h('span', 'Edit the document (e.g. '),
                h(Link, { className: 'plain-link', to: '/example-document' }, 'sample document'),
                h('span', ') to ensure that it accurately represents the information we found in your paper.')
              ])
            ]),
            h('li.how-it-works-description', [
              h('h2', 'Submit and finalize the document'),
              h('p', 'You finalize the document, and we send the data to the journal.  Your data is publicly available for anyone to use and cite.')
            ]),
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
          h('p', 'Credits'),
          h('p', 'starline @ Freepik for the free splash background https://www.freepik.com/starline')
        ])
      ]),
    ]);
  }
}

module.exports = Home;
