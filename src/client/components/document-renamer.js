const h = require('react-hyperscript');
const { Component } = require('react');

class DocumentRenamer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      docName: props.document.name()
    };
  }

  updateDocName(newVal){
    this.props.document.name(newVal);
    this.setState({
      docName: newVal
    });
  }

  getText(){
    return this.state.docName || this.props.document.name();
  }

  render(){
    return h('input.doc-name', {
      type: 'text',
      placeholder: 'Untitled document',
      value:  this.getText(),
      onChange: e => this.updateDocName(e.target.value)
    });

  }
}

module.exports = DocumentRenamer;