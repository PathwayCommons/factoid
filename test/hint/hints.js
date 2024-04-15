import { expect } from 'chai';
import _ from 'lodash';

import { HINT_TYPE, Hint, SECTION } from '../../src/model/hint';
import { COLLECTIONS } from '../../src/util/registry';

describe('Hint', function(){
  const validTexts = ['p53'];
  const validType = HINT_TYPE.GGP;
  const validXref = _.assign( { id: '123' }, COLLECTIONS.NCBI_GENE );
  const validSection = SECTION.TITLE;

  describe('Constructor validation', function(){

    it('Should throw with missing "texts"', function(){
      const texts = undefined;
      const hintFactory = () => new Hint({ texts, type: validType, xref: validXref, section: validSection });
      expect( hintFactory ).to.throw();
    });

    it('Should throw with empty "texts"', function(){
      const texts = [];
      const hintFactory = () => new Hint({ texts, type: validType, xref: validXref, section: validSection });
      expect( hintFactory ).to.throw();
    });

     it('Should throw with invalid type', function(){
      const type = 'taxon';
      const hintFactory = () => new Hint({ texts: validTexts, type, xref: validXref, section: validSection });
      expect( hintFactory ).to.throw();
    });

    it('Should throw with invalid Xref', function(){
      const xref = { db: 'pubmed', 'id': '123' };
      const hintFactory = () => new Hint( validTexts, validType, xref, validSection );
      expect( hintFactory ).to.throw();
    });

    it('Should throw with invalid section', function(){
      const section = 'references';
      const hintFactory = () => new Hint( validTexts, validType, validXref, section );
      expect( hintFactory ).to.throw();
    });

  });

  describe('Setter validation', function(){

    let validHint;
    this.beforeEach(function(){
      validHint = new Hint({ texts: validTexts, type: validType, xref:validXref, section: validSection });
    });

    it('Should throw with missing "texts"', function(){
      const texts = undefined;
      const hintFactory = () => validHint.texts = texts;
      expect( hintFactory ).to.throw();
    });

    it('Should throw with invalid type', function(){
      const type = 'taxon';
      const hintFactory = () => validHint.type = type;
      expect( hintFactory ).to.throw();
    });

    it('Should throw with invalid Xref', function(){
      const xref = {};
      const hintFactory = () => validHint.xref = xref;
      expect( hintFactory ).to.throw();
    });

    it('Should throw with invalid section', function(){
      const section = 'references';
      const hintFactory = () => validHint.section = section;
      expect( hintFactory ).to.throw();
    });

  });

}); // Hint
