import _ from 'lodash';
import { expect } from 'chai';

import { toPubMedArticle } from '../../src/server/routes/api/document/crossref/map.js';
import work_doi_1 from './10.7554_eLife.87468.2_noabstract.json';
import work_doi_2 from './10.7554_eLife.87468.2.json';
import work_doi_3 from './10.1101_2023.04.12.536510.json';
import work_doi_4 from './10.1101_2022.09.28.22280453.json';
import work_doi_5 from './10.1016_j.molcel.2019.06.008.json';
import work_doi_6 from './10.7554_eLife.68292.json';
import work_doi_7 from './10.3030_101067344.json';
import work_doi_8 from './10.7554_elife.86689.3.json';

describe('map', function(){

  describe('toPubMedArticle', function(){

    describe('type: posted-content, subtype: preprint', function(){

      describe('PubmedData', () => {
        const { PubmedData } = toPubMedArticle( work_doi_2 );
        it('Should correctly map ArticleIdList (DOI)', () => {
          const { ArticleIdList } = PubmedData;
          expect( _.some( ArticleIdList, ['id', '10.7554/elife.87468.2'] ) ).to.be.true;
        });
      }); // PubMedData

      describe('MedlineCitation > Article', () => {

        describe('Text fields (ArticleTitle, Abstract)', () => {
          it('Should correctly map missing Abstract', () => {
            const { MedlineCitation: { Article: { Abstract } } } = toPubMedArticle( work_doi_1 );
            expect( Abstract ).to.be.null;
          });
          it('Should correctly map Abstract and ArticleTitle', () => {
            const { MedlineCitation } = toPubMedArticle( work_doi_2 );
            const { Article } = MedlineCitation;
            const expectedTitle = 'Structural and mechanistic insights into the MCM8/9 helicase complex';
            const expectedAbstractStart = 'MCM8 and MCM9 form a functional helicase complex (MCM8/9) that plays an essential role in DNA homologous recombination repair for DNA double-strand break.';
            const expectedAbstractEnd = 'In summary, our structural and biochemistry study provide a basis for understanding the DNA unwinding mechanism of MCM8/9 helicase in homologous recombination.';
            const { Abstract, ArticleTitle } = Article;
            expect( ArticleTitle ).to.equal( expectedTitle );
            expect( Abstract.startsWith( expectedAbstractStart ) ).to.be.true;
            expect( Abstract.endsWith( expectedAbstractEnd ) ).to.be.true;
          });
          it('Should correctly drop markup in Abstract', () => {
            const { MedlineCitation: { Article: { Abstract } } } = toPubMedArticle( work_doi_4 );
            const expectedAbstractStart = 'Abstract. Background. The advent of functional genomic techniques and next generation sequencing has improved the characterization of the non-protein coding regions of the genome.';
            expect( Abstract.startsWith( expectedAbstractStart ) ).to.be.true;
          });
        }); // Text fields

        describe('AuthorList', () => {
          const { MedlineCitation: { Article: { AuthorList } } } = toPubMedArticle( work_doi_3 );
          it('Should correctly map CollectiveName', () => {
            const name = '23andMe Research Team';
            const hasName = _.some(AuthorList, ['CollectiveName', name ]);
            expect( hasName ).to.be.true;
          });
          it('Should correctly map ORCID', () => {
            const name = 'Chatterjee';
            const id = 'http://orcid.org/0000-0002-9060-008X';
            const Author = _.find(AuthorList, ['LastName', name ]);
            const { Identifier } = Author;
            const hasId = _.some(Identifier, ['id', id ]);
            expect( hasId ).to.be.true;
          });
        }); // AuthorList

        describe('Journal', () => {
          describe('publisher: eLife Sciences Publications, Ltd', () => {
            const { MedlineCitation: { Article: { Journal }} } = toPubMedArticle( work_doi_2 );
            it('Should correctly map Journal title', () => {
              const { Title } = Journal;
              expect( Title.toLowerCase() ).to.equal( 'elife' );
            });
            it('Should correctly map PubDate', () => {
              const { JournalIssue: { PubDate } } = Journal;
              expect( PubDate.Year ).to.equal( '2023' );
              expect( PubDate.Month ).to.equal( 'Jul' );
              expect( PubDate.Day ).to.equal( '19' );
            });
          }); // eLife Reviewed Preprint

        }); // Journal

        describe('PublicationTypeList', () => {
          const { MedlineCitation: { Article: { PublicationTypeList } } } = toPubMedArticle( work_doi_3 );
          it('Should contain a PublicationTypeList with an element', () => {
            expect( PublicationTypeList.length ).to.equal( 1 );
          });
          it('Should have a PublicationType referencing a Preprint', () => {
            const UI = 'D000076942';
            const value = 'Preprint';
            const pubType = _.find(PublicationTypeList, ['UI', UI ]);
            expect( pubType.value ).to.equal(value);
          });

        }); // PublicationTypeList

        describe('CommentsCorrectionsList', () => {

          describe('RefType: UpdateIn', () => {
            const RefType = 'UpdateIn';
            const { MedlineCitation: { CommentsCorrectionsList } } = toPubMedArticle( work_doi_8 );

            it('Should contain a CommentsCorrectionsList with an element', () => {
              expect( CommentsCorrectionsList.length ).to.not.equal( 0 );
            });

            it('Should have a CommentsCorrections with attributes: RefType, RefSource, DOI', () => {
              const commentsCorrections = _.find(CommentsCorrectionsList, ['RefType', RefType ]);
              expect( commentsCorrections ).to.have.property( 'DOI' );
              expect( commentsCorrections ).to.have.property( 'RefType' );
              expect( commentsCorrections ).to.have.property( 'RefSource' );
            });

            it('Should have a CommentsCorrections with DOI-based values: RefSource, DOI', () => {
              const commentsCorrections = _.find(CommentsCorrectionsList, ['RefType', RefType ]);
              expect( commentsCorrections.DOI ).to.match(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i);
              expect( commentsCorrections.RefSource ).to.match(/^doi: 10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i);
            });
          });

        }); // CommentsCorrectionsList

      }); // Article

    }); // type: posted-content, subtype: preprint

    describe('type: journal-article', function(){

      describe('article 1', () => {

        describe('MedlineCitation > Article', () => {
          const { MedlineCitation: { Article } } = toPubMedArticle( work_doi_5 );

          describe('Text fields (ArticleTitle, Abstract)', () => {
            it('Should correctly map Abstract and ArticleTitle', () => {
              const { ArticleTitle, Abstract } = Article;
              const expectedTitle = 'SENP1-Sirt3 Signaling Controls Mitochondrial Protein Acetylation and Metabolism';
              expect( ArticleTitle ).to.equal( expectedTitle );
              expect( Abstract ).to.be.null;
            });
          }); // Text fields

          describe('AuthorList', () => {
            it('Should correctly map ORCID', () => {
              const { AuthorList } = Article;
              const last = 'Cheng';
              const first = 'Jinke';
              const Author = _.find(AuthorList, ['LastName', last ]);
              const { LastName, ForeName } = Author;
              expect( LastName ).to.equal( last );
              expect( ForeName ).to.equal( first );
            });
          }); // AuthorList

          describe('Journal', () => {
            it('Should correctly map Title, ISSN', () => {
              const { Journal: { Title, ISSN: { IssnType, value } } } = Article;
              expect( Title ).to.equal( 'Molecular Cell' );
              expect( IssnType ).to.equal( 'print' );
              expect( value ).to.equal( '1097-2765' );
            });
            it('Should correctly map JournalIssue', () => {
              const { Journal: { JournalIssue: { Issue, Volume } } } = Article;
              expect( Issue ).to.equal( '4' );
              expect( Volume ).to.equal( '75' );
            });
            it('Should correctly map PubDate', () => {
              const { Journal: { JournalIssue: { PubDate } } } = Article;
              expect( PubDate.Year === '2019' ).to.be.true;
              expect( PubDate.Month === 'Aug' ).to.be.true;
              expect( PubDate.Day ).to.be.null;
            });
          }); // Journal

          describe('PublicationTypeList', () => {
            const { PublicationTypeList } = Article;
            it('Should contain a PublicationTypeList with an element', () => {
              expect( PublicationTypeList.length ).to.equal( 1 );
            });
            it('Should have a PublicationType referencing a Preprint', () => {
              const UI = 'D016428';
              const value = 'Journal Article';
              const pubType = _.find(PublicationTypeList, ['UI', UI ]);
              expect( pubType.value ).to.equal(value);
            });

          }); // PublicationTypeList

        }); // article 1

      });

      describe('article 2', () => {

        describe('MedlineCitation > Article', () => {
          const { MedlineCitation: { Article, CommentsCorrectionsList } } = toPubMedArticle( work_doi_6 );

          describe('Text fields (ArticleTitle, Abstract)', () => {
            it('Should correctly map Abstract and ArticleTitle', () => {
              const { ArticleTitle, Abstract } = Article;
              const expectedTitle = 'Author-sourced capture of pathway knowledge in computable form using Biofactoid';
              const expectedAbstractStart = 'Making the knowledge contained in scientific papers machine-readable and formally computable would allow researchers to take full advantage of this information by enabling integration with other knowledge sources to support data analysis and interpretation.';
              expect( ArticleTitle ).to.equal( expectedTitle );
              expect( Abstract.startsWith( expectedAbstractStart ) ).to.be.true;
            });
          }); // Text fields

          describe('AuthorList', () => {
            it('Should correctly map ORCID', () => {
              const { AuthorList } = Article;
              const last = 'Wong';
              const first = 'Jeffrey V';
              const id = 'http://orcid.org/0000-0002-8912-5699';
              const Author = _.find(AuthorList, ['LastName', last ]);
              const { Identifier } = Author;
              const hasId = _.some(Identifier, ['id', id ]);
              const { LastName, ForeName } = Author;
              expect( hasId ).to.be.true;
              expect( LastName ).to.equal( last );
              expect( ForeName ).to.equal( first );
            });
          }); // AuthorList

          describe('Journal', () => {
            it('Should correctly map Title, ISSN', () => {
              const { Journal: { Title, ISSN: { IssnType, value } } } = Article;
              expect( Title ).to.equal( 'eLife' );
              expect( IssnType ).to.equal( 'electronic' );
              expect( value ).to.equal( '2050-084X' );
            });
            it('Should correctly map JournalIssue', () => {
              const { Journal: { JournalIssue: { Issue, Volume } } } = Article;
              expect( Issue ).to.be.null;
              expect( Volume ).to.equal( '10' );
            });
            it('Should correctly map PubDate', () => {
              const { Journal: { JournalIssue: { PubDate } } } = Article;
              expect( PubDate.Year ).to.equal( '2021' );
              expect( PubDate.Month ).to.equal( 'Dec' );
              expect( PubDate.Day ).to.equal( '3' );
            });
          }); // Journal

          describe('PublicationTypeList', () => {
            const { PublicationTypeList } = Article;
            it('Should contain a PublicationTypeList with an element', () => {
              expect( PublicationTypeList.length ).to.equal( 1 );
            });
            it('Should have a PublicationType referencing a Preprint', () => {
              const UI = 'D016428';
              const value = 'Journal Article';
              const pubType = _.find(PublicationTypeList, ['UI', UI ]);
              expect( pubType.value ).to.equal(value);
            });

          }); // PublicationTypeList

          describe('CommentsCorrectionsList', () => {

            describe('RefType: UpdateOf', () => {
              const RefType = 'UpdateOf';

              it('Should contain a CommentsCorrectionsList with an element', () => {
                expect( CommentsCorrectionsList.length ).to.not.equal( 0 );
              });

              it('Should have a CommentsCorrections with attributes: RefType, RefSource, DOI', () => {
                const commentsCorrections = _.find(CommentsCorrectionsList, ['RefType', RefType ]);
                expect( commentsCorrections ).to.have.property( 'DOI' );
                expect( commentsCorrections ).to.have.property( 'RefType' );
                expect( commentsCorrections ).to.have.property( 'RefSource' );
              });

              it('Should have a CommentsCorrections with DOI-based values: RefSource, DOI', () => {
                const commentsCorrections = _.find(CommentsCorrectionsList, ['RefType', RefType ]);
                expect( commentsCorrections.DOI ).to.match(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i);
                expect( commentsCorrections.RefSource ).to.match(/^doi: 10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i);
              });
            });

          }); // CommentsCorrectionsList

        }); // article 2


      });

    }); // type: journal-article

    describe('type: grant (unsupported)', function(){

      describe('PublicationTypeList', () => {
        const { MedlineCitation: { Article: { PublicationTypeList } } } = toPubMedArticle( work_doi_7 );
        it('Should NOT contain a PublicationTypeList with an element', () => {
          expect( PublicationTypeList.length ).to.equal( 0 );
        });
      }); // PublicationTypeList


    }); // type: grant (unsupported type)

  }); // asPubMedArticle
}); // maps

