const h = require('react-hyperscript');
const { Link } = require('react-router-dom');
const { Component } = require('react');

const EXAMPLE_TEXT = `Under normal conditions, p53 is a short-lived protein. The MDM2 protein, usually interacts with p53, and by virtue of its E3 ubiquitin ligase activity, mediates its degradation by the ubiquitin-proteasome machinery. Upon detection of DNA damage, the ATM kinase mediates the phosphorylation of the Mdm2 protein to block its interaction with p53. The p53 protein activates the transcription of cyclin-dependent kinase inhibitor, p21. p21 inactivates the CyclinE:Cdk2 complexes, which prevents entry into S-phase of the cell cycle.`;

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
