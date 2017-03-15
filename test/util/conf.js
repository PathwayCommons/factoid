let Promise = require('bluebird');

Promise.config({
  warnings: true,
  longStackTraces: true
});

module.exports = {
  defaultTimeout: 5000
};
