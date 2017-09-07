const { BrowserRouter, Route, Redirect } = require('react-router-dom');
const h = require('react-hyperscript');
const _ = require('lodash');
const uuid = require('uuid');

const Editor = require('./components/editor');
const Home = require('./components/home');
const DocumentFiller = require('./components/document-filler');


let routes = [
  {
    path: '/',
    render: () => {
      return h(Home);
    }
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
    path: '/new-document/fill',
    render: () => {
      return h('div.document-filler-page', [
        h( DocumentFiller )
      ]);
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
