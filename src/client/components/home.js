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
          h('div.hero-subtitle', 'Uniting research'),
          h('div.hero-description', 'Add your research findings to a connected map of cellular networks that everyone can search, explore and link to your article.')
        ])
      ]),
      h('section.home-section#why', [
        h('div.page-content', [
          h('div.video-embed', [
            h('iframe.video-embed-iframe', {
              src: 'https://www.youtube.com/embed/HDW9AVYifxQ',
              frameBorder: 0,
              allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
              allowFullScreen: true
              })
          ])
        ])
      ]),
      h('section.home-section#why-biologists', [
        h('div.page-content', [
          h('h2.section-title', 'For authors'),
          h('h2', 'Put your research where people can find it'),
          h('p', 'Your paper contains text and figures crafted for readers which makes the knowledge within it difficult to access with a search engine or resuse directly. Factoid solves this problem by helping you create a digital summary of key interactions between genes. Researchers who access your interactions can easily link to your paper, making it more visible to the research community.')
        ])
      ]),
      h('section.home-section#why-publishers', [
        h('div.page-content', [
          h('h2.section-title', 'For journals'),
          h('h2', 'Enhance your content and increase your reach'),
          h('p', 'Factoid brings your content to the fore by making it more discoverable and interactive.  Foster deep connections with the researchers you work with by embedding article content within the interaction information they access for their day-to-day research.'),
          h('p', 'Integrating Factoid in your manuscript workflow is simple and lightweight.')])
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
