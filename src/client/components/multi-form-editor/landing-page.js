const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const React = require('react');

class LandingPage extends React.Component {
  render(){
    return h('div.landing-page', [
      h('div.landing-page-center', [
        h('div.landing-page-intro-row', [
          h('i.landing-page-icon'),
          h('div', [
            h('h1.landing-page-into-header', 'Factoid'),
            h('p.landing-page-intro-desc', 'A project to digitally capture biological data from academic papers')
          ])
        ]),
        h('div.landing-page-mode-links', [
          h('span.landing-page-mode-link', [ h(Link, { className: 'plain-link', to: '/debug/new-document' }, 'Create new, blank document') ]),
          h('span.landing-page-mode-link-seperator', '-'),
          h('span.landing-page-mode-link', [ h(Link, { className: 'plain-link', to: '/debug/new-document/fill' }, 'Create new document, filled from text') ])
        ])
      ]),
      h('div.landing-page-footer', [
        h('div.landing-page-section', [
          h('span', 'Factoid is a new bioinformatics technology designed to increase impact of papers by making the genes and interactions that are described by the users easier for others to discover and reuse.'),

          h('p'),

          h('span', 'Factoid utilizes '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://agathon.sista.arizona.edu:8080/odinweb/', target: '_blank' }, 'REACH') ]),
          h('span', ' for extraction of the biomedical information and '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://js.cytoscape.org/', target: '_blank' }, 'Cytoscape.js') ]),
          h('span', ' for network visualization while making use of biological databases such as '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.pathwaycommons.org/pc2/', target: '_blank' }, 'Pathway Commons') ]),
          h('span', ' and '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.uniprot.org/uniprot/', target: '_blank' }, 'Uniprot') ]),
          h('span', '.'),

          h('p'),

          h('span', 'Factoid is being developed by Gary Bader, Max Franz, Dylan Fong, Jeffrey Wong of the '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://baderlab.org/', target: '_blank' }, 'Bader Lab') ]),
          h('span', ' at the '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'https://www.utoronto.ca/', target: '_blank' }, 'University of Toronto') ]),
          h('span', ', Chris Sander, Christian Dallago, Augustin Luna of the '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.sanderlab.org/', target: '_blank' }, 'Sander Lab') ]),
          h('span', ' at the '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.dana-farber.org/', target: '_blank' }, 'Dana-Farber Cancer Institute') ]),
          h('span', ' and '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://hms.harvard.edu/', target: '_blank' }, 'Harvard Medical School') ]),
          h('span', ' and Emek Demir, Funda Durupinar Babur, David Servillo, Metin Can Siper of the Pathways and Omics Lab at '),
          h('span', [ h('a', { className: 'landing-page-link', href: 'http://www.ohsu.edu/', target: '_blank' }, 'Oregon Health & Science University') ]),
          h('span', '.'),

          h('p'),

          h('a', { className: 'landing-page-link', href: 'https://github.com/PathwayCommons/factoid', target: '_blank' }, [
            h('i', { className: 'fa-github fa fa-2x' })
          ])
        ]),

      ])
    ]);
  }
}

module.exports = LandingPage;
