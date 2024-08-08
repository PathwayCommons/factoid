import { expect } from 'chai';
import _ from 'lodash';

import { Hint, HINT_TYPE, SECTION } from '../../src/model/hint.js';
import map from '../../src/server/routes/api/document/hint/pubtator.js';

import pubtator_2 from './10.1016_j.molcel.2019.03.023.json';
import pubtator_5 from './10.1038_s41556-021-00642-9.json';
import pubtator_6 from './10.1126_scisignal.abf3535.json';
import pubtator_7 from './10.15252_embj.2023113616.json';
import pubtator_8 from './pubtator_8.json';

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
  // 0..1 (one organism hint in abstract)
  pubtator_2, // pmid: 31003867 | 0 organism hints in title { } | 1 organism hints in abstract: { 10090 aka (Mus musculus): 1 } | text: [ [] , ["mouse"] ]
  //0..1 (one organism hint in abstract)
  pubtator_5, // pmid: 33664495 | 0 organism hints in title { } | 1 organism hints in abstract: { 10090 aka (Mus musculus): 1 } | text: [ [] , ["mice"] ]
  //1..* (one organism hint in title and multiple organism hints in abstract)
  pubtator_6, // pmid: 34546791 | 1 organism hints in title { 10090 aka (Mus musculus): 1 } | 4 organism hints in abstract: { 10090 aka (Mus musculus): 4 } | text: [ ["mice"] , ["mice" , "mice" , "mice" , "mice"] ]
  //1..* (one organism hint in title and multiple organism hints in abstract)
  pubtator_7, // pmid: 37317646 | 1 organism hints in title { 7227 aka (Drosophila melanogaster): 1 } | 2 organism hints in abstract: { 9606 aka (Homo sapiens): 1 , 7227 aka (Drosophila melanogaster): 1 } | text: [ [ "Drosophila" ] , [ "human" , "Drosophila" ] ]
  //*..* (multiple organisms in title, and multiple organism hints in abstract)
  pubtator_8, // pmid: 24633240 | 2 organism hints in title { 9606 aka (Homo sapiens): 1 , 10090 aka (Mus musculus): 1} | 2 organism hints in title { 9606 aka (Homo sapiens): 12 , 10090 aka (Mus musculus): 7} | text [ [ "human" , "mouse"] , [ "Mice", "human" , "human" , "mouse" , "human" , "mouse" , "human" , "mouse" , "human" , "human" , "mice" , "Human" , "human" , "mice" , "human" , "patients" , "mouse" , "human" , "human" ] ]
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
          hints = map(bioCDocument);
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

        it(`Should be all an ORGANISM hint`, function () {
          const isOrganism = (h) => h.type === HINT_TYPE.ORGANISM;
          expect(hints.every(isOrganism)).to.be.true;
        });

        it('Should aggregate organism hints correctly', function () {
          const aggregateCounts = hints.reduce((acc, hint) => {
            const key = `${hint._xref.id}_${hint.section}`;
            acc[key] = (acc[key] || 0) + hint._texts.length;
            return acc;
          }, {});

          if (pubtator_2 === bioCDocument) {
            const expectedCounts = {
              '10090_abstract': 1,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_5 === bioCDocument) {
            const expectedCounts = {
              '10090_abstract': 1,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_6 === bioCDocument) {
            const expectedCounts = {
              '10090_title': 1,
              '10090_abstract': 4,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_7 === bioCDocument) {
            const expectedCounts = {
              '7227_title': 1,
              '9606_abstract': 1,
              '7227_abstract': 1,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          } else if (pubtator_8 === bioCDocument) {
            const expectedCounts = {
              '9606_title': 1,
              '10090_title': 1,
              '9606_abstract': 12,
              '10090_abstract': 7,
            };
            expect(aggregateCounts).to.deep.equal(expectedCounts);
          }
        });
      }); // BioC Document
    }); // forEach
  }); // map
}); // pubtator
