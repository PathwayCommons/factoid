import DataComponent from './data-component';
import h from 'react-hyperscript';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import TextareaAutosize from 'react-autosize-textarea';

import { focusDomElement, makeClassList } from '../../util';
import { TWITTER_ACCOUNT_NAME, MAX_TWEET_LENGTH, DEMO_CAN_BE_SHARED, DEMO_ID, DEMO_CAN_BE_SHARED_MULTIPLE_TIMES } from '../../config';

class ShareView extends DataComponent {
  constructor(props){
    super(props);

    this.debouncedFocusTextBox = _.debounce(() => {
      const text = ReactDOM.findDOMNode(this).querySelector('.share-view-text');

      if( !text ){ return; } // bail out if no box

      focusDomElement(text);
    }, 50);

    this.onToggle = () => {
      this.refreshImage();
      this.debouncedFocusTextBox();
    };
  }

  refreshImage(){
    const img = ReactDOM.findDOMNode(this).querySelector('.share-view-image');

    if( !img ){ return; } // bail out if can't find img

    const cy = this.props.cy;

    // reset selection so that the image is unaffected
    cy.elements().unselect();

    const png = cy.png({
      full: true,
      maxWidth: 1024
    });

    img.setAttribute('style', `background-image: url('${png}');`);
  }

  focusTextBox(){
    this.debouncedFocusTextBox();
  }

  componentDidMount(){
    const { bus } = this.props;

    bus.on('toggleshare', this.onToggle);
  }

  componentWillUnmount(){
    const { bus } = this.props;

    bus.removeListener('toggleshare', this.onToggle);
  }

  submitTweet(){
    const { document } = this.props;
    const id = document.id();
    const secret = document.secret();
    const textBox = ReactDOM.findDOMNode(this).querySelector('.share-view-text');
    const text = textBox.value;

    const makeRequest = () => fetch(`/api/document/${id}/tweet`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text, secret })
    }).then(res => res.json());

    this.setData({ submitting: true });

    makeRequest().then(tweet => {
      document.setTweetMetadata(tweet);

      this.setData({ submitting: false, submitted: true, tweet });
    });
  }

  render(){
    const { document } = this.props;
    const { submitting, submitted } = this.data;
    const hasSavedTweet = document.hasTweet();
    const isAlwaysTweetableDemo = document.id() === DEMO_ID && DEMO_CAN_BE_SHARED && DEMO_CAN_BE_SHARED_MULTIPLE_TIMES;

    if( !submitted && (!hasSavedTweet || isAlwaysTweetableDemo) ){
      return h('div.share-view.share-view-form', [
        h('div.share-view-header', [
          h('div.share-view-header-icon-area', [
            h('i.icon.icon-t')
          ]),
          h('div.share-view-header-text', [
            h('h3', `Share to Twitter`),
            h('span', `Via `),
            h('a.plain-link', { target: '_blank', href: `https://twitter.com/${TWITTER_ACCOUNT_NAME}` }, `@${TWITTER_ACCOUNT_NAME}`)
          ])
        ]),
        h('div.share-view-preview', [
          h(TextareaAutosize, {
            className: makeClassList({
              'share-view-text': true
            }),
            maxLength: MAX_TWEET_LENGTH,
            placeholder: `Type your ${MAX_TWEET_LENGTH}-character caption here`
          }),
          h('div.share-view-image'),
          h('div.share-view-title', document.title()),
          h('div.share-view-description', document.reference())
        ]),
        h('div.share-view-footer', [
          h('button.share-view-button.share-view-submit.super-salient-button', {
            disabled: submitting,
            onClick: () => this.submitTweet()
          }, submitting ? 'Sending tweet' : 'Tweet my summary')
        ])
      ]);
    } else {
      return h('div.share-view.share-view-result', [
        h('p', 'Your summary has been tweeted.'),
        h('p', [
          h('a', {
            target: '_blank',
            href: document.tweetUrl()
          }, [
            h('button.share-view-button.super-salient-button', 'Open in Twitter')
          ])
        ])
      ]);
    }
  }
}


export { ShareView };
