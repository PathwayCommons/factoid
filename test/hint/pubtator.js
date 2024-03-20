import { expect } from 'chai';
// import _ from 'lodash';

import { Hint } from '../../src/model/hint.js';

import { pubtator } from '../../src/server/routes/api/document/hint/index.js';

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

describe('pubtator', function(){

  describe('mapper', function(){

    bioCDocuments.forEach( bioCDocument => {
      const { infons: { doi } } = bioCDocument;

      describe(`BioC Document ${doi}`, function(){
        let hints;

        before( () => {
          hints = pubtator.map( bioCDocument );
        });

        it('Should have the correct properties', function(){
          const first = hints[0];
          expect( first ).to.be.an.instanceof( Hint );
          // expect( first ).to.have.property('text');
          // expect( first ).to.have.property('text');
          // expect( first ).to.have.property('type');
          // expect( first ).to.have.property('xref');
          // expect( first ).to.have.nested.property('xref.dbName');
          // expect( first ).to.have.nested.property('xref.dbPrefix');
          // expect( first ).to.have.nested.property('xref.id');
          // expect( first ).to.have.property('section');
        });

        // it('Should have valid section', function(){
        //   const isValidSection = ({ section }) => section === 'title' || section === 'abstract';
        //   expect( hints.every( isValidSection ) ).to.be.true;
        // });

        // it('Should be unique to each section', function(){
        //   const inTitle = _.filter(hints, ['section', 'title']);
        //   const uniqInTitle = _.uniqBy( inTitle, 'text' );
        //   const inAbstract = _.filter(hints, ['section', 'abstract']);
        //   const uniqInAbstract = _.uniqBy( inAbstract, 'text' );
        //   expect( inTitle.length ).to.equal( uniqInTitle.length );
        //   expect( inAbstract.length ).to.equal( uniqInAbstract.length );
        // });

      }); // Hints

    });

  }); // mapper

}); // pubtator
