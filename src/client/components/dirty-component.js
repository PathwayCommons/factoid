let React = require('React');
let _ = require('lodash');

class DirtyComponent extends React.Component {
  constructor( props ){
    super( props );

    this.state = _.assign( this.state || {}, {
      dirty: true
    } );
  }

  shouldComponentUpdate( nextProps, nextState ){
    return nextState.dirty;
  }

  dirty(){
    this.setState({ dirty: true });
  }

  clean(){
    this.setState({ dirty: false });
  }

  render( output ){
    this.clean();

    return output;
  }
}

module.exports = DirtyComponent;
