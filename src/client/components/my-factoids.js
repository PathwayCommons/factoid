const h = require('react-hyperscript');
const { Component } = require('react');


class MyFactoids extends Component {
  render(){
    let factoids = JSON.parse(localStorage.getItem('my-factoids')) || [];

    return h('div.my-factoids', [
      h('h3.my-factoids-title', 'My factoids'),

       ...factoids.map(factoid => {
        return h('div.my-factoids-entry', [
          h('a', {
            className: 'plain-link',
            href: `/document/${factoid.id}/${factoid.secret}`,
            target: '_blank'
          },
            factoid.name === '' ? 'Untitled document' : factoid.name)
        ]);
      }),

      factoids.length === 0 ? h('div.my-factoids-empty', 'You have no previously viewed Factoids.') : null,

      h('button.my-factoids-clear', {
        onClick: () => this.clear()
      }, [
        h('span', 'Clear my factoids list')
      ])
    ]);
  }

  clear(){
    localStorage.setItem('my-factoids', JSON.stringify([]));

    this.setState({ clearTime: Date.now() });
  }
}

module.exports = MyFactoids;