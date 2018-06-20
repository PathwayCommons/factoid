const DirtyComponent = require('./dirty-component');
const _ = require('lodash');

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

module.exports = DataComponent;
