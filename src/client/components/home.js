const h = require('react-hyperscript');
const { Component } = require('react');

class Home extends Component {
  render(){
    return h('div.home', [
      h('section.hero', [
        h('div.page-content', [
          h('header.nav-bar', [
            h('div'),
            h('div.nav-bar-links', [
              // disable contact for now...
              // h('a.plain-link', { href: 'mailto:support@biofactoid.org' }, ' support@biofactoid.org')
            ])
          ]),
          h('div.hero-title-container#about', [
            h('div.hero-title', 'Factoid')
          ]),
          h('div.hero-subtitle', 'Smart figures for your papers'),
          h('div.hero-description', 'Capture your biological interactions in a shareable, collaborative, interactive figure.')
        ])
      ]),
      h('section.home-section#why', [
        h('div.page-content', [
          h('h2.section-title', 'Our mission'),
          h('h2', 'Make the findings in your article easy to discover'),
          h('p', `Your figure can be discovered and explored by other researchers, because it's smart:  It's more than just a picture.   What other papers mention my gene?  What other papers mention a particular interaction?   What other papers are related to my research?    Factoid gives you that.`)
        ])
      ]),
      h('section.home-section#why-biologists', [
        h('div.page-content', [
          h('h2.section-title', 'For authors'),
          h('h2', 'Put your research where people can find it'),
          h('p', 'Your publication is the culmination of a tremendous persistent effort spanning many years. Traditional methods dictate that your research will only be discoverable via search engine with a specific set of keywords. Using Factoid will increase the number of ways that people can access your research.')
        ])
      ]),
      h('section.home-section#why-publishers', [
        h('div.page-content', [
          h('h2.section-title', 'For journals'),
          h('h2', 'Enhance your content and increase your reach'),
          h('p', 'Factoid brings your content to the fore by making it more discoverable and interactive.  Foster deep connections with the researchers you work with by embedding article content within the interaction information they access for their day-to-day research.'),
          h('p', 'Integrating Factoid in your manuscript workflow is simple and lightweight.  Providing you with a plethora of benefits for minimal investment.')        ])
      ]),
      h('section.home-section#credits', [
        h('div.page-content.credits', [
          h('span.credit', [
            h('a.plain-link', { href: 'https://baderlab.org' }, 'Bader Lab @ The University of Toronto')
          ]),
          h('span.credit', [
            h('a.plain-link', { href: 'http://sanderlab.org' }, 'Sander Lab @ The Dana-Farber Cancer Institute and Harvard Medical School')
          ]),
          h('span.credit', [
            h('a.plain-link', { href: 'https://ohsu.pure.elsevier.com/en/persons/emek-demir' }, 'Pathway and Omics Lab @ The Oregon Health and Science University')
          ])
        ])
      ])
    ]);
  }
}

module.exports = Home;
