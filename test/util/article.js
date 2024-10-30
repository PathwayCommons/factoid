import { expect } from 'chai';
// import _ from 'lodash';

import { testTitle } from '../../src/util/article.js';

describe('article', function () {

  describe('testTitle', function () {

    describe('Alphabet', function () {

      it('Should be true when identical', function () {
        const title = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const other = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

      it('Should ignore casing', function () {
        const title = 'hierarchical and scaffolded phosphorylation of two degrons controls per2 stability';
        const other = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

      it('Should ignore surrounding whitespace', function () {
        const title = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability   ';
        const other = '   Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

      it('Should ignore surrounding periods', function () {
        const title = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability  .';
        const other = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

      it('Should ignore surrounding quotations', function () {
        const title = '"Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability"';
        const other = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

      it('Should be false when non-identical', function () {
        const title = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const other = 'Stanniocalcin 2 governs cancer cell adaptation to nutrient insufficiency through alleviation of oxidative stress.';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.false;
      });

    }); // Alphabet

    describe('Punctuation', function () {

      it('Should be true when identical', function () {
        const title = 'A 2-hydroxybutyrate-mediated feedback loop regulates muscular fatigue.';
        const other = 'A 2-hydroxybutyrate-mediated feedback loop regulates muscular fatigue';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

      it('Should be true with varying dashes', function () {
        const title = 'Neurons enhance blood-–brain barrier function via upregulating claudin-5 and VE-cadherin expression due to glial cell line-derived neurotrophic factor secretion';
        const other = 'Neurons enhance blood brain barrier function via upregulating claudin 5 and VE cadherin expression due to glial cell line derived neurotrophic factor secretion';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

      it('Should be true with dash related to microRNA', function () {
        const title = 'Circular RNA HMGCS1 sponges MIR4521 to aggravate type 2 diabetes-induced vascular endothelial dysfunction';
        const other = 'Circular RNA HMGCS1 sponges miR-4521 to aggravate type 2 diabetes-induced vascular endothelial dysfunction';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

    }); // Punctuation

    describe('Markup', function () {

      it('Should drop HTML tags ', function () {
        const title = '<i>Trans</i>regulation of an odorant binding protein by a proto-Y chromosome affects male courtship in house fly';
        const other = 'Transregulation of an odorant binding protein by a proto-Y chromosome affects male courtship in house fly';
        const isSame = testTitle(title, other);
        expect( isSame ).to.be.true;
      });

    }); // Markup

  }); // testTitle

}); // article