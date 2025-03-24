import h from 'react-hyperscript';
import { Component } from 'react';
import { DOI_LINK_BASE_URL, PUBMED_LINK_BASE_URL, GOOGLE_SCHOLAR_BASE_URL, ORCID_BASE_URL } from '../../config.js';
import _ from 'lodash';
import { findOrcidIdentifier } from '../../util/pubmed.js';

export class Credits extends Component {
  constructor(props){
    super(props);
  }

  render(){
    const { document } = this.props;
    const authorName = _.get(document.provided(), ['name']);

    if( !authorName ){
      return null;
    }

    const profiles = document.authorProfiles() || [];
    const isContributingAuthor = author => author.name === authorName;
    const orcid = findOrcidIdentifier( _.get(profiles.find(isContributingAuthor), ['orcid']) ); // Backwards compatible with URI

    return h('div.credits', [
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

export class Citation extends Component {
  constructor(props){
    super(props);

    this.state = {};
  }

  elide( list, limit = 10 ){
    if ( list.length <= limit ) return list;
    const leadingAuthors = _.take( list, limit - 1 );
    const lastAuthor =  _.last( list );
    let authorList = leadingAuthors.concat( lastAuthor );
    return authorList.toSpliced( limit - 1, 0, { name: '...' });
  }

  render(){
    const MAX_RELATIONS = Number.POSITIVE_INFINITY;
    const { document, compact } = this.props;
    const citation = document.citation();
    // authorProfiles may not be existing for the older documents
    let authorProfiles = document.authorProfiles() || citation.authors.authorList;
    if( compact ) authorProfiles = this.elide( authorProfiles );
    const { pmid, title, reference, doi, relations } = citation;

    const retractedPubType = _.find( citation.pubTypes, ['UI', 'D016441'] );
    const retractFlag = retractedPubType ? h('span.citation-flag.super-salient-button.danger', retractedPubType.value) : null;

    const hasRelations = !_.isEmpty( relations );

    return h('div.citation', [
      h(Credits, { document }),
      h('div.citation-flags', [ retractFlag ]),
      h('div.citation-title', title),
      h('ul.citation-authors', _.flatten(authorProfiles.map((a, i) => { // Limit
        let orcid = findOrcidIdentifier( a.orcid ); // Backwards compatible with URI
        if ( orcid ) {
          return h('li', { key: i.toString() }, [
            h('a.citation-author.plain-link', { target: '_blank', href: `${ORCID_BASE_URL}${orcid}` }, a.name),
            h('i.icon.icon-orcid')
          ]);
        }

        return h('li', { key: i.toString() }, [
          h('span.citation-author', a.name)
        ]);
      }))),
      h('ul.citation-links', [
        reference ? h('li', [
          h( doi ? 'a.plain-link': 'div', doi ? { target: '_blank', href: `${DOI_LINK_BASE_URL}${doi}` }: {}, reference )
        ]) : null,
        pmid ? h('li', [
          h('a.plain-link', { target: '_blank', href: `${PUBMED_LINK_BASE_URL}${pmid}` }, 'PubMed')
        ]) : null,
        h('li', [
          h('a.plain-link', { target: '_blank', href: `${GOOGLE_SCHOLAR_BASE_URL}${( "\u0022" + title + "\u0022") }`}, 'Google Scholar')
        ])
      ]),
      hasRelations && !compact ?
        h('div.citation-relations', relations.map( ({ type, links }, i) =>
          h('ul', { key: i.toString() }, [
            h('span', `${type} `),
            h('span', links.slice(0, MAX_RELATIONS).map( ({ url, reference }, j ) => h('li', [
              h( url ? 'a.plain-link' : 'span',  url ? { key: j.toString(), target: '_blank', href: url }: {}, reference )
            ])))
          ])
        )): null,
    ]);
  }
}

export default Citation;