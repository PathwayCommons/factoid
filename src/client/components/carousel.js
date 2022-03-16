import { tryPromise } from '../../util';
import h from 'react-hyperscript';
import { Component } from 'react';
import _ from 'lodash';
import { formatDistanceToNow } from 'date-fns';
import { makeClassList } from '../dom';


export const CAROUSEL_CONTENT = {
  FIGURE: 'figure',
  ABSTRACT: 'abstract'
};

export class Carousel extends Component {
  constructor(props){
    super(props);

    this.state = {
      pagerLeftAvailable: false,
      pagerRightAvailable: false,
      isScrolling: false,
      refreshing: true,
      docs: [],
      content: props.content,
      refresh: props.refresh || (() => { // get all docs from service by default
        const url = `/api/document`;
        const doFetch = () => fetch(url);
        const toJson = res => res.json();

        return tryPromise(doFetch).then(toJson);
      })
    };

    this.updatePagerAvailabilityDebounced = _.debounce(() => {
      this.updatePagerAvailability();
    }, 40);

    this.setScrollState = () => {
      this.setState({ isScrolling: true });

      this.clearScrollStateDebounced();
    };

    this.clearScrollStateDebounced = _.debounce(() => {
      this.setState({ isScrolling: false });
    }, 250);

    this.onScrollExplore = () => {
      this.updatePagerAvailabilityDebounced();
      this.setScrollState();
    };

    const { bus } = this.props;

    if (bus) {
      bus.on('carouselrefresh', () => {
        this.onRefreshRequested();
      });
    }
  }

  componentDidMount(){
    this.refreshDocs().then(() => this.updatePagerAvailabilityDebounced());

    window.addEventListener('resize', this.updatePagerAvailabilityDebounced);
  }

  componentWillUnmount(){
    window.removeEventListener('resize', this.updatePagerAvailabilityDebounced);
  }

  hoverOverDoc(doc){
    doc.hovered = true;

    this.setState({ dirty: Date.now() });
  }

  hoverOutDoc(doc){
    doc.hovered = false;

    this.setState({ dirty: Date.now() });
  }

  scroll(factor = 1){
    if( this.exploreDocsContainer ){
      const container = this.exploreDocsContainer;
      const padding = parseInt(getComputedStyle(container)['padding-left']);
      const width = container.clientWidth - 2*padding;

      this.exploreDocsContainer.scrollBy({
        left: width * factor,
        behavior: 'smooth'
      });
    }
  }

  scrollLeft(){
    this.scroll(-1);
  }

  scrollRight(){
    this.scroll(1);
  }

  updatePagerAvailability(){
    if( this.exploreDocsContainer ){
      const haveNoDocs = this.state.docs.length === 0;
      const { scrollLeft, scrollWidth, clientWidth } = this.exploreDocsContainer;
      const allTheWayLeft = scrollLeft === 0;
      const allTheWayRight = scrollLeft + clientWidth >= scrollWidth;
      let leftAvail = !allTheWayLeft && !haveNoDocs;
      let rightAvail = !allTheWayRight && !haveNoDocs;

      this.setState({
        pagerLeftAvailable: leftAvail,
        pagerRightAvailable: rightAvail
      });
    }
  }

  refreshDocs(){
    this.setState({ refreshing: true });

    const update = docs => new Promise(resolve => this.setState({ docs }, () => resolve(docs)));

    return this.state.refresh().then(update).then(docs => {
      this.setState({ refreshing: false });

      return docs;
    });
  }

  onRefreshRequested() {
    this.refreshDocs().then(() => this.updatePagerAvailabilityDebounced());
  }

  render(){
    const { content } = this.state;

    const exploreDocEntry = doc => {
      const { title, authors: { authorList }, reference: journalName } = doc.citation;
      let authorNames = authorList.map( a => a.name );
      const id = doc.id;
      const link = doc.publicUrl;
      const hovered = doc.hovered;
      let abstractDiv = null;
      let figureDiv = null;
      let abstract = doc.citation.abstract;

      // placeholder
      // abstract = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

      if( authorNames.length > 3 ){
        authorNames = authorNames.slice(0, 2).concat([ '...', authorNames[authorNames.length - 1] ]);
      }

      if( content === CAROUSEL_CONTENT.ABSTRACT ){
        abstractDiv = h('div.carousel-doc-abstract', abstract);
      } else  {
        figureDiv = h('div.carousel-doc-figure', {
          style: {
            backgroundImage: `url('/api/document/${id}.png')`
          }
        });
      }

      return h('div.carousel-doc', {
        className: makeClassList({
          'carousel-doc-scrolling': this.state.isScrolling,
          'carousel-doc-hovered': hovered
        }),
        onTouchStart: () => this.hoverOverDoc(doc),
        onTouchMove: () => this.hoverOutDoc(doc),
        onTouchEnd: () => this.hoverOutDoc(doc),
        onMouseOver: () => this.hoverOverDoc(doc),
        onMouseOut: () => this.hoverOutDoc(doc)
      }, [
        h('a', {
          href: link,
          target: '_blank',
          onTouchStart: e => e.preventDefault()
        }, [
          h('div.carousel-doc-descr', [
            h('div.carousel-doc-journal', journalName),
            h('div.carousel-doc-title', title),
            h('div.carousel-doc-authors', authorNames.map((name, i) => h(`span.carousel-doc-author.carousel-doc-author-${i}`, name))),
            abstractDiv,
            h('div.carousel-doc-footer', [
              h('div.carousel-doc-text', doc.text),
              h('div.carousel-doc-datestamp', formatDistanceToNow( new Date( doc.lastEditedDate || 0 ), { addSuffix: true } ))
            ]),
          ]),
          figureDiv,
          h('div.carousel-doc-journal-banner')
        ])
      ]);
    };

    const docPlaceholders = () => {
      const numPlaceholders = 20;
      const placeholders = [];

      for( let i = 0; i < numPlaceholders; i++ ){
        const p = h('div.carousel-doc.carousel-doc-placeholder');

        placeholders.push(p);
      }

      return placeholders;
    };

    const docs = this.state.docs;
    const refreshing = this.state.refreshing;

    return h('div.carousel', {
      className: makeClassList({
        'carousel-content-is-abstract': content === CAROUSEL_CONTENT.ABSTRACT
      })
    }, [
      h('div.carousel-pager.carousel-pager-left', {
        className: makeClassList({
          'carousel-pager-available': this.state.pagerLeftAvailable
        }),
        onClick: () => this.scrollLeft()
      }, [
        h('i.carousel-pager-icon.material-icons', 'chevron_left')
      ]),
      h('div.carousel-pager.carousel-pager-right', {
        className: makeClassList({
          'carousel-pager-available': this.state.pagerRightAvailable
        }),
        onClick: () => this.scrollRight()
      }, [
        h('i.carousel-pager-icon.material-icons', 'chevron_right')
      ]),
      h('div.carousel-bg'),
      h('div.carousel-content', {
        className: makeClassList({
          'carousel-content-only-placeholders': docs.length === 0
        }),
        onScroll: () => this.onScrollExplore(),
        ref: el => this.exploreDocsContainer = el
      }, (!refreshing && docs.length > 0 ? docs.map(exploreDocEntry) : docPlaceholders()).concat([
        h('div.carousel-doc-spacer')
      ]))
    ]);
  }
}

export default Carousel;