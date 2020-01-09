import DirtyComponent from './dirty-component';
import _ from 'lodash';

class DataComponent extends DirtyComponent {
  constructor(props){
    super(props);

    this.data = {};
  }

  setData( name, value, callback ){
    if( _.isObject(name) ){
      callback = value;

      _.assign( this.data, name );
    } else {
      this.data[ name ] = value;
    }

    this.dirty( callback );
  }
}

export default DataComponent;
