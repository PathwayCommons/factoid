import _ from 'lodash';
import { URL } from 'url';
import { expect } from 'chai';
import et from 'elementtree';

import { docs2Sitemap } from '../../src/server/sitemap.js';
import docsDataJSON from './docsData.json';
import { BASE_URL } from '../../src/config.js';

describe('docs2Sitemap - Element: <urlset>', function(){

  let etree, sitemap;

  before( () => {
    sitemap = docs2Sitemap( docsDataJSON );
    etree = et.parse( sitemap );
  });

  after( () => {} );

  it('Should return a valid xml document', () => {
    expect( etree ).to.exist;
  });

  it('Should have <urlset> root element', () => {
    const root = etree.find('.');
    expect( _.get( root, 'tag' ) ).to.eql( 'urlset');
  });

  describe('Element: <url>', function(){

    let urls, docUrls;

    before( () => {
      urls = etree.findall('./url');
      docUrls = _.filter( urls, url =>{
        url.findtext('./loc') !== `${BASE_URL}/`;
      });
    });

    it('Should have the correct number of <url> children', () => {
      expect( urls ).to.have.lengthOf( docsDataJSON.length + 1 );
    });

    it('Should have the correct <loc>', () => {
      docUrls.forEach( url => {
        const locText = url.findtext('./loc');
        const locURL = new URL(locText);
        const doc = _.find( docsDataJSON, [ 'publicUrl', locURL.pathname ]);
        expect( doc ).not.to.be.undefined;
      });
    }); // loc

    it('Should have the correct <lastmod>', () => {
      docUrls.forEach( url => {
        const lastmod = url.findtext('./lastmod');
        const doc = _.find( docsDataJSON, [ 'lastEditedDate', lastmod ]);
        expect( doc ).not.to.be.undefined;
        expect( doc.lastEditedDate ).to.equal( lastmod );
      });
    }); // lastmod

    it('Should contain the homepage/BASE_URL', () => {
      const hasBaseUrl = urls.some( url => {
        const locText = url.findtext('./loc');
        return locText === `${BASE_URL}/`;
      });
      expect( hasBaseUrl ).to.be.true;
    }); // homepage

  }); // url

}); // docs2Sitemap
