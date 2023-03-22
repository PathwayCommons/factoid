import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';
import { ORCID_BASE_URL } from '../../../config';
import { findOrcidIdentifier } from '../../../util/pubmed';

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
    const orcid = findOrcidIdentifier( _.get(profiles.find(isContributingAuthor), ['orcid']) ); // Backwards compatible with URI

    return h('div.editor-credits', [
      `Article summary created by `,
      (orcid ?
        h('a.plain-link', { href: `${ORCID_BASE_URL}${orcid}`, target: '_blank' }, authorName)
        :
        h('span', authorName)
      ),
      orcid ? h('span', [
        h('span', ' '),
        h('i.icon.icon-orcid')
      ]) : null
    ]);
  }
}

export default Credits;