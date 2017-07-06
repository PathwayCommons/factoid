let { BrowserRouter, Route, Redirect } = require('react-router-dom');
let h = require('react-hyperscript');
let _ = require('lodash');
let uuid = require('uuid');

let Editor = require('./components/editor');

let App = () => (
  h('div', 'Factoid')
);

let routes = [
  {
    path: '/',
    component: App
  },
  {
    path: '/new-document',
    render: () => {
      let id = uuid();
      let secret = uuid();

      return h( Redirect, {
        to: {
          pathname: `/document/${id}/${secret}`
        }
      } );
    }
  },
  {
    path: '/document/:id',
    render: props => {
      let params = props.match.params;

      return h( Editor, {
        id: params.id
      } );
    }
  },
  {
    path: '/document/:id/:secret',
    render: props => {
      let params = props.match.params;

      return h( Editor, {
        id: params.id,
        secret: params.secret
      } );
    }
  }
].map( spec => {
  spec = _.defaults( spec, {
    exact: true
  } );

  return h( Route, spec );
} );

module.exports = () => (
  h( BrowserRouter, [
    h( 'div', routes )
  ] )
);
