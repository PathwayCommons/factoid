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

  render(){
    const p = this.props;
    return h('input.doc-name', {
      type: 'text',
      placeholder: 'Untitled document',
      value:  this.state.docName || p.document.name(),
      onChange: e => this.updateDocName(e.target.value)
    });

  }
}

module.exports = DocumentRenamer;