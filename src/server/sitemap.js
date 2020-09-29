import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import convert from 'xml-js';

import logger from './logger';
import { BASE_URL } from '../config';

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
            xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9'
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

    const urlset = getElementByName( this.sitemapJSON, 'urlset' );

    this.docs.forEach( doc => {
      const url = eltFactory( 'url' );
      const loc = eltFactory( 'loc', {}, `${BASE_URL}${doc.publicUrl}` );
      const lastmod = eltFactory( 'lastmod', {}, `${doc.lastEditedDate}` );
      const changefreq = eltFactory( 'changefreq', {}, this.changefreq );
      const priority = eltFactory( 'priority', {}, this.priority );

      [ loc, lastmod, changefreq, priority ].forEach( elt => appendChild( url, elt ) );
      appendChild( urlset, url );
    });

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

const docs2Sitemap = docs => {
  const sitemap = new Sitemap( docs );
  return sitemap.xml;
};

/**
 * generateSitemap
 * Write a sitemap consisting of the document public URLs to static folder
 *
 * @param { Object } docs The array of documents
 */
const generateSitemap = docs => {
  const filename = path.join( __dirname, '../..', 'public', 'sitemap.xml' );
  const sitemap = docs2Sitemap( docs );

  return new Promise( ( resolve, reject ) => {
    fs.writeFile( filename, sitemap, err => {
      if ( err ) {
        logger.error( `Error creating sitemap.xml: ${err}` );
        reject( err );
      } else {
        logger.info( `sitemap.xml created` );
        resolve();
      }
    });
  });
};

export {
  docs2Sitemap,
  generateSitemap
};