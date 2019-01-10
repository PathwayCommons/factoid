module.exports = {
  get: function(){
    return Promise.resolve({
      elements: [],
      organisms: []
    });
  }
};
