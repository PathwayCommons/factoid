import _ from 'lodash';
import { URL } from 'url';
import { expect } from 'chai';
import et from 'elementtree';

import { docs2Sitemap } from '../../src/server/sitemap.js';
import docsDataJSON from './docsData.json';
import { BASE_URL } from '../../src/config.js';

describe('docs2Sitemap - Element: <urlset>', function(){

  let etree, sitemap, docs;

  before( () => {
    // Mock the Document Date fields
    docs = docsDataJSON.map( d => {
      d.createdDate = new Date(d.createdDate);
      d.lastEditedDate = new Date(d.lastEditedDate);
      return d;
    });
    sitemap = docs2Sitemap( docs );
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
      docUrls = _.filter( urls, url => url.findtext('./loc') !== `${BASE_URL}/` );
    });

    it('Should have the correct number of <url> children', () => {
      expect( urls ).to.have.lengthOf( docs.length + 1 );
    });

    it('Should have the correct <loc>', () => {
      docUrls.forEach( url => {
        const locText = url.findtext('./loc');
        const locURL = new URL(locText);
        const doc = _.find( docs, [ 'publicUrl', locURL.pathname ]);
        expect( doc ).not.to.be.undefined;
      });
    }); // loc

    it('Should have the correct <lastmod>', () => {
      docUrls.forEach( url => {
        const lastmod = url.findtext('./lastmod');
        const doc = _.find( docs, d => d.lastEditedDate.toISOString() == lastmod );
        expect( doc ).not.to.be.undefined;
      });
    }); // lastmod

    it('Should contain the homepage/BASE_URL', () => {
      const hasBaseUrl = urls.some( url => {
        const locText = url.findtext('./loc');
        return locText === `${BASE_URL}/`;
      });
      expect( hasBaseUrl ).to.be.true;
    }); // homepage

    //https://support.google.com/webmasters/answer/178636?hl=en&ref_topic=2370565
    it('Should have the correct <image:image>', () => {
      docUrls.forEach( url => {
        const imageLocText = url.findtext('./image:image/image:loc');
        const hasDocLoc = docs.some( docJSON => imageLocText && imageLocText.includes( docJSON.id ) );
        expect( hasDocLoc ).to.be.true;

        const imageTitleText = url.findtext('./image:image/image:title');
        const hasDocTitle = docs.some( docJSON => docJSON.citation.title === imageTitleText );
        expect( hasDocTitle ).to.be.true;

        const imageCaptionText = url.findtext('./image:image/image:caption');
        const hasDocCaption = docs.some( docJSON => docJSON.text === imageCaptionText );
        expect( hasDocCaption ).to.be.true;
      });
    }); // image:image

  }); // url

}); // docs2Sitemap
