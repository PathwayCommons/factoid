const dice = require('dice-coefficient'); // sorensen dice coeff

function stringDistanceMetric(a, b){
  return 1 - dice(a, b);
}

module.exports = { stringDistanceMetric };
