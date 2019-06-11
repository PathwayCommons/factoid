const { BrowserRouter, Route, Redirect, Switch } = require('react-router-dom');
const h = require('react-hyperscript');
const _ = require('lodash');

const PageNotFound = require('./components/page-not-found');
const Editor = require('./components/editor');
const FormEditor = require('./components/form-editor');
const Home = require('./components/home');
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
