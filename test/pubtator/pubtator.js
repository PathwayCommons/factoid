import { expect } from 'chai';
import _ from 'lodash';
import nock from 'nock';

import { Hint, HINT_TYPE, SECTION } from '../../src/model/hint.js';
import pubtator from '../../src/server/routes/api/document/hint/pubtator.js';

import pubtator_1 from './10.1016_j.molcel.2016.11.034.json';
import pubtator_2 from './10.1016_j.molcel.2019.03.023.json';
import pubtator_3 from './10.1016_j.molcel.2019.04.005.json';
import pubtator_4 from './10.1038_s41556-021-00642-9.json';
import pubtator_5 from './10.1126_scisignal.abf3535.json';
import pubtator_6 from './10.1016_j.molcel.2024.01.007.json';
import pubtator_7 from './10.15252_embj.2023113616.json';
import pubtator_8 from './pubtator_8.json';
import { NCBI_BASE_URL } from '../../src/config.js';
import { HTTPStatusError } from '../../src/util/fetch.js';

/**
 * bioCDocuments
 *
 * This is an array of object documents that have set of fields { _id, infons, passages, relations, pmid, etc. }
 * A passage is and array of 2 objects, each object is either of type: { title or abstract }, and has an
 * annotations array of objects where each object indicates the id and the type of the bioentity (i.e gene, species, etc).
 *
 * In the comments below, There is a field at the end of each bioCDocument object called "text" , which is an array devided into 2 arrays, the first array is hints from title, and the second array is hints from abstract.
 */
const bioCDocuments = [
  pubtator_1,
  pubtator_2,
  pubtator_3,
  pubtator_4,
  pubtator_5,
  pubtator_6,
  pubtator_7,
  pubtator_8,
];

describe('pubtator', function () {
  describe('map', function () {
    bioCDocuments.forEach((bioCDocument) => {
      const {
        infons: { doi },
      } = bioCDocument;

      describe(`BioC Document ${doi}`, function () {
        let hints;

        before(() => {
          hints = pubtator.map(bioCDocument);
        });

        it('Should map to a non-zero list', function () {
          expect(hints).to.have.length.above(0);
        });

        it('Should map to a list of Hints', function () {
          hints.forEach((h) => {
            expect(h).to.be.an.instanceof(Hint);
          });
        });

        it('Should have valid section', function () {
          const isValidSection = (h) => _.includes(SECTION, h.section);
          expect(hints.every(isValidSection)).to.be.true;
        });

        it('Should have valid texts field', function () {
          const hasTexts = (h) => h.texts instanceof Array;
          expect(hints.every(hasTexts)).to.be.true;
        });

        it('Should have unique xref in a given section', function () {
          const bySectionXref = ({ xref, section }) =>
            `${xref.dbPrefix}_${xref.id}_${section}`;
          const inTitle = _.filter(hints, ['section', 'title']);
          const uniqInTitle = _.uniqBy(inTitle, bySectionXref);
          const inAbstract = _.filter(hints, ['section', 'abstract']);
          const uniqInAbstract = _.uniqBy(inAbstract, bySectionXref);
          expect(inTitle.length).to.equal(uniqInTitle.length);
          expect(inAbstract.length).to.equal(uniqInAbstract.length);
        });

        it('Should aggregate organism hints correctly', function () {
          const aggregateCounts = hints.reduce((acc, hint) => {
            const key = `${hint.xref.id}_${hint.section}`;
            acc[key] = (acc[key] || 0) + hint.texts.length;
            return acc;
          }, {});

          if (pubtator_1 === bioCDocument) {
            const expectedCounts = {
              '3551_abstract': 1,
              '4212_abstract': 1,
              '4212_title': 1,
              '442920_title': 1,
              '4790_abstract': 4,
              '4792_abstract': 2,
              '5533_abstract': 1,
              '5533_title': 1,
              '5970_abstract': 2,
              '5970_title': 1,
              'MESH:D009369_abstract': 1,
              'MESH:D011471_abstract': 1,
              'MESH:D011471_title': 1,
              'MESH:D064129_abstract': 5,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_2 === bioCDocument) {
            const expectedCounts = {
              '10090_abstract': 1,
              '625662_abstract': 5,
              '625662_title': 1,
              '69597_abstract': 1,
              '73673_abstract': 3,
              '73673_title': 1,
              'MESH:D007246_abstract': 1,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_3 === bioCDocument) {
            const expectedCounts = {
              '29126_abstract': 11,
              '29126_title': 2,
              '4683_abstract': 1,
              '5133_abstract': 3,
              '54918_abstract': 1,
              '672_abstract': 1,
              'MESH:D009369_abstract': 2,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_4 === bioCDocument) {
            const expectedCounts = {
              '10090_abstract': 1,
              '108909_abstract': 8,
              '108909_title': 1,
              '22227_abstract': 7,
              '22227_title': 1,
              'MESH:D002395_abstract': 2,
              'MESH:D007035_abstract': 1,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_5 === bioCDocument) {
            const expectedCounts = {
              '10090_abstract': 4,
              '10090_title': 1,
              '16150_abstract': 5,
              '16150_title': 1,
              '16176_abstract': 3,
              '18033_abstract': 9,
              '18033_title': 1,
              '19697_abstract': 5,
              'MESH:D002357_abstract': 3,
              'MESH:D007249_abstract': 1,
              'MESH:D009402_abstract': 1,
              'MESH:D010003_abstract': 5,
              'MESH:D010003_title': 1,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_6 === bioCDocument) {
            const expectedCounts = {
              '4790_abstract': 4,
              '4790_title': 1,
              '5450_abstract': 1,
              '5452_abstract': 1,
              '64332_abstract': 6,
              '64332_title': 1,
              'MESH:D008223_abstract': 1,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_7 === bioCDocument) {
            const expectedCounts = {
              '39647_abstract': 1,
              '7227_abstract': 1,
              '7227_title': 1,
              '9606_abstract': 1,
              '9662_abstract': 1,
              'MESH:D002925_abstract': 1,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_8 === bioCDocument) {
            const expectedCounts = {
              '9606_title': 1,
              '10090_title': 1,
              '9606_abstract': 12,
              '10090_abstract': 7,
              '947_abstract': 1,
              'MESH:D009369_abstract': 2,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          }
        });

        describe(`Hint type ORGANISM`, function () {
          it('Should have xref to NCBI Taxonomy', function () {
            const hs = _.filter(hints, (o) => o.type === HINT_TYPE.ORGANISM);
            hs.forEach((h) => {
              expect(h.xref.id).to.match(/^\d+$/); // identifier
            });
          });
        });

        describe(`Hint type GGP`, function () {
          it('Should have xref to NCBI Gene', function () {
            const hs = _.filter(hints, (o) => o.type === HINT_TYPE.GGP);
            hs.forEach((h) => {
              expect(h.xref.id).to.match(/^\d+$/); // identifier
            });
          });
        });

        describe(`Hint type CHEMICAL`, function () {
          it('Should have xref to MeSH', function () {
            const hs = _.filter(hints, (o) => o.type === HINT_TYPE.CHEMICAL);
            hs.forEach((h) => {
              expect(h.xref.id).to.match(/^mesh:(C|D)\d{6,9}$/i);
            });
          });
        });
      }); // BioC Document
    }); // forEach
  }); // map

  describe('get', function(){
    it('Should reject if bad request', async function(){
      const pmid = '39131402';
      const path = new RegExp( pmid );
      nock( NCBI_BASE_URL )
        .get( path )
        .reply( 400, {
          "detail": "Could not retrieve publications"
        });

      return pubtator.get( pmid )
        .catch( error => {
          expect( error ).to.be.an.instanceof( HTTPStatusError );
          expect( error.response.status ).to.equal( 400 );
        });
    });

    it('Should return data when valid request', async function(){
      let pmid = '28041912';
      var path = new RegExp( pmid );
      nock( NCBI_BASE_URL )
        .get( path )
        .reply( 200, { foo: 'bar' } );

      return pubtator.get( pmid )
        .then( data => {
          expect( data ).to.exist;
        });
    });
  }); // get

  describe('hints', function(){
    it('Should be null when invalid publicationXref provided', async function(){
      let bioCDocument = await pubtator.hints( { dbPrefix: 'bar', id: 'foo'} );
      expect( bioCDocument ).to.be.null;
    });
  }); // hints
}); // pubtator
