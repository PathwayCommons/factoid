import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';

export class Credits extends Component {
  constructor(props){
    super(props);
  }

  render(){
    const { document } = this.props;
    const authorName = _.get(document.provided(), ['name']);

    if( document.editable() || !authorName ){
      return null;
    }

    const profiles = document.authorProfiles() || [];
    const isContributingAuthor = author => author.name === authorName;
    const authorLink = _.get(profiles.find(isContributingAuthor), ['orcid']);

    return h('div.editor-credits', [
      `Created by `,
      (authorLink ? 
        h('a.plain-link', { href: authorLink, target: '_blank' }, authorName) 
        :
        h('span', authorName) 
      ),
      authorLink ? h('span', [
        h('span', ' '),
        h('i.icon.icon-orcid')
      ]) : null
    ]);
  }
}

export default Credits;