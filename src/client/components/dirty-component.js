let React = require('react');

class DirtyComponent extends React.Component {
  constructor( props ){
    super( props );

    this.state = { _dirtyTimestamp: 0 };
  }

  dirty( callback ){
    this.setState({ _dirtyTimestamp: Date.now() }, callback);
  }

  clean(){}

  render( content ){
    return content;
  }
}

module.exports = DirtyComponent;
