const Promise = require('bluebird');

module.exports = {
  get: function(){
    return Promise.resolve({
      elements: [],
      organisms: []
    });
  }
};
