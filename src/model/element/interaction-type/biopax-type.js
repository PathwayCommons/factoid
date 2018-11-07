// TODO BIOPAX

const BIOPAX_TEMPLATE_TYPE = Object.freeze({
  PROTEIN_CONTROLS_STATE: 'Protein Controls State',
  CHEMICAL_AFFECTS_STATE: 'Chemical Affects State',
  EXPRESSION_REGULATION: 'Expression Regulation',
  MOLECULAR_INTERACTION: 'Molecular Interaction',
  PROTEIN_MODIFICATION: 'Protein Modification',
  PROTEIN_CONTROLS_CONSUMPTION: 'Protein Controls Consumption',
  PROTEIN_CONTROLS_PRODUCTION: 'Protein Controls Production'
});

const BIOPAX_CONTROL_TYPE = Object.freeze({
  INHIBITION: 'inhibition',
  ACTIVATION: 'activation'
});

module.exports = { BIOPAX_TEMPLATE_TYPE, BIOPAX_CONTROL_TYPE };
