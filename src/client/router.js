const { BrowserRouter, Route, Redirect, Switch } = require('react-router-dom');
const h = require('react-hyperscript');
const _ = require('lodash');
const uuid = require('uuid');

const PageNotFound = require('./components/page-not-found');
const Editor = require('./components/editor');
const FormEditor = require('./components/form-editor');
const Home = require('./components/home');
const Debug = require('./components/debug');
const DebugDocumentSeeder = require('./components/debug-document-seeder');
const ExampleDocument = require('./components/example-document');
const DocumentSeeder = require('./components/document-seeder');
const DocumentViewChooser = require('./components/document-view-chooser');


let routes = [
  {
    path: '/',
    render: () => {
      return h(Home);
    }
  },
  {
    path: '/new',
    render: () => {
      return h( Redirect, {
        to: {
          pathname: `/new/seed`
        }
      } );
    }
  },
  {
    path: '/new/seed',
    render: props => {
      let { history } = props;

      return h( DocumentSeeder, { history } );
    }
  },
  {
    path: '/new/choice/:id/:secret',
    render: props => {
      let { id, secret } = props.match.params;
      let { history } = props;

      return h( DocumentViewChooser, { id, secret, history } );
    }
  },
  {
    path: '/debug',
    render: () => {
      return h(Debug);
    }
  },
  {
    path: '/example-document',
    render: props => {
      return h( ExampleDocument, props );
    }
  },
  {
    path: '/debug/new-document',
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
    path: '/debug/new-document/seed',
    render: () => {
      return h( DebugDocumentSeeder );
    }
  },
  {
    path: '/form/:id',
    render: props => {
      let params = props.match.params;

      return h( FormEditor, {
        id: params.id
      } );
    }
  },
  {
    path: '/form/:id/:secret',
    render: props => {
      let params = props.match.params;

      return h( FormEditor, {
        id: params.id,
        secret: params.secret
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
  },
  {
    render: () => {
      return h( PageNotFound );
    },
    status: 404
  }
].map( spec => {
  spec = _.defaults( spec, {
    exact: true
  } );

  return h( Route, spec );
} );

module.exports = () => (
  h( BrowserRouter, [
    h( Switch, routes )
  ] )
);
