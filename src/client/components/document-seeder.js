import React from 'react';
import h from 'react-hyperscript';
import { Link } from 'react-router-dom';

import { tryPromise } from '../../util';
import example from './document-seeder-example';
import MainMenu from './main-menu';

class DocumentSeeder extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      submitting: false
    };
  }

  createDoc(){
    let { journalName, title, authors, abstract, text, trackingId, contributorName, contributorEmail, editorName, editorEmail } = this.state;

    let makeRequest = () => fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ journalName, title, authors, abstract, text, trackingId, contributorName, contributorEmail, editorName, editorEmail })
    });

    let toJson = res => res.json();

    let updateState = documentJson => {
      documentJson.editable = true;

      this.setState({ documentJson, submitting: false });
    };

    this.setState({ submitting: true });

    return tryPromise( makeRequest ).then( toJson ).then( updateState );
  }

  goToPreview(){
    let { history } = this.props;
    let { id, secret } = this.state.documentJson;

    history.push(`/new/preview/${id}/${secret}`);
  }

  fillExample(){
    this.setState(example);
  }

  fillQuickExample(){
    this.setState(Object.assign({}, example, {
      abstract: 'PCNA phosphorylates RAD51',
      text: ''
    }));
  }

  clear(){
    this.setState({
      journalName: '',
      title: '',
      authors: '',
      abstract: '',
      text: '',
      trackingId: '',
      contributorName: '',
      contributorEmail: '',
      editorName: '',
      editorEmail: ''
    });
  }

  submit(){
    return (
      Promise.resolve()
      .then( () => this.createDoc() )
    );
  }

  render(){
    let { history, demo } = this.props;
    let { documentJson } = this.state;

    let onChange = key => {
      return e => this.setState({ [key]: e.target.value });
    };

    let value = key => {
      return this.state[key] || '';
    };

    return h('div.document-seeder.page-content', [
      h('div.document-seeder-content', [
        h(MainMenu, { history, title: 'Publisher portal : New paper' }),

        h('p', 'Enter the information for the manuscript you wish to add using Factoid. Upon submission, an invitation will be sent to the contributing author. You will be notified upon submission.'),

        demo ? h('p.document-seeder-example-buttons', [
          h('button', {
            onClick: () => this.fillExample()
          }, 'Use an example'),

          h('button', {
            onClick: () => this.fillQuickExample()
          }, 'Use a quick example')
        ]) : null,

        h('label.document-seeder-text-label', 'Jounal name'),
        h('input.document-seeder-journal-name', {
          type: 'text',
          value: value('journalName'),
          onChange: onChange('journalName')
        }),

        h('label.document-seeder-text-label', 'Paper title'),
        h('input.document-seeder-doc-title', {
          type: 'text',
          value: value('title'),
          onChange: onChange('title')
        }),

        h('label.document-seeder-text-label', 'Authors (comma-separated)'),
        h('textarea.document-seeder-authors', {
          value: value('authors'),
          onChange: onChange('authors')
        }),

        h('label.document-seeder-text-label', 'Abstract'),
        h('textarea.document-seeder-abstract', {
          value: value('abstract'),
          onChange: onChange('abstract')
        }),

        h('label.document-seeder-text-label', 'Text'),
        h('textarea.document-seeder-text', {
          value: value('text'),
          onChange: onChange('text')
        }),

        h('label.document-seeder-text-label', 'Manuscript tracking ID'),
        h('input.document-seeder-tracking', {
          type: 'text',
          value: value('trackingId'),
          onChange: onChange('trackingId')
        }),

        h('label.document-seeder-text-label', 'Contributing author name'),
        h('input.document-seeder-author-name', {
          type: 'text',
          value: value('contributorName'),
          onChange: onChange('contributorName')
        }),

        h('label.document-seeder-text-label', 'Contributing author email'),
        h('input.document-seeder-author-email', {
          type: 'text',
          value: value('contributorEmail'),
          onChange: onChange('contributorEmail')
        }),

        h('label.document-seeder-text-label', 'Editor name'),
        h('input.document-seeder-author-name', {
          type: 'text',
          value: value('editorName'),
          onChange: onChange('editorName')
        }),

        h('label.document-seeder-text-label', 'Editor email'),
        h('input.document-seeder-author-email', {
          type: 'text',
          value: value('editorEmail'),
          onChange: onChange('editorEmail')
        }),

        h('p', [
          h('button.document-seeder-submit.salient-button', {
            onClick: () => this.submit()
          }, 'Submit'),

          this.state.submitting ? h('span', [
            h('span', ' Submitting.  This may take a few minutes.  '),
            h('i.icon.icon-spinner.document-seeder-submit-spinner')
          ]) : this.state.documentJson ? h('span', [
            h('span', ' Submitted and email sent.  You can now '),
            h(Link, { className: 'plain-link', to: `/document/${documentJson.id}/${documentJson.secret}`, target: '_blank'}, 'view the document'),
            h('span', '.')
          ]) : null
        ])
      ])

    ]);
  }
}

export default DocumentSeeder;
