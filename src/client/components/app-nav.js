const React = require('react');
const h = require('react-hyperscript');

class AppNav extends React.Component {
  render(){
    let { document, history, networkEditor } = this.props;
    return h('div.editor-more-menu', [
      h('div.editor-more-menu-items', [
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
          onClick: () => {
            let id = document.id();
            let secret = document.secret();

            let root = networkEditor ? 'form' : 'document';

            if( document.editable() ){
              history.push(`/${root}/${id}/${secret}`);
            } else {
              history.push(`/${root}/${id}`);
            }
          }
        }, [
          h('span', ` ${networkEditor ? 'Form-based' : 'Network'} editor`)
        ]),
        h('button.editor-more-button.plain-button', {
          onClick: () => history.push('/')
        }, [
          h('span', ' About & contact')
        ])
      ])
    ]);
  }
}

module.exports = AppNav;
