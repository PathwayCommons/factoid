import _ from 'lodash';
import convert from 'xml-js';

// import logger from './logger';
import { BASE_URL } from '../config';

const newlineRegex = /(\r\n|\n|\r)/gm;
const xmlJSopts = { compact: false, ignoreComment: true, spaces: 2 };

// https://www.sitemaps.org/protocol.html
class Sitemap {
  constructor( docs ) {
    this.docs = docs;
    this.priority = 0.5;
    this.changefreq = 'weekly';
    this.sitemapJSON = {
      declaration: {
        attributes: {
          version: '1.0',
          encoding: 'UTF-8'
        }
      },
      elements: [
        {
          type: 'element',
          name: 'urlset',
          attributes: {
            'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
            'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1'
          },
          elements: []
        }
      ]
    };
  }

  updateSitemapJSON() {

    const eltFactory = ( name, attributes = {}, text ) => {
      return _.assign({}, {
        type: 'element',
        name,
        attributes,
        elements: text ? [{
          type: 'text',
          text
        }] : []
      });
    };

    const getElementByName = ( js, name ) => _.find( _.get( js, ['elements'] ), ['name', name ] ) || null;

    const appendChild = ( parent, elt ) => {
      if( !_.has( parent, 'elements' ) ) _.set( parent,  'elements', [] );
      const elements = _.get( parent, 'elements' );
      elements.push( elt );
    };

    const getImageElt = doc => {
      const imageElt = eltFactory( 'image:image' );
      const imageLocElt = eltFactory( 'image:loc', {}, `${BASE_URL}/api${doc.publicUrl}.png` );
      const imageTitleElt = eltFactory( 'image:title', {}, _.get( doc, ['citation', 'title'] ) );
      const imageCaptionElt = eltFactory( 'image:caption', {}, _.get( doc, 'text', '' ).replace( newlineRegex, ' ' ) );
      [ imageLocElt, imageTitleElt, imageCaptionElt ].forEach( elt => appendChild( imageElt, elt ) );
      return imageElt;
    };

    const urlset = getElementByName( this.sitemapJSON, 'urlset' );

    this.docs.forEach( doc => {
      const url = eltFactory( 'url' );
      const loc = eltFactory( 'loc', {}, `${BASE_URL}${doc.publicUrl}` );
      const lastmod = eltFactory( 'lastmod', {}, `${doc.lastEditedDate.toISOString()}` );
      const changefreq = eltFactory( 'changefreq', {}, this.changefreq );
      const priority = eltFactory( 'priority', {}, this.priority );
      const image = getImageElt( doc );

      [ loc, lastmod, changefreq, priority, image ].forEach( elt => appendChild( url, elt ) );
      appendChild( urlset, url );
    });

    const baseURL = eltFactory( 'url' );
    appendChild( baseURL, eltFactory( 'loc', {}, `${BASE_URL}/` ) );
    appendChild( urlset, baseURL );
  }

  toXML() {
    this.updateSitemapJSON();
    const xml = convert.js2xml( this.sitemapJSON, xmlJSopts );
    return xml;
  }

  get xml() {
    return this.toXML();
  }

}

/**
 * docs2Sitemap
 * Generate a sitemap consisting of the document public URLs
 *
 * @param { Object } docs The array of documents
 */
const docs2Sitemap = docs => {
  const sitemap = new Sitemap( docs );
  return sitemap.xml;
};

export {
  docs2Sitemap
};