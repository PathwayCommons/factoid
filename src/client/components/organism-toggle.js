const h = require('react-hyperscript');
const Toggle = require('./toggle');
const Tooltip = require('./popover/tooltip');
const React = require('react');

class OrganismToggle extends React.Component {
  render(){
    let { organism, getState, onToggle } = this.props;

    return h(Tooltip, { description: organism.name() }, [
      h(Toggle, { className: 'organism-toggle plain-button', getState, onToggle },[
        h('span.organism-toggle-icon', [
          h('i', { className: organism.icon() })
        ])
      ])
    ]);
  }
}

module.exports = OrganismToggle;
