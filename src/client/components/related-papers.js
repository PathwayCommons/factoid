import h from 'react-hyperscript';
import { Component } from 'react';

export class RelatedPapers extends Component {
  constructor(props){
    super(props);
  }

  render(){
    let { papers } = this.props;

    papers = [ {}, {}, {}, {}, {}, {} ]; // TODO replace with real papers

    return h('div.related-papers', papers.map(paper => { // eslint-disable-line
      // TODO use real paper fields to construct these values:
      const title = `Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt`;
      const abstract = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.  Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc. Nullam arcu. Aliquam consequat. Curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Aenean magna nisl, mollis quis, molestie eu, feugiat in, orci. In hac habitasse platea dictumst.`;
      const author = `John Doe et al.`;
      const journal = `A Journal (2020)`;
      const link = `https://google.com`;

      return h('a.related-paper', {
        href: link,
        target: '_blank'
      }, [
        h('div.related-paper-title', [
          h('span.link-like.plain-link', title)
        ]),
        h('div.related-paper-abstract', abstract),
        h('div.related-paper-author', author),
        h('div.related-paper-journal', journal)
      ]);
    }));
  }
}

export default RelatedPapers;