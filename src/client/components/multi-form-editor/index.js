
const React = require('react');
const h = require('react-hyperscript');
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');
const { Link } = require('react-router-dom');


const Editor = require('../editor');
const SubmitPage = require('./submit-page');

class Context extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      interactions: []
    };
  }

  addInteractionForm() {
    this.setState({
      interactions: [...this.state.interactions, {
        entity0: '?',
        interaction: 'binds',
        entity1: '?'
      }]
    });
  }

  render() {
    const interactions = this.state.interactions.map(interaction => h('div.interaction', [
      h('div', interaction.entity0),
      h('div', interaction.interaction),
      h('div', interaction.entity1)
    ]));
    return (
      h('div.editor-context', [
        h('div.site-logo', [
          h('i.icon.icon-logo.home-logo-icon'),
          ' Factoid'
        ]),
        h('div.interactions', [
          ...interactions,
          h('button', {onClick: e => this.addInteractionForm()}, 'New Form Entry')
        ]),
      ])
    );
  }
}


class MFE extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      doc: null,
      loaded: false
    };
  }

  propogateModel(doc) {
    this.setState({
      doc: doc,
      loaded: true
    });
  }
  render() {
        return (
      h('div.multi-form-editor', [
        h(Context),
        h('div.editor-content', [
          h(Tabs, [
            h(TabList, { className: 'editor-toolbar' }, [
              h(Tab, [h('div', 'Graph view tab')]),
              h(Tab, [h('div', 'Form view tab')]),
              h(Tab, [h('div', 'Free Text entry view tab')])
            ]),
            h(TabPanel, { className: 'editor-view-panel' }, [
              h(Editor, {
                id: this.props.id,
                secret: this.props.secret,
                propogateModel: (doc) => this.propogateModel(doc)
              })
            ]),
            h(TabPanel, [
              h('div.form-view-panel', [
                'form view'
              ])
            ]),
            h(TabPanel,[
              h('div.text-entry-view-panel', [
                'text entry view'
              ])
            ])
          ]),
          h('div.editor-stepper', [
            h('div', 'edit step 1'),
            h('div', 'edit step 2'),
            h('div', 'edit step 3'),
            h('div', [
              h(Link, { className: 'editor-submit', to: `/submit/${this.props.id}/${this.props.secret}`}, 'submit')
            ])
          ])
        ])
      ])
    );
  }
}


module.exports = {MFE};
