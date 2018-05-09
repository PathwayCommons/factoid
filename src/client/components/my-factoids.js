const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const { Component } = require('react');


class MyFactoids extends Component {
  render(){
    let factoids = this.props.factoids.map(factoid => {
      return h('div.factoid-entry', [
        h(Link, {
          className: 'plain-link',
          to: `/document/${factoid.id}/${factoid.secret}`
        },
          factoid.name === '' ? 'Untitled document' : factoid.name)
      ]);
    });

    let content = h('div.factoid-list', [
      h('div', [
        h('h2.my-factoids-title', 'My Factoids'),
        ...factoids

      ])
    ]);

    return h('div.my-factoids', [
      content
    ]);
  }
}

module.exports = MyFactoids;