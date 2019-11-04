import _ from 'lodash';
import { expect } from 'chai';

import { searchPubmed, pubmedDataConverter } from '../../src/server/routes/api/document/pubmed/searchPubmed';
import searchPubmedData from './searchPubmedData';

const TEST_PUBMED_DATA = new Map( _.entries( searchPubmedData ) );
const DEFAULT_ESEARCH_PARAMS = {
  db: 'pubmed',
  rettype: 'uilist',
  retmode: 'json',
  retmax: 10,
  usehistory: 'y',
  field: undefined
};

describe('searchPubmed', function(){
  
  describe('pubmedDataConverter', function(){
    
    describe( 'undefined term', () => {

      let pubmedInfo; 
      const queryType = 'undefined_term';
      const json = TEST_PUBMED_DATA.get( queryType );
      
      before( async () => {
        pubmedInfo = await pubmedDataConverter( json );
      });

      it('Should return a result', () => {
        expect( pubmedInfo ).to.exist;
      });
  
      it('Should contain top-level attributes', () => {
        expect( pubmedInfo ).to.have.property( 'count' );
        expect( pubmedInfo ).to.have.property( 'searchHits' );
        expect( pubmedInfo ).to.have.property( 'query_key' );
        expect( pubmedInfo ).to.have.property( 'webenv' );
      });

      it('Should have correct top-level values', () => {
        expect( pubmedInfo.count ).to.equal( 0 );
        expect( pubmedInfo.searchHits ).to.be.empty;
        expect( pubmedInfo.query_key ).to.be.a('null');
        expect( pubmedInfo.webenv ).to.be.a('null');
      });
  
    }); // empty term

    describe( 'empty term', () => {

      let pubmedInfo; 
      const queryType = 'empty_term';
      const json = TEST_PUBMED_DATA.get( queryType );
      
      before( async () => {
        pubmedInfo = await pubmedDataConverter( json );
      });

      it('Should return a result', () => {
        expect( pubmedInfo ).to.exist;
      });
  
      it('Should contain top-level attributes', () => {
        expect( pubmedInfo ).to.have.property( 'count' );
        expect( pubmedInfo ).to.have.property( 'searchHits' );
        expect( pubmedInfo ).to.have.property( 'query_key' );
        expect( pubmedInfo ).to.have.property( 'webenv' );
      });

      it('Should have correct top-level values', () => {
        expect( pubmedInfo.count ).to.equal( 0 );
        expect( pubmedInfo.searchHits ).to.be.empty;
        expect( pubmedInfo.query_key ).to.not.be.a('null');
        expect( pubmedInfo.webenv ).to.not.be.a('null');
      });
  
    }); // empty term

    describe( 'unique term', () => {

      let pubmedInfo; 
      const queryType = 'unique_term';
      const json = TEST_PUBMED_DATA.get( queryType );
      
      before( async () => {
        pubmedInfo = await pubmedDataConverter( json );
      });

      it('Should return a result', () => {
        expect( pubmedInfo ).to.exist;
      });
  
      it('Should contain top-level attributes', () => {
        expect( pubmedInfo ).to.have.property( 'count' );
        expect( pubmedInfo ).to.have.property( 'searchHits' );
        expect( pubmedInfo ).to.have.property( 'query_key' );
        expect( pubmedInfo ).to.have.property( 'webenv' );
      });

      it('Should have correct top-level values', () => {
        expect( pubmedInfo.count ).to.equal( 1 );
        expect( pubmedInfo.searchHits ).to.have.lengthOf( 1 );
        expect( pubmedInfo.query_key ).to.not.be.a('null');
        expect( pubmedInfo.webenv ).to.not.be.a('null');
      });
  
    }); // unique term


    describe( 'nonunique term', () => {

      let pubmedInfo; 
      const queryType = 'nonunique_term';
      const json = TEST_PUBMED_DATA.get( queryType );
      
      before( async () => {
        pubmedInfo = await pubmedDataConverter( json );
      });

      it('Should return a result', () => {
        expect( pubmedInfo ).to.exist;
      });
  
      it('Should contain top-level attributes', () => {
        expect( pubmedInfo ).to.have.property( 'count' );
        expect( pubmedInfo ).to.have.property( 'searchHits' );
        expect( pubmedInfo ).to.have.property( 'query_key' );
        expect( pubmedInfo ).to.have.property( 'webenv' );
      });

      it('Should have correct top-level values', () => {
        expect( pubmedInfo.count ).to.be.greaterThan( DEFAULT_ESEARCH_PARAMS.retmax );
        expect( pubmedInfo.searchHits ).to.have.lengthOf( DEFAULT_ESEARCH_PARAMS.retmax );
        expect( pubmedInfo.query_key ).to.not.be.a('null');
        expect( pubmedInfo.webenv ).to.not.be.a('null');
      });
  
    }); // nonunique term

  }); // pubmedDataConverter

  // describe('searchPubmed', function(){
  //   let pubmedInfo;
  //   before( async () => {
  //     pubmedInfo = await searchPubmed( 'GDF15 expression.' );
  //   });

  //   it( 'should return live data', async ()=> {
  //     expect( pubmedInfo ).to.exist;
  //     console.log( JSON.stringify(pubmedInfo,null,2) );
  //   });
  // });

}); // searchPubmed

