const h = require('react-hyperscript');
const { Component } = require('react');

const EXAMPLE_TEXT = `Upon detection of DNA damage, the ATM kinase mediates the phosphorylation of the Mdm2 protein to block its interaction with p53. The p53 protein activates the transcription of cyclin-dependent kinase inhibitor, p21. p21 inactivates the CCNE1:Cdk2 complex.`;

class ExampleDocument extends Component {
  constructor( props ){
    super( props );
  }

  componentDidMount(){
    let text = EXAMPLE_TEXT;

    let makeRequest = () => fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text })
    }).then( res => res.json() );

    let redirect = docJson => {
      let { history } = this.props;

      history.replace( docJson.privateUrl );
    };

    return makeRequest().then( redirect );
  }

  render(){
    return h('div.example-document', [
      h('span.icon.icon-spinner')
    ]);
  }
}

module.exports = ExampleDocument;
