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
      h('section.home-section#what', [
        h('div.page-content', [
          h('h2.section-title', 'What Problem Does Factoid Solve?'),
          h('div.infographic-container', [ h('span.home-infographic') ])
        ])
      ]),
      h('section.home-section#why', [
        h('div.page-content', [
          h('h2.section-title', 'Our Mission'),
          h('h2', 'Make Biological Pathways in Research Articles Easy to Find and Access'),
          h('p', 'Factoid is a app that helps authors describe the genes and interactions for a pathway in their manuscript. Factoid guides authors through the steps for generating a computer-readable record of a pathway that is otherwise only available by reading an article’s text and figures.'),
          h('p', 'Factoid raises awareness about individual and original research articles by helping authors share accurate pathway data with the researcher community.'),
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
