import { expect } from 'chai';

import { testTitle } from '../../src/util/article.js';

describe('article', function () {

  describe('testTitle', function () {

    describe('Alphabet', function () {

      it('Should be true when identical', function () {
        const title = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const other = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.true;
      });

      it('Should ignore casing', function () {
        const title = 'hierarchical and scaffolded phosphorylation of two degrons controls per2 stability';
        const other = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.true;
      });

      it('Should be false when non-identical', function () {
        const title = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const other = 'Stanniocalcin 2 governs cancer cell adaptation to nutrient insufficiency through alleviation of oxidative stress.';
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.false;
      });

      it('Should be false when dissimilar (PubMed/CrossRef flaky)', function () {
        const title = 'The mGluR6 ligand-binding domain, but not the C-terminal domain, is required for synaptic localization in retinal ON-bipolar cells';
        const other = 'A missense mutation in Grm6 reduces but does not eliminate mGluR6 expression or rod depolarizing bipolar cell function';
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.false;
      });

      it('Should be false when dissimilar (PubMed/CrossRef flaky)', function () {
        const title = 'Wild-type p53 oligomerizes more efficiently than p53 hot-spot mutants and overcomes mutant p53 gain-of-function via a "dominant-positive" mechanism';
        const other = 'Differential chromatin accessibility landscape of gain-of-function mutant p53 tumours';
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.false;
      });

      describe('Whitespace', function () {

        it('Should ignore surrounding whitespace', function () {
          const title = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability   ';
          const other = '   Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
          const isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

        it('Should ignore internal variation in whitespace (1)', function () {
          const title = 'Comparative interactome analysis  of α-arrestin families in human  and Drosophila';
          const other = 'Comparative interactome analysis of α-arrestin families in human and Drosophila';
          const isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

        it('Should ignore internal variation in whitespace (2)', function () {
          const title = 'Cyclic di-GMP as an Antitoxin Regulates Bacterial Genome Stability and  Antibiotic Persistence in Biofilms';
          const other = 'Cyclic di-GMP as an Antitoxin Regulates Bacterial Genome Stability and Antibiotic Persistence in Biofilms';
          const isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

        it('Should ignore internal variation in whitespace (3)', function () {
          const title = 'Ebola virus sequesters IRF3 in viral  inclusion bodies to evade host  antiviral immunity';
          const other = 'Ebola virus sequesters IRF3 in viral inclusion bodies to evade host antiviral immunity';
          const isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

      }); // Whitespace

    }); // Alphabet

    describe('Punctuation', function () {

      it('Should ignore surrounding periods', function () {
        const title = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability  .';
        const other = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.true;
      });

      it('Should ignore surrounding quotations', function () {
        const title = '"Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability"';
        const other = 'Hierarchical and scaffolded phosphorylation of two degrons controls PER2 stability';
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.true;
      });

      describe('Hyphen; Minus; Dash', function () {

        it('Should be true when identical', function () {
          const title = 'A 2-hydroxybutyrate-mediated feedback loop regulates muscular fatigue.';
          const other = 'A 2-hydroxybutyrate-mediated feedback loop regulates muscular fatigue';
          const isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

        it('Should be true with varying dashes', function () {
          const title = 'Neurons enhance blood-–brain barrier function via upregulating claudin-5 and VE-cadherin expression due to glial cell line-derived neurotrophic factor secretion';
          const other = 'Neurons enhance blood-brain barrier function via upregulating claudin-5 and VE-cadherin expression due to glial cell line-derived neurotrophic factor secretion';
          const isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

        it('Should be true with dash related to microRNA', function () {
          const title = 'Circular RNA HMGCS1 sponges MIR4521 to aggravate type 2 diabetes-induced vascular endothelial dysfunction';
          const other = 'Circular RNA HMGCS1 sponges miR-4521 to aggravate type 2 diabetes-induced vascular endothelial dysfunction';
          const isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

        it('Should be true with variations on a dash (EN DASH U+2013; EM DASH U+2014; NON-BREAKING HYPHEN U+2011)', function () {
          const nonBreakingHyphen = 'Mouse SAS‑6 is required for centriole formation in embryos and integrity in embryonic stem cells';
          const emDash = 'Mouse SAS—6 is required for centriole formation in embryos and integrity in embryonic stem cells';
          const enDash = 'Mouse SAS–6 is required for centriole formation in embryos and integrity in embryonic stem cells';
          const other = 'Mouse SAS-6 is required for centriole formation in embryos and integrity in embryonic stem cells';
          const hyphenIsSimilar = testTitle(nonBreakingHyphen, other);
          const emDashIsSimilar = testTitle(emDash, other);
          const enDashIsSimilar = testTitle(enDash, other);
          expect( hyphenIsSimilar ).to.be.true;
          expect( emDashIsSimilar ).to.be.true;
          expect( enDashIsSimilar ).to.be.true;
        });

      }); // Hyphen; Minus; Dash

      describe('Quotation; Apostrophe', function () {

        it('Should be true when right single quotations are replaced by apostrophes', function () {
          const title = 'Saccharomyces cerevisiae Rev7 promotes non-homologous end-joining by blocking Mre11 nuclease and Rad50’s ATPase activities and homologous recombination';
          const other = 'Saccharomyces cerevisiae Rev7 promotes non-homologous end-joining by blocking Mre11 nuclease and Rad50\'s ATPase activities and homologous recombination';
          let isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

        it('Should be true when nested right single quotations are replaced by apostrophes', function () {
          const title = 'Just say ‘I don’t know’: Understanding information stagnation during a highly ambiguous visual search task';
          const other = 'Just say \'I don\'t know\': Understanding information stagnation during a highly ambiguous visual search task';
          let isSimilar = testTitle(title, other);
          expect( isSimilar ).to.be.true;
        });

      }); // Quotation; Apostrophe

    }); // Punctuation

    describe('Markup', function () {

      it('Should drop HTML tags', function () {
        const title = '<i>Trans</i>regulation of an odorant binding protein by a proto-Y chromosome affects male courtship in house fly';
        const other = 'Transregulation of an odorant binding protein by a proto-Y chromosome affects male courtship in house fly';
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.true;
      });

      it('Should drop escaped HTML tags', function () {
        const title = 'Yerba mate (Ilex paraguariensis) genome provides new insights into convergent evolution of caffeine biosynthesis';
        const other = 'Yerba mate (<i>Ilex paraguariensis<\/i>) genome provides new insights into convergent evolution of caffeine biosynthesis'; // eslint-disable-line no-useless-escape
        const isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.true;
      });

    }); // Markup

    describe('Includes', function () {

      it('Should be true when other includes title and vice versa', function () {
        const title = 'eLife 2024: Defining cell type-specific immune responses in a mouse model of allergic contact dermatitis by single-cell transcriptomics';
        const other = 'Defining cell type-specific immune responses in a mouse model of allergic contact dermatitis by single-cell transcriptomics';
        let isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.true;
        isSimilar = testTitle(other, title);
        expect( isSimilar ).to.be.true;
      });

    }); // Includes

    describe('Extended characters', function () {

      it('Should be true when greek characters', function () {
        const title = '[Clinical Study of Ibrutinib Combined with Venetoclax Regimen in the Treatment of Relapsed/Refractory Diffuse Large B-Cell Lymphoma]';
        const other = '[Clinical Study of Ibrutinib Combined with Venetoclax Regimen in the Treatment of Relapsed/Refractory Diffuse Large B-Cell Lymphoma]';
        let isSimilar = testTitle(title, other);
        expect( isSimilar ).to.be.true;
      });

    }); // Extended characters

  }); // testTitle

}); // article