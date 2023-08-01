import { expect } from 'chai';

import { bestMatch } from '../../src/server/routes/api/document/crossRef/index.js';
import work_doi_1 from './10.7554_eLife.68292.json';
import work_query_1 from './work_query_1.json';
import work_query_2 from './work_query_2.json';
import work_query_3 from './work_query_3.json';
import work_query_4 from './work_query_4.json';

const ID_TYPE = Object.freeze({
  DOI: 'doi',
  TITLE: 'title'
});

describe('works', function(){

  describe('bestMatch', function(){

    describe('Find by DOI, case-insensitive', () => {
      let paperId = '10.7554/eLife.68292';
      let wrongPaperId = '10.7554/eLife.68293';

      it('Should return matching work with correct DOI (case-insensitive)', () => {
        const match = bestMatch( paperId, ID_TYPE.DOI, [work_doi_1] );
        expect( match.DOI.toLowerCase() ).to.equal( paperId.toLowerCase() );
      });

      it('Should not return a matching work for mismatched DOI', () => {
        const match = bestMatch( wrongPaperId, ID_TYPE.DOI, [work_doi_1] );
        expect( match ).to.be.an('undefined');
      });

    });

    describe('Find by exact title', () => {
      let paperId = 'Structural and mechanistic insights into the MCM8/9 helicase complex';
      let paperDoi = '10.7554/elife.87468.2';
      let wrongPaperId = 'Molecular insights into the MCM8/9 helicase complex in DNA unwinding and translocation';

      it('Should return matching work with correct title', () => {
        const match = bestMatch( paperId, ID_TYPE.TITLE, work_query_1 );
        expect( match.DOI.toLowerCase() ).to.equal( paperDoi.toLowerCase() );
      });

      it('Should not return a matching work for mismatched (old) title', () => {
        const match = bestMatch( wrongPaperId, ID_TYPE.TITLE, work_query_1 );
        expect( match ).to.be.an('undefined');
      });

    });

    describe('Find by partial title', () => {
      let paperId = 'Control of telomere length in yeast by SUMOylated PCNA';
      let paperDoi = '10.7554/elife.86990.2';
      let wrongPaperId = 'Control of telomere length by PCNA';

      it('Should return matching work with partial correct title', () => {
        const match = bestMatch( paperId, ID_TYPE.TITLE, work_query_2 );
        expect( match.DOI.toLowerCase() ).to.equal( paperDoi.toLowerCase() );
      });

      it('Should not return a matching work for partial, mismatched title', () => {
        const match = bestMatch( wrongPaperId, ID_TYPE.TITLE, work_query_2 );
        expect( match ).to.be.an('undefined');
      });

    });

    describe('Find by minimal title, not the first search hit', () => {
      let paperId = 'SENP1-Sirt3 Signaling Controls';
      let paperDoi = '10.1016/j.molcel.2019.06.008';

      it('Should return matching work with correct title', () => {
        const match = bestMatch( paperId, ID_TYPE.TITLE, work_query_3 );
        expect( match.DOI.toLowerCase() ).to.equal( paperDoi.toLowerCase() );
      });
    });

    describe('Negative control', () => {
      let paperId = 'SENP1-Sirt3 Signaling Controls Mitochondrial Protein Acetylation and Metabolism';

      it('Should not return match when does not exist', () => {
        const match = bestMatch( paperId, ID_TYPE.TITLE, work_query_2 );
        expect( match ).to.be.an( 'undefined' );
      });
    });

    describe('Prioritizing search ties', () => {
      let paperId = 'Structural and mechanistic insights into the MCM8/9 helicase complex';
      let paperDOI = '10.7554/elife.87468.2';

      it('Should return the most recent match when score is tied', () => {
        const match = bestMatch( paperId, ID_TYPE.TITLE, work_query_4 );
        expect( match.DOI ).to.equal( paperDOI );
      });
    });


  }); // findMatchingWork

}); // works

