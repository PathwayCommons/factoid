import { expect } from 'chai';
import _ from 'lodash';

import { Hint, HINT_TYPE, SECTION } from '../../src/model/hint.js';
import  map from '../../src/server/routes/api/document/hint/pubtator.js';

import  pubtator_2  from './10.1016_j.molcel.2019.03.023.json';
import  pubtator_5  from './10.1038_s41556-021-00642-9.json';
import  pubtator_6  from './10.1126_scisignal.abf3535.json';
import  pubtator_7  from './10.15252_embj.2023113616.json';
/** 
 * bioCDocuments
 * 
 * This is an array of object documents that have set of fields { _id, infons, passages, relations, pmid, etc. }
 * A passage is and array of 2 objects, each object is either of type: { title or abstract }, and has an 
 * annotations array of objects where each object indicates the id and the type of the bioentity (i.e gene, species, etc).
*/
const bioCDocuments = [
    //0..1 (one organism hint in abstract)
    pubtator_2, // pmid: 31003867 | 0 organism hints in title { } | 1 organism hints in abstract: { 10090 aka (Mus musculus): 1 } | text: [ [] , ["mouse"] ]
    //0..1 (one organism hint in abstract)
    pubtator_5, // pmid: 33664495 | 0 organism hints in title { } | 1 organism hints in abstract: { 10090 aka (Mus musculus): 1 } | text: [ [] , ["mice"] ]
    //1..* (one organism hint in title and multiple organism hints in abstract)
    pubtator_6, // pmid: 34546791 | 1 organism hints in title { 10090 aka (Mus musculus): 1 } | 4 organism hints in abstract: { 10090 aka (Mus musculus): 1 } | text: [ ["mice"] , ["mice" , "mice" , "mice" , "mice"] ]
    //1..* (multiple organism hints in title and abstract)
    pubtator_7  // pmid: 37317646 | 1 organism hints in title { 7227 aka (Drosophila melanogaster): 1 } | 2 organism hints in abstract: { 9606 aka (Homo sapiens): 1 , 7227 aka (Drosophila melanogaster): 1 } | text: [ [ "Drosophila"] , [ "human" , "Drosophila"] ]                                
  ];

  describe('pubtator', function(){
    describe('map', function(){
      bioCDocuments.forEach( bioCDocument => {
        const { infons: { doi } } = bioCDocument;
  
        describe(`BioC Document ${doi}`, function(){
          let hints;
  
          before( () => {
            hints = map( bioCDocument );
          });
  
          it('Should map to a non-zero list', function(){
            expect( hints ).to.have.length.above(0);
          });
  
          it('Should map to a list of Hints', function(){
            hints.forEach( h => {
              expect( h ).to.be.an.instanceof( Hint );
            });
          });
  
          it('Should have valid section', function(){
            const isValidSection = h => _.includes( SECTION, h.section );
            expect( hints.every( isValidSection ) ).to.be.true;
          });
  
          it('Should have valid texts field', function(){
            const hasTexts = h => h.texts instanceof Array;
            expect( hints.every( hasTexts ) ).to.be.true;
          });
  
          it('Should have unique xref in a given section', function(){
            const bySectionXref = ({ xref, section }) => `${xref.dbPrefix}_${xref.id}_${section}`;
            const inTitle = _.filter( hints, ['section', 'title'] );
            const uniqInTitle = _.uniqBy( inTitle, bySectionXref );
            const inAbstract = _.filter( hints, ['section', 'abstract'] );
            const uniqInAbstract = _.uniqBy( inAbstract, bySectionXref );
            expect( inTitle.length ).to.equal( uniqInTitle.length );
            expect( inAbstract.length ).to.equal( uniqInAbstract.length );
          });
  
          it(`Should be all an ORGANISM hint`, function(){
            const isOrganism = h => h.type === HINT_TYPE.ORGANISM;
            expect( hints.every( isOrganism ) ).to.be.true;
          });
            
          it('Should have xref to NCBI Taxonomy', function(){
              const hs = _.filter( hints, o => o.type === HINT_TYPE.ORGANISM );
              hs.forEach( h => {
                expect( h.xref.id ).to.match( /^\d+$/ ); // identifier
              });
            });
        }); // BioC Document
      }); // forEach
    }); // map
}); // pubtator
