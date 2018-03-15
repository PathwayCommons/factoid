const { Component } = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { makeClassList } = require('../../util');
const Promise = require('bluebird');

class DocumentWizardStepper extends Component {
  constructor(props){
    super( props );

    this.state = {};
  }

  componentDidMount(){
  this._mounted = true;
}

  componentWillUnmount(){
    this._mounted = false;
  }

  render(){
    let p = _.assign({
      back: _.noop,
      forward: _.noop,
      backEnabled: true,
      forwardEnabled: true
    }, this.props);

    let { back, forward, backEnabled, forwardEnabled } = p;

    let go = (handler, flag) => {
      this.setState({ [flag]: true });

      return Promise.try( handler ).then( () => {
        if( this._mounted ){
          this.setState({ [flag]: false });
        }
      } );
    };

    return h('div.document-wizard-stepper', [
      h('div.document-wizard-stepper-back', [
        h('button.document-wizard-stepper-back-button', {
          onClick: () => go( back, 'goingBack' ),
          disabled: !backEnabled || this.state.goingBack,
          className: makeClassList({ 'document-wizard-stepper-button-enabled': backEnabled })
        }, [
          h('i.material-icons', 'arrow_back')
        ]),
        h('span.icon.icon-spinner.document-wizard-stepper-back-spinner', {
          className: makeClassList({
            'document-wizard-stepper-spinner-going': this.state.goingBack
          })
        })
      ]),
      h('div.document-wizard-stepper-forward', [
        h('span.icon.icon-spinner.document-wizard-stepper-forward-spinner', {
          className: makeClassList({
            'document-wizard-stepper-spinner-going': this.state.goingForward
          })
        }),
        h('button.document-wizard-stepper-forward-button', {
          onClick: () => go( forward, 'goingForward' ),
          disabled: !forwardEnabled || this.state.goingForward,
          className: makeClassList({ 'document-wizard-stepper-button-enabled': forwardEnabled })
        }, [
          h('i.material-icons', 'arrow_forward')
        ])
      ])
    ]);
  }
}

module.exports = DocumentWizardStepper;
