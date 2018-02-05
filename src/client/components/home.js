const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const { Component } = require('react');

class Home extends Component {
  render(){
    return h('div.home', [
      h('h1', [
        h('i.icon.icon-logo.home-logo-icon'),
        ' Factoid'
      ]),
      h('h3', 'Share your pathway with the world'),
      h('p', 'Biological pathways are invaluable tools that help researchers consider how cellular activities arise from interactions between multiple components. Unfortunately, most pathways are available only in ‘human-readable’ form within publications, which limits them from being easily shared and discovered. Factoid captures pathway knowledge in three easy steps:'),
      h('p', [ h('span.home-steps-figure') ]),
      h('ol', [
        h('li', 'The author first receives an email from Factoid, with a link to edit the Factoid document associated with the paper.  '),
        h('li', [
          h('span', 'Next, the author edits the document (e.g.'),
          h(Link, { className: 'plain-link', to: '/example-document' }, 'example document'),
          h('span', ').'),
        ]),
        h('li', 'The author then finalises the document, and the data is automatically sent to the journal.  ')
      ])
    ]);
  }
}

module.exports = Home;
