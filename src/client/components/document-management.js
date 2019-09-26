import React from 'react';
import h from 'react-hyperscript';
import { Link } from 'react-router-dom';

import { tryPromise } from '../../util';
import MainMenu from './main-menu';

import queryString from 'query-string';

const getDocuments = (apiKey) => {
  const url = '/api/document';
  const params = { apiKey };
  const paramsString = queryString.stringify(params);

  console.log(`${url}?${paramsString}`);

  return fetch(`${url}?${paramsString}`);
};

class DocumentManagement extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      documents: []
    };
  }

  componentDidMount(){
    this.updateDocs(); // in case an empty api key is valid
  }

  updateDocs(apiKey = this.state.apiKey){
    getDocuments(apiKey).then(res => res.json()).then(docs => new Promise(resolve => {
      console.log('got docs', docs);

      this.setState({ documents: docs }, resolve);
    }));
  }

  setApiKey(apiKey){
    console.log('set')

    const updateKey = () => new Promise((resolve) => {
      this.setState({ apiKey }, () => {
        resolve();
      });
    });

    return Promise.all([ updateKey(), this.updateDocs(apiKey) ]);
  }

  render(){
    let { history } = this.props;
    let { documents } = this.state;

    return h('div.document-management.page-content', [
      h('div.document-management-content', [
        h('div.page-content-title', [
          h(MainMenu, { history, admin: true }),
          h('h1', 'Add a new paper')
        ]),

        h('p', 'Enter the API key in order to access the panel.'),

        h('label.document-management-text-label', 'API key'),
        h('input.document-management-api-key', {
          type: 'text',
          value: this.state.apiKey,
          onChange: (e) => this.setApiKey(e.target.value)
        }),

        h('div.document-management-list', [
          documents.map(doc => (
            h('div.document-management-doc', {
              key: doc.id
            }, [
              h('span', doc.id)
            ])
          ))
        ])
      ])

    ]);
  }
}

export default DocumentManagement;
