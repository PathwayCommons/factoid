let clientDefs = require('../../../defs');

module.exports = Object.freeze({
  padding: 50,
  minZoom: 0.05,
  maxZoom: 3,
  layoutAnimationDuration: clientDefs.updateDelay * 2/3,
  layoutAnimationEasing: 'ease-in-out-quint', // spring(500, 35)
  positionDebounceTime: clientDefs.updateDelay,
  docPositionDebounceTime: 0,
  positionAnimationDuration: clientDefs.updateDelay / 2,
  positionAnimationEasing: 'ease-in-out-quint', // spring(500, 35)
  addRmAnimationDuration: clientDefs.updateDelay / 3,
  addRmAnimationEasing: 'linear',
  editAnimationDuration: clientDefs.editAnimationDuration,
  editAnimationEasing: 'linear',
  editAnimationColor: 'rgb(255, 255, 0)',
  editAnimationOpacity: 0.5,
  defaultColor: '#666',
  activeColor: '#0169d9',
  labelColor: '#fff',
  nodeSize: 30,
  interactionNodeSize: 10
});
