import h from 'react-hyperscript';
import Highlighter from '../highlighter';
import Formula from './chemical-formula';
import Tooltip from '../popover/tooltip';

const { UNIPROT_LINK_BASE_URL, PUBCHEM_LINK_BASE_URL, NCBI_LINK_BASE_URL, CHEBI_LINK_BASE_URL, PUBMED_LINK_BASE_URL } = require('../../../config');

let protein = (m, searchTerms, includeOrganism = true) => {
  return [
    includeOrganism ? h('div.entity-info-section', [
      h('span.entity-info-title', 'Organism'),
      h('span', m.organismName)
    ]) : null,
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
    ]),
    h('div.entity-info-section', !m.shortSynonyms ? [] : [
      h('span.entity-info-title', 'Synonyms'),
      ...m.shortSynonyms.map( name => h('span.entity-info-alt-name', [
        h(Highlighter, { text: name, terms: searchTerms })
      ])),
      m.shortSynonyms.length === 0 ? '-' : ''
    ])
  ];
};

let ggp = protein;
let dna = protein;
let rna = protein;

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

let complex = (m) => {
  let getName = name => name ? name : 'Incomplete gene or chemical';

  return [
    h('div.entity-info-section', [
      h('span.entity-info-title', 'Components'),
      h('span', m.entityNames.map(getName).join('; '))
    ])
  ];
};

let link = m => {
  let url, nsName;

  switch( m.namespace ){
    case 'uniprot':
      url = UNIPROT_LINK_BASE_URL + m.id;
      nsName = 'UniProt';
      break;
    case 'pubchem':
      url = PUBCHEM_LINK_BASE_URL + m.id;
      nsName = 'PubChem';
      break;
    case 'chebi':
      url = CHEBI_LINK_BASE_URL + m.id;
      nsName = 'CHEBI';
      break;
    case 'ncbi':
      url = NCBI_LINK_BASE_URL + m.id;
      nsName = 'NCBI';
      break;
    case 'intn':
      url = PUBMED_LINK_BASE_URL + m.id
      nsName = 'PUBMED';
      break;
  }

  let entry = (url, text) => h('a.plain-link.entity-info-linkout', { href: url, target: '_blank' }, [
    text + ' ',
    h('i.material-icons', 'open_in_new')
  ]);

  return h('div.entity-info-section.entity-info-linkouts', [
    h('span.entity-info-title', 'More information'),
    entry(url, nsName)
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

export const assocDisp = { ggp, dna, rna, protein, modification, chemical, complex, link };

export default assocDisp;