import DataComponent from '../data-component';
import _ from 'lodash';
import h from 'react-hyperscript';
import ElementInfo from '../element-info/element-info';

import { makeClassList } from '../../../util';

const dirtyEvents = ['rename', 'complete'];

class EntityForm extends DataComponent {
  constructor(props){
    super(props);

    this.data = _.assign( {
      show: false
    }, props );

    this.dirtyHandler = () => this.dirty();
  }

  componentDidMount(){
    dirtyEvents.forEach(e => this.data.entity.on(e, this.dirtyHandler));
  }

  componentWillUnmount(){
    dirtyEvents.forEach(e => this.data.entity.removeListener(e, this.dirtyHandler));
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
      entity.completed() ? h('i.material-icons.entity-form-completed-icon', 'check_circle') : null,
      h('div.entity-form-info-overlay', {
        className: makeClassList({ 'entity-form-overlay-show': show }),
        onClick: () => this.toggleInfo()
      }),
      show ? h('div.entity-form-info', { className: makeClassList({ 'entity-form-info-show': show })}, [
        h(ElementInfo, { element: entity, document })
      ]) : null
    ]);
  }
}

export default EntityForm;
