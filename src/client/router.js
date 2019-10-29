import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import h from 'react-hyperscript';
import _ from 'lodash';

import PageNotFound from './components/page-not-found';
import Editor from './components/editor';
import Home from './components/home';
import DocumentSeeder from './components/document-seeder';
import DocumentManagement from './components/document-management';

import { DEMO_ID, DEMO_SECRET } from '../config';


let routes = [
  {
    path: '/',
    render: (props) => {
      return h(Home, { history: props.history });
    }
  },
  {
    path: '/demo',
    render: props => {
      let id = DEMO_ID;
      let secret = DEMO_SECRET;
      let { history } = props;

      return h( Editor, { id, secret, history } );
    }
  },
  {
    path: '/admin',
    render: () => {
      return h( Redirect, { to: '/document' } );
    }
  },
  {
    path: '/document',
    render: props => {
      let { history } = props;

      return h( DocumentManagement, { history } );
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

export default () => (
  h( BrowserRouter, [
    h( Switch, routes )
  ] )
);
