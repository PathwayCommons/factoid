const DataComponent = require('../data-component');
const _ = require('lodash');
const h = require('react-hyperscript');
const ElementInfo = require('../element-info/element-info');

const { makeClassList } = require('../../../util');


class EntityForm extends DataComponent {
  constructor(props){
    super(props);
    this.data = _.assign( {
      show: false
    }, props );
  }

  toggleInfo(){
    this.setData({ show: !this.data.show });
  }

  render(){
    let { entity, placeholder, document, show } = this.data;

    return  h('div.entity-form', [
      h('input[type="button"].entity-form-input', {
        value: entity && entity.name(),
        placeholder,
        readOnly: true,
        onClick: () => this.toggleInfo()
      }),
      h('div.entity-form-info-overlay', {
        className: makeClassList({ 'entity-form-overlay-show': show }),
        onClick: () => this.toggleInfo()
      }),
      h('div.entity-form-info', { className: makeClassList({ 'entity-form-info-show': show })}, [
        h(ElementInfo, { element: entity, document })
      ])
    ]);
  }
}

module.exports = EntityForm;

