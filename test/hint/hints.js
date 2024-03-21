import { expect } from 'chai';
import _ from 'lodash';

import { Hint, PASSAGE_TYPES } from '../../src/model/hint.js';

import pubtator from '../../src/server/routes/api/document/hint/pubtator.js';
// import hintService from '../../src/server/routes/api/document/hint/index.js';

import pubtator_1 from './10.1016_j.molcel.2016.11.034.json';
import pubtator_2 from './10.1016_j.molcel.2019.03.023.json';
import pubtator_3 from './10.1016_j.molcel.2019.04.005.json';
import pubtator_4 from './10.1038_s41556-021-00642-9.json';
const bioCDocuments = [
  pubtator_1,
  pubtator_2,
  pubtator_3,
  pubtator_4
];

// describe('hintService', function(){
//   // // NB: Live calls ( dev only )
//   describe('find', function(){
//     it('Should be null when hints do not exist for an article', async function(){
//       let pmid = '38496625';
//       let hints = await hintService.find( pmid );
//       expect( hints ).to.be.null;
//     });

//     it('Should exist with valid PMID', async function(){
//       let { pmid } = bioCDocuments[0];
//       let hints = await hintService.find( pmid );
//       expect( hints ).to.exist;
//     });
//   }); // find
// }); // hintService

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

        it('Should be unique to each section', function(){
          const inTitle = _.filter(hints, ['section', 'title']);
          const uniqInTitle = _.uniqBy( inTitle, 'text' );
          const inAbstract = _.filter(hints, ['section', 'abstract']);
          const uniqInAbstract = _.uniqBy( inAbstract, 'text' );
          expect( inTitle.length ).to.equal( uniqInTitle.length );
          expect( inAbstract.length ).to.equal( uniqInAbstract.length );
        });

      }); // BioC Document
    });
  }); // map

  // // NB: Live calls to PubTator ( dev only )
  // describe('get', function(){
  //   it('Should be null when annotations do not exist for an article', async function(){
  //     let pmid = '38496625';
  //     let bioCDocument = await pubtator.get( pmid );
  //     expect( bioCDocument ).to.be.null;
  //   });

  //   it('Should exist with valid PMID', async function(){
  //     let { pmid } = bioCDocuments[0];
  //     let bioCDocument = await pubtator.get( pmid );
  //     expect( bioCDocument ).to.exist;
  //   });
  // }); // get

}); // pubtator
