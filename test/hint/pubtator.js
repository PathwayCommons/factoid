import { expect } from 'chai';
import _ from 'lodash';
import nock from 'nock';

import { HINT_TYPE, Hint, PASSAGE_TYPES } from '../../src/model/hint.js';
import pubtator from '../../src/server/routes/api/document/hint/pubtator.js';

import pubtator_1 from './10.1016_j.molcel.2016.11.034.json';
import pubtator_2 from './10.1016_j.molcel.2019.03.023.json';
import pubtator_3 from './10.1016_j.molcel.2019.04.005.json';
import pubtator_4 from './10.1038_s41556-021-00642-9.json';
import pubtator_5 from './10.1126_scisignal.abf3535.json';
import pubtator_6 from './10.1016_j.molcel.2024.01.007.json';
import { NCBI_BASE_URL } from '../../src/config.js';

const bioCDocuments = [
  pubtator_1,
  pubtator_2,
  pubtator_3,
  pubtator_4,
  pubtator_5,
  pubtator_6
];

describe('pubtator', function(){
  describe('map', function(){
    bioCDocuments.forEach( bioCDocument => {
      const { infons: { doi } } = bioCDocument;

      describe(`BioC Document ${doi}`, function(){
        let hints;

        before( () => {
          hints = pubtator.map( bioCDocument );
        });

        it('Should map to a list of Hints', function(){
          hints.forEach( h => {
            expect( h ).to.be.an.instanceof( Hint );
          });
        });

        it('Should have valid section', function(){
          const isValidSection = h => _.includes( PASSAGE_TYPES, h.section );
          expect( hints.every( isValidSection ) ).to.be.true;
        });

        describe(`Hint type not 'Organism'`, function(){
          it('Should have unique \'text\' value in a given section', function(){
            const xOrgHints = _.filter( hints, o => o.type !== HINT_TYPE.ORGANISM );
            const inTitle = _.filter( xOrgHints, ['section', 'title'] );
            const uniqInTitle = _.uniqBy( inTitle, 'text' );
            const inAbstract = _.filter( xOrgHints, ['section', 'abstract'] );
            const uniqInAbstract = _.uniqBy( inAbstract, 'text' );
            expect( inTitle.length ).to.equal( uniqInTitle.length );
            expect( inAbstract.length ).to.equal( uniqInAbstract.length );
          });
        });

      }); // BioC Document
    });
  }); // map

  describe('get', function(){
    it('Should be null when no body returned', async function(){
      let pmid = '38496625';
      var path = new RegExp( pmid );
      nock( NCBI_BASE_URL )
        .get( path )
        .reply( 200 );
      let bioCDocument = await pubtator.get( pmid );
      expect( bioCDocument ).to.be.null;
    });

    it('Should exist when a body is returned', async function(){
      let pmid = '28041912';
      var path = new RegExp( pmid );
      nock( NCBI_BASE_URL )
        .get( path )
        .reply( 200, { foo: 'bar' } );
      let bioCDocument = await pubtator.get( pmid );
      expect( bioCDocument ).to.exist;
    });
  }); // get

}); // pubtator
