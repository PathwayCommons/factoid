const h = require('react-hyperscript');
const Organism = require('../../../model/organism');
const Highlighter = require('../highlighter');
const Formula = require('./chemical-formula');
const Tooltip = require('../popover/tooltip');
const { PC_LINK_BASE_URL } = require('../../../config');

const { UNIPROT_LINK_BASE_URL, PUBCHEM_LINK_BASE_URL } = require('../../../config');

let protein = (m, searchTerms) => {
  return [
    h('div.entity-info-section', [
      h('span.entity-info-title', 'Organism'),
      h('span', Organism.fromId(m.organism).name())
    ]),
    h('div.entity-info-section', !m.proteinNames ? [] : [
      h('span.entity-info-title', 'Protein names'),
      ...m.proteinNames.map( name => h('span.entity-info-alt-name', [
        h(Highlighter, { text: name, terms: searchTerms })
      ]))
    ]),
    h('div.entity-info-section', !m.geneNames ? [] : [
      h('span.entity-info-title', 'Gene names'),
      ...m.geneNames.map( name => h('span.entity-info-alt-name', [
        h(Highlighter, { text: name, terms: searchTerms })
      ]))
    ])
  ];
};

let chemical = (m, searchTerms) => {
  return [
    h('div.entity-info-section', [
      h('span.entity-info-title', 'Formulae'),
      ...m.formulae.map( formula => h(Formula, { formula }) )
    ]),
    h('div.entity-info-section', [
      h('span.entity-info-title', 'Mass'),
      h('span', m.mass)
    ]),
    h('div.entity-info-section', [
      h('span.entity-info-title', 'Charge'),
      h('span', m.charge)
    ]),
    h('div.entity-info-section', !m.shortSynonyms ? [] : [
      h('span.entity-info-title', 'Synonyms'),
      ...m.shortSynonyms.map( name => h('span.entity-info-alt-name', [
        h(Highlighter, { text: name, terms: searchTerms })
      ]))
    ])
  ];
};

let link = m => {
  let pcQ = encodeURIComponent(m.name);
  let pcUrl = `${PC_LINK_BASE_URL}${pcQ}`;
  let pcName = 'Pathway Commons';
  let url, nsName;

  switch( m.type ){
    case 'protein':
      url = UNIPROT_LINK_BASE_URL + m.id;
      nsName = 'UniProt';
      break;
    case 'chemical':
      url = PUBCHEM_LINK_BASE_URL + m.id;
      nsName = 'PubChem';
      break;
  }

  let entry = (url, text) => h('a.plain-link.entity-info-linkout', { href: url, target: '_blank' }, [
    text + ' ',
    h('i.material-icons', 'open_in_new')
  ]);

  return h('div.entity-info-section.entity-info-linkouts', [
    h('span.entity-info-title', 'More information'),
    entry(url, nsName),
    entry(pcUrl, pcName)
  ]);
};

let modification = (mod, onEdit) => h('div.entity-info-section.entity-info-mod-section', [
  h('span.entity-info-title', 'Modification'),
  h('span', mod.displayValue),
  h(Tooltip, { description: 'Edit the modification' }, [
    h('button.entity-info-edit-mod.plain-button', {
      onClick: () => onEdit()
    }, [
      h('i.material-icons', 'edit')
    ])
  ])
]);

module.exports = { protein, modification, chemical, link };
