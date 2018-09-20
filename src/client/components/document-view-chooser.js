const React = require('react');
const h = require('react-hyperscript');

const AppNav = require('./app-nav');
const Popover = require('./popover/popover');
const Tooltip = require('./popover/tooltip');

class DocumentViewChooser extends React.Component {
  goToSeeder(){
    let { history } = this.props;

    history.go(-1);
  }

  goToEditor(editor){
    let { id, secret } = this.props;

    window.open(`/${editor}/${id}/${secret}`);
  }

  render(){
    return h('div.document-view-chooser.page-content', [
      h('div.view-choose-content', [
        h('h2.view-chooser-title', 'Choose Editor'),
        h('p', 'Your text has been converted into digital networks that now can be explored, modified and expanded through different editors.'),
        h('div.document-view-chooser-radios', [
          h('div.document-view-chooser-choice', { onClick: () => this.goToEditor('document') }, [
            h('div.network-choice'),
            h('h2', { htmlFor: 'document-view-chooser-network' }, 'Network Editor'),
            h('p', 'View and edit your document graphically using an intuitive network editor designed for ease of use.')
          ]),
          h('div.document-view-chooser-choice', { onClick: () => this.goToEditor('form') }, [
            h('div.form-choice'),
            h('h2', { htmlFor: 'document-view-chooser-form' }, 'Form Editor'),
            h('p', 'Add new types of interactions to your document with form template text entries.')
          ])
        ])
      ]),
      h('div.view-chooser-app-bar', [
        h('div.document-stepper-app-buttons', [
          h(Tooltip, { description: 'Home' }, [
            h('button.editor-button.plain-button', { onClick: () => history.push('/') }, [
              h('i.app-icon')
            ])
          ]),
          h(Popover, {
            tippy: {
              position: 'right',
              followCursor: false,
              html: h(AppNav, [
                h('button.editor-more-button.plain-button', {
                  onClick: () => history.push('/new')
                }, [
                  h('span', ' New factoid')
                ]),
                h('button.editor-more-button.plain-button', {
                  onClick: () => history.push('/documents')
                }, [
                  h('span', ' My factoids')
                ]),
                h('button.editor-more-button.plain-button', {
                  onClick: () => history.push('/')
                }, [
                  h('span', ' About & contact')
                ])
              ])
            }
            }, [
            h('button.editor-button.plain-button', [
              h('i.material-icons', 'more_vert')
            ])
          ])
        ])
      ])
    ]);
  }
}

module.exports = DocumentViewChooser;
