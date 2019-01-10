const BIOPAX_TEMPLATE_TYPE = Object.freeze({
  //case: 1 (intn. type: Binding)
  MOLECULAR_INTERACTION: 'Molecular Interaction',
  // case: 2 (TranscriptionTranslation)
  EXPRESSION_REGULATION: 'Expression Regulation',
  //case: 3 (Modification affects active/inactive state, possibly via e.g. ubiquitination)
  PROTEIN_CONTROLS_STATE: 'Protein Controls State',
  //case: 4A-E; biopax converter results are based on the ent. types, order, sign.
  OTHER_INTERACTION: 'Other Interaction',
});

const BIOPAX_CONTROL_TYPE = Object.freeze({
  INHIBITION: 'inhibition',
  ACTIVATION: 'activation'
});

module.exports = { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE };
