let React = require('react');

class DirtyComponent extends React.Component {
  constructor( props ){
    super( props );

    this.state = { dirty: true };
  }

  componentDidMount(){
    this.state.mounted = true;
  }

  componentWillUnmount(){
    this.state.mounted = false;
  }

  shouldComponentUpdate( nextProps, nextState ){
    return nextState.dirty;
  }

  dirty(){
    if( this.state.mounted ){
      this.setState({ dirty: true });
    }
  }

  clean(){
    if( this.state.mounted ){
      this.setState({ dirty: false });
    }
  }

  render( output ){
    this.state.dirty = false;

    return output;
  }
}

module.exports = DirtyComponent;
