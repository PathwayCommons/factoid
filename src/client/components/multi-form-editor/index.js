
const React = require('react');
const h = require('react-hyperscript');
const MultiStep = require('react-stepzilla').default;
const { Tab, Tabs, TabList, TabPanel } = require('react-tabs');


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
          h('button', {onClick: e => this.addInteractionForm()}, 'New Interaction')
        ]),
      ])
    );
  }
}


class MFE0 extends React.Component {
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
              h(Editor, this.props)
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
            h('div', 'button previous'),
            h('div', 'edit step 1'),
            h('div', 'edit step 2'),
            h('div', 'edit step 3'),
            h('div', 'button next')
          ])
        ])
      ])
    );
  }
}

class MFE1 extends React.Component {
  render() {
    return (
      h('div.multi-form-editor', [
        h('div.editor-content', [
          h(Tabs, [
            h(TabList, { className: 'editor-toolbar' }, [
              h(Tab, [h('div', 'Graph view tab')]),
              h(Tab, [h('div', 'Form view tab')]),
              h(Tab, [h('div', 'Free Text entry view tab')])
            ]),
            h(TabPanel, { className: 'editor-view-panel' }, [
              h(Editor, this.props)
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
            h('div', 'button previous'),
            h('div', 'edit step 1'),
            h('div', 'edit step 2'),
            h('div', 'edit step 3'),
            h('div', 'button next')
          ])
        ]),
        h(Context)
      ])
    );
  }
}


class MFE2 extends React.Component {
  render() {
    return (
      h('div.multi-form-editor', [
        h('div.editor-context', [
          h('div.site-logo', [
            h('i.icon.icon-logo.home-logo-icon'),
            ' Factoid'
          ])
        ]),
        h('div.editor-content', [
          h(Tabs, [
            h(TabList, { className: 'editor-toolbar' }, [
              h(Tab, [h('div', 'Graph view tab')]),
              h(Tab, [h('div', 'Form view tab')]),
              h(Tab, [h('div', 'Free Text entry view tab')])
            ]),
            h(TabPanel, { className: 'editor-view-panel' }, [
              h(Editor, this.props)
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
            h('div', 'button previous'),
            h('div', 'edit step 1'),
            h('div', 'edit step 2'),
            h('div', 'edit step 3'),
            h('div', 'button next')
          ])
        ])
      ])
    );
  }
}

module.exports = {MFE0, MFE1, MFE2};
