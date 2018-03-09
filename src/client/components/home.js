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
                h('a', { href: '/#about' }, 'About')
              ]),
              h('div.nav-bar-link', [
                h('a', { href: '/#how' }, 'How it Works')
              ]),
              h('div.nav-bar-link', [
                h('a', { href: '/#credits' }, 'Team')
              ]),
              h('div.nav-bar-link', [
                h('a', { href: '/#contact' }, 'Contact')
              ])
            ])
          ]),
          h('div.hero-title-container#about', [
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
      h('section.home-section#how', [
        h('div.page-content', [
          h('h2.section-title', 'How does Factoid work?'),
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
      h('section.home-section#why', [
        h('div.page-content', [
          h('h2.section-title', 'Our Mission'),
          h('h2', 'Increase the Visibility of Your Research'),
          h('p', 'Our mission is to help you increase the visibility of your research.  Factoid is a cutting edge platform that digitally captures your information.  This provides a means for better search an discovery capabilities for your paper'),
          h('p', `By encoding your paper's information in a Factoid document, the future research possibilities are endless; providing opportunities to perform large scale research and analysis over thousands of papers efficiently.`),
          h('h2', 'Contribute to the Future of Academic Paper Curation'),
          h('p', 'The current processes for finding and reading pathway literature is time consuming and inefficient.  Factoid solves these issues by providing services to search and view thousands of papers in a unified digital format, making it easy to understand a vast array of biological phenomena.')
        ])
      ]),
      h('section.home-section#credits', [
        h('div.page-content.team', [
          h('h2.section-title', 'Team'),
          h('p', 'Factoid is the product of a proud collaboration between the Bader Lab @ the University of Toronto, Sander Lab @ the Dana Farber Cancer Institute and Harvard Medical School, and the Pathway and Omics Lab @ the Oregon Health and Science University'),
          h('h3', 'Bader Lab @ The University of Toronto'),
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
      h('section.home-section#contact', [
        h('div.page-content.contact', [
          h('h2.section-title', 'Contact'),
          h('p', [
            h('span', 'Please send all inquiries to the'),
            h('a.plain-link', { href: 'https://groups.google.com/forum/#!forum/pathway-commons-help' }, ' Factoid help forum')
          ])
        ])
      ])
    ]);
  }
}

module.exports = Home;
