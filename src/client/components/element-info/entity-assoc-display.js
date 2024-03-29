import h from 'react-hyperscript';
import Highlighter from '../highlighter';
import Formula from './chemical-formula';
import Tooltip from '../popover/tooltip';

const { IDENTIFIERS_ORG_ID_BASE_URL } = require('../../../config');

let protein = (m, searchTerms, includeOrganism = true) => {
  return [
    m.summary ?
    h('div.entity-info-section', [
      h('span.entity-info-title', 'Summary'),
      h('span', m.summary)
    ]): null,
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
let namedComplex = protein;

let chemical = (m, searchTerms) => {
  return [
    m.summary ?
      h('div.entity-info-section', [
        h('span.entity-info-title', 'Summary'),
        h('span', m.summary)
      ]): null,
    m.shortSynonyms && m.shortSynonyms.length ?
      h('div.entity-info-section', [
        h('span.entity-info-title', 'Synonyms'),
        ...m.shortSynonyms.map( name => h('span.entity-info-alt-name', [
          h(Highlighter, { text: name, terms: searchTerms })
        ]))
      ]) : null,
    m.formulae && m.formulae.length ?
      h('div.entity-info-section', [
        h('span.entity-info-title', 'Formulae'),
        ...m.formulae.map( formula => h(Formula, { formula }) )
      ]) : null
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
  let label = m.dbName;
  let url = `${IDENTIFIERS_ORG_ID_BASE_URL}${m.dbPrefix}:${m.id}`;
  let entry = (url, text) => h('a.plain-link.entity-info-linkout', { href: url, target: '_blank' }, [
    text,
    // h('i.material-icons', 'open_in_new')
  ]);

  return h('div.entity-info-section.entity-info-linkouts', [
    h('span.entity-info-title', 'More information'),
    entry(url, label)
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

export const assocDisp = { ggp, dna, rna, protein, modification, chemical, complex, link, namedComplex };

export default assocDisp;