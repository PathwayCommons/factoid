import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';

import { pubmedDataConverter } from '../../src/server/routes/api/document/pubmed/searchPubmed';
import searchPubmedData from './searchPubmedData';

const TEST_PUBMED_DATA = new Map( _.entries( searchPubmedData ) );

describe('searchPubmed', function(){

  for( const [ query, response ] of TEST_PUBMED_DATA.entries() ) {

    describe('pubmedDataConverter', function(){

      let pubmedInfo;

      before( async () => {
        pubmedInfo = await pubmedDataConverter( response );
      });

      after( () => {
      });

      it('Should return a result', () => {
        expect( pubmedInfo ).to.exist;
      });

      it('Should contain top-level attributes', () => {
        // expect( pubmedInfo ).to.have.property( 'PubmedArticleSet' );
      });

      // describe( 'PubmedArticleSet', () => {});

        

    }); // pubmedDataConverter

  }; // endfor

}); // searchPubmed

