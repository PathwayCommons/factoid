const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const { Component } = require('react');
const AnchorLink = require('react-anchor-link-smooth-scroll').default;

class Home extends Component {
  render(){
    return h('div.home', [
      h('section.hero', [
        h('div.page-content', [
          h('header.nav-bar', [
            h('div'),
            h('div.nav-bar-links', [
              h('div.nav-bar-link', [
                h(AnchorLink, { href: '#about' }, 'About')
              ]),
              h('div.nav-bar-link', [
                h(AnchorLink, { href: '#how' }, 'How it Works')
              ]),
              h('div.nav-bar-link', [
                h(AnchorLink, { href: '#credits' }, 'Team')
              ]),
              h('div.nav-bar-link', [
                h(AnchorLink, { href: '#contact' }, 'Contact')
              ])
            ])
          ]),
          h('div.hero-title-container#about', [
            h('div.hero-title', 'Factoid')
          ]),
          h('div.hero-subtitle', 'SHARE YOUR PATHWAY WITH THE WORLD'),
          h('div.hero-description', 'Publishing and getting your research noticed is essential. Factoid helps you increase the visibility of your publications by linking your research to pathways.'),
          h('div.hero-buttons', [
            h(Link, { to: '/example-document'}, [
              h('button.hero-button', 'TRY FACTOID'),
            ])
          ])
        ])
      ]),
      // h('section.home-section#what', [
      //   h('div.page-content', [
      //     h('div.infographic-container', [ h('span.home-infographic') ])
      //   ])
      // ]),
      h('section.home-section#why', [
        h('div.page-content', [
          h('h2.section-title', 'Our Mission'),
          h('h2', 'Make Biological Pathways in Research Articles Easy to Find and Access'),
          h('p', 'Factoid is a app that helps authors describe the genes and interactions for a pathway in their manuscript. Factoid guides authors through the steps for generating a computer-readable record of a pathway that is otherwise only available by reading an article’s text and figures.'),
          h('p', 'Factoid raises awareness about individual and original research articles by helping authors share accurate pathway data with the researcher community.'),
        ])
      ]),
      h('section.home-section#how', [
        h('div.page-content', [
          h('h2.section-title', 'How it Works'),
          h('div.infographic-container', [ h('span.how-it-works') ])
        ])
      ]),
      h('section.home-section#why-biologists', [
        h('div.page-content', [
          h('h2.section-title', 'For Authors'),
          h('h2', 'Put Your Research Where People Can Find It'),
          h('p', 'Your publication is the culmination of a tremendous persistent effort spanning many years. Traditional methods dictate that your research will only be discoverable via search engine with a specific set of keywords. Using Factoid will increase the number of ways that people can access your research.'),
          h('p', 'Research colleagues will be able to discover pathways captured from Factoid with the underlying evidence from your research. Personally generating this data from your research ensures that it remains credible to your colleagues.')
        ])
      ]),
      h('section.home-section#why-publishers', [
        h('div.page-content', [
          h('h2.section-title', 'For Journals'),
          h('h2', 'Enhance Your Content And Increase Your Reach'),
          h('p', 'Your content contains key biological knowledge that readers need to stay on top of their field and push their research in novel directions. Increase the value that you bring to your readers with Factoid.'),
          h('p', 'Factoid brings your content to the fore with enhanced articles using cutting edge technology.'),
          h('p', 'Foster deep connections with the researchers you work with by embedding article content within the pathway information they access for their day-to-day research.'),
          h('p', 'Integrating Factoid in your manuscript workflow is simple and lightweight.  Providing you with a plethora of benefits for minimal investment.'),
          h('div.how-it-works-detailed'),
          h('h2', 'Crowd-sourcing Pathway Knowledge Curation'),
          h('p', 'Pathway knowledge is an invaluable resource for studying diseases and making scientific discoveries at the cellular level. However, there is a tremendous cost and effort required to curate and maintain this knowledge.'),
          h('p', 'Factoid aims to make this process more efficient and less costly by crowdsourcing knowledge:'),
          h('ul', [
            h('p', '- From the original source (authors)'),
            h('p', '- At the ideal time (when manuscripts are being reviewed, when authors knowledge of the subject is most present')
          ]),
          h('p', `Factoid is aiming to provide a simple and scalable solution addressing the important pain points related to pathway data curation, allowing publishers to provide accurate and useful data to readers.`)
        ])
      ]),
      h('section.home-section#credits', [
        h('div.page-content.team', [
          h('h2.section-title', 'Team'),
          h('p', [
            h('a.plain-link', { href: 'https://baderlab.org' }, 'Bader Lab @ The University of Toronto')
          ]),
          h('p', [
            h('a.plain-link', { href: 'http://sanderlab.org' }, 'Sander Lab @ The Dana-Farber Cancer Institute and Harvard Medical School')
          ]),
          h('p', [
            h('a.plain-link', { href: 'https://ohsu.pure.elsevier.com/en/persons/emek-demir' }, 'Pathway and Omics Lab @ The Oregon Health and Science University')
          ])
        ])
      ]),
      h('section.home-section#contact', [
        h('div.page-content.contact', [
          h('h2.section-title', 'Contact'),
          h('p', [
            h('span', 'Please send all inquiries to'),
            h('a.plain-link', { href: 'mailto:pathway-commons-help@googlegroups.com' }, ' pathway-commons-help@googlegroups.com.')
          ])
        ])
      ])
    ]);
  }
}

module.exports = Home;
