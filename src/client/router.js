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


let routes = [
  {
    path: '/',
    render: (props) => {
      return h(Home, { history: props.history });
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
    path: '/new/demo',
    render: props => {
      let { history } = props;

      return h( DocumentSeeder, { history, demo: true } );
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
    path: '/tech-demo',
    render: () => {
      return h( DebugDocumentSeeder, {
        title: 'Technical demo',
        description: 'Explore the technology behind Factoid in depth.',
        editorSectionText: 'Choose editor ',
        techDemo: true
      } );
    }
  },
  {
    path: '/form/:id',
    render: props => {
      let { id } = props.match.params;
      let { history } = props;

      return h( FormEditor, { id, history } );
    }
  },
  {
    path: '/form/:id/:secret',
    render: props => {
      let { id, secret } = props.match.params;
      let { history } = props;

      return h( FormEditor, { id, secret, history } );
    }
  },
  {
    path: '/document/:id',
    render: props => {
      let { id } = props.match.params;
      let { history } = props;

      return h( Editor, { id, history } );
    }
  },
  {
    path: '/document/:id/:secret',
    render: props => {
      let { id, secret } = props.match.params;
      let { history } = props;

      return h( Editor, { id, secret, history } );
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
