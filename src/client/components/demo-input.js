const { Component } = require('react');
const h = require('react-hyperscript');
const { makeClassList, tryPromise } = require('../../util');
const Tooltip = require('./popover/tooltip');

const EXAMPLE_TEXT = `Upon detection of DNA damage, the ATM kinase mediates the phosphorylation of the Mdm2 protein to block its interaction with p53. The p53 protein activates the transcription of cyclin-dependent kinase inhibitor, p21. p21 inactivates the CCNE1:Cdk2 complex.`;

class DemoInput extends Component {
  constructor(props){
    super(props);

    this.state = {
      text: ''
    };
  }

  updateText(newText, cb){
    this.setState({ text: newText }, cb);
  }

  submit(){
    let { text } = this.state;
    let title = 'Demo';

    let makeRequest = () => fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text, title })
    }).then( res => res.json() );

    let redirect = docJson => {
      let { history } = this.props;

      history.push( docJson.privateUrl );
    };

    let passthrough = fn => {
      return input => {
        fn();

        return input;
      };
    };

    let loading = passthrough(() => this.setState({ loading: true }));
    let notLoading = passthrough(() => this.setState({ loading: false }));

    return tryPromise( loading ).then( makeRequest ).then( notLoading ).then( redirect );
  }

  render(){
    return  h('div.demoin', [
      h('div.demoin-header', [
        h('h3.demoin-title', 'Abstract'),
        h(Tooltip, { description: 'Use an example abstract' }, [
          h('a.plain-link.demoin-example', {
            className: makeClassList({
              'demoin-example-shown': this.state.text === ''
            }),
            onClick: () => this.updateText(EXAMPLE_TEXT)
          }, 'e.g.')
        ])
      ]),
      h('textarea.demoin-text', {
        placeholder: 'The abstract of your paper',
        onChange: e => this.updateText(e.target.value),
        value: this.state.text
      }),
      h('div.demoin-footer', [
        this.state.loading ? h('i.demoin-loader.icon.icon-spinner') : null,
        h('button.demoin-submit', {
          onClick: () => this.submit()
        }, 'Open Factoid')
      ])
    ]);
  }
}

module.exports = DemoInput;