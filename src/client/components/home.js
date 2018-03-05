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
                h('a', { href: '/' }, 'How it Works')
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
          h('h2', 'Team'),
          h('p', 'Factoid is the product of a proud collaboration between the Bader Lab @ the University of Toronto, Sander Lab @ the Dana Farber Cancer Institute and Harvard Medical School, and the Pathway and Omics Lab @ Oregon Health and Science University'),
          h('h3', 'Bader Lab @ University of Toronto'),
          h('ul', [
            h('li', 'Gary Bader'),
            h('li', 'Max Franz'),
            h('li', 'Jeffrey Wong'),
            h('li', 'Dylan Fong')
          ]),
          h('h3', 'Sander Lab @ The Dana-Farber Cancer Institute and Harvard Medical School'),
          h('ul', [
            h('li', 'Chris Sander'),
            h('li', 'Christian Dallago'),
            h('li', 'Augustin Luna')
          ]),
          h('h3', 'Pathway and Omics Lab @ The Oregon Health and Science University'),
          h('ul', [
            h('li', 'Emek Demir'),
            h('li', 'Funda Durupinar Babur'),
            h('li', 'David Servillo'),
            h('li', 'Metin Can Siper'),
          ]),
          h('h3', 'Assets'),
          h('p', 'starline @ Freepik for the free splash background https://www.freepik.com/starline')
        ])
      ]),
      h('section.home-section', [
        h('div.page-content', [
          h('h2', 'Contact')
        ])
      ])
    ]);
  }
}

module.exports = Home;
