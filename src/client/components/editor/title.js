import h from 'react-hyperscript';

import { DOI_LINK_BASE_URL } from '../../../config';

export const EditorTitle = props => {
  const { authors: { abbreviation }, title = 'Unnamed document', reference, doi } = props.citation;
  const { document } = props;

  if( !document.editable() ){
    return null;
  }
  
  return h('div.editor-title', [
    h('div.editor-title-content', [
      h(doi ? 'a' : 'div', (doi ? { target: '_blank', href: `${DOI_LINK_BASE_URL}${doi}` } : {}), [
        h('div.editor-title-name' + (doi ? '.plain-link.link-like' : ''), title ),
        h('div.editor-title-info', [
          h('div', abbreviation ),
          h('div', reference )
        ])
      ])
    ])
  ]);
};

export default EditorTitle;