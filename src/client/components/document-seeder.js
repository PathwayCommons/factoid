const React = require('react');
const h = require('react-hyperscript');
const { Link } = require('react-router-dom');

const { tryPromise } = require('../../util');
const example = require('./document-seeder-example');
const MainMenu = require('./main-menu');

class DocumentSeeder extends React.Component {
  constructor( props ){
    super( props );

    this.state = {
      submitting: false,
      year: (new Date()).getFullYear()
    };
  }

  createDoc(){
    let { name, year, journalName, authorName, authorEmail, editorName, editorEmail, trackingId, abstract, text, legends } = this.state;

    let makeRequest = () => fetch('/api/document', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ name, year, journalName, authorName, authorEmail, editorName, editorEmail, trackingId, abstract, text, legends })
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
      text: '',
      legends: ''
    }));
  }

  clear(){
    this.setState({
      name: '',
      journalName: '',
      authorName: '',
      authorEmail: '',
      editorName: '',
      editorEmail: '',
      trackingId: '',
      abstract: '',
      text: '',
      legends: ''
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

        h('p', 'Enter the information for the paper you would like to submit to Mentena.  An email will be sent to the corresponding author once submitted, with the email requesting that the author edit the resulant pathway.  You, the journal editor, will be copied on the email.  Once the author has completed the pathway, you will be notified so that the pathway may be used in peer review and publication.'),

        demo ? h('p.document-seeder-example-buttons', [
          h('button', {
            onClick: () => this.fillExample()
          }, 'Use an example'),

          h('button', {
            onClick: () => this.fillQuickExample()
          }, 'Use a quick example')
        ]) : null,

        h('label.document-seeder-text-label', 'Paper title'),
        h('input.document-seeder-doc-name', {
          type: 'text',
          value: value('name'),
          onChange: onChange('name')
        }),

        h('label.document-seeder-text-label', 'Jounal name'),
        h('input.document-seeder-journal-name', {
          type: 'text',
          value: value('journalName'),
          onChange: onChange('journalName')
        }),

        h('label.document-seeder-text-label', 'Publication year'),
        h('input.document-seeder-year', {
          type: 'text',
          value: value('year'),
          onChange: onChange('year')
        }),

        h('label.document-seeder-text-label', 'Corresponding author name'),
        h('input.document-seeder-author-name', {
          type: 'text',
          value: value('authorName'),
          onChange: onChange('authorName')
        }),

        h('label.document-seeder-text-label', 'Corresponding author email'),
        h('input.document-seeder-author-email', {
          type: 'text',
          value: value('authorEmail'),
          onChange: onChange('authorEmail')
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

        h('label.document-seeder-text-label', 'Tracking ID'),
        h('input.document-seeder-tracking', {
          type: 'text',
          value: value('trackingId'),
          onChange: onChange('trackingId')
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

        h('label.document-seeder-text-label', 'Figure legends text'),
        h('textarea.document-seeder-legends', {
          value: value('legends'),
          onChange: onChange('legends')
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

module.exports = DocumentSeeder;
