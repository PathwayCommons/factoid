import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import convert from 'xml-js';

import { pubmedDataConverter } from '../../src/server/routes/api/document/pubmed/fetchPubmed';

const TEST_PUBMED_DATA = new Map([
  ['151222', 'pmid_151222.xml'], // MedlineDate
  ['9417067', 'pmid_9417067.xml'],
  ['29440426', 'pmid_29440426.xml'], // PubMedData
  ['30078747', 'pmid_30078747.xml'], // InvestigatorList
  ['30115697', 'pmid_30115697.xml'], // Markup; Identifier
  ['31511694', 'pmid_31511694.xml']
]);

const xml2jsOpts = {};
const xmljs = xml => convert.xml2js( xml, xml2jsOpts );

describe('fetchPubmed', function(){

  for( const xmlfile of TEST_PUBMED_DATA.values() ) {

    describe('pubmedDataConverter', function(){

      let pubmedInfo;

      before( () => {
        const xml = fs.readFileSync( path.resolve( __dirname, xmlfile ), 'utf8' );
        const json = xmljs( xml );
        pubmedInfo = pubmedDataConverter( json );
        // console.log( JSON.stringify( pubmedInfo,null, 2 ));
      });

      after( () => {} );

      it('Should return a result', () => {
        expect( pubmedInfo ).to.exist;
      });

      it('Should contain top-level attributes', () => {
        expect( pubmedInfo ).to.have.property( 'PubmedArticleSet' );
      });

      describe( 'PubmedArticleSet', () => {

        let PubmedArticleSet;
        before( () => {
          PubmedArticleSet = _.get( pubmedInfo, 'PubmedArticleSet' );
        });

        describe( 'MedlineCitation', () => {

          let MedlineCitation;
          before( () => {
            MedlineCitation = _.get( PubmedArticleSet, ['0', 'MedlineCitation'] );
          });

          it('Should contain top-level attributes', () => {
            expect( MedlineCitation ).to.exist;
          });

          it('Should contain top-level attributes', () => {
            expect( MedlineCitation ).to.have.property( 'Article' );
            expect( MedlineCitation ).to.have.property( 'ChemicalList' );
            expect( MedlineCitation ).to.have.property( 'KeywordList' );
            expect( MedlineCitation ).to.have.property( 'MeshheadingList' );
            expect( MedlineCitation ).to.have.property( 'InvestigatorList' );
          });

          describe( 'Article', () => {

            let Article;
            before( () => {
              Article = _.get( MedlineCitation, 'Article' );
            });

            it('Should possess top-level attributes', () => {
              expect( Article ).to.have.property( 'Journal' );
              expect( Article ).to.have.property( 'ArticleTitle' );
              expect( Article ).to.have.property( 'Abstract' );
              expect( Article ).to.have.property( 'AuthorList' );
            });

            describe( 'Journal', () => {

              let Journal;
              before( () => {
                Journal = _.get( Article, 'Journal' );
              });

              it('Should possess top-level attributes', () => {
                expect( Journal ).to.have.property( 'Title' );
                expect( Journal ).to.have.property( 'JournalIssue' );
                expect( Journal ).to.have.property( 'ISSN' );
                expect( Journal ).to.have.property( 'ISOAbbreviation' );
              });

              describe( 'JournalIssue', () => {

                let JournalIssue;
                before( () => {
                  JournalIssue = _.get( Journal, 'JournalIssue' );
                });

                it('Should possess top-level attributes', () => {
                  expect( JournalIssue ).to.have.property( 'Volume' );
                  expect( JournalIssue ).to.have.property( 'Issue' );
                  expect( JournalIssue ).to.have.property( 'PubDate' );
                });

                describe( 'PubDate', () => {

                  let PubDate;
                  before( () => {
                    PubDate = _.get( JournalIssue, 'PubDate' );
                  });


                  it('Should possess a correct PubDate', () => {
                    if( _.has( PubDate, ['MedlineDate'] ) ) {
                      expect( PubDate ).to.have.property( 'MedlineDate' );

                    } else {
                      expect( PubDate ).to.have.property( 'Year' );
                      if( _.has( PubDate, ['Season'] ) ) {
                        expect( PubDate ).to.have.property( 'Season' );
                      }

                      if( _.has( PubDate, ['Month'] ) ) {
                        expect( PubDate ).to.have.property( 'Month' );
                      }

                      if( _.has( PubDate, ['Day'] ) ) {
                        expect( PubDate ).to.have.property( 'Day' );
                      }

                    }
                  });

                });

              });

              describe( 'ISSN', () => {

                let ISSN;
                before( () => {
                  ISSN = _.get( Journal, 'ISSN' );
                });

                if( ISSN != null ){
                  it('Should possess top-level attributes', () => {
                    expect( ISSN ).to.have.property( 'IssnType' );
                    expect( ISSN ).to.have.property( 'value' );
                  });
                }
              });

            }); // Journal

            describe( 'Abstract', () => {

              let Abstract;
              before( () => {
                Abstract = _.get( Article, 'Abstract' );
              });

              it('Should be a (optional) string', () => {
                if( Abstract ){
                  expect( Abstract ).to.be.a('string');
                }
              });
            });

            describe( 'AuthorList', () => {

              let AuthorList;
              before( () => {
                AuthorList = _.get( Article, 'AuthorList' );
              });

              it('Should consist of multiple items', () => {
                expect( AuthorList.length ).not.to.equal( 1 );
              });


              describe( 'Author', () => {

                let Author;
                before( () => {
                  Author = _.head( AuthorList );
                });

                it('Should have item with top-level attributes', () => {
                  expect( Author ).to.have.nested.property( 'LastName' );
                  expect( Author ).to.have.nested.property( 'ForeName' );
                  expect( Author ).to.have.nested.property( 'Initials' );
                  expect( Author ).to.have.nested.property( 'CollectiveName' );
                  expect( Author ).to.have.property( 'AffiliationInfo' );
                  expect( Author ).to.have.property( 'Identifier' );
                  if( !_.isEmpty( _.get( Author, 'AffiliationInfo' ) ) ){
                    expect( Author ).to.have.nested.property( 'AffiliationInfo[0].Affiliation' );
                    expect( Author ).to.have.nested.property( 'AffiliationInfo[0].email' );
                  }
                });

                describe( 'Identifier', () => {

                  let Identifier;
                  before( () => {
                    Identifier = _.get( Author, 'Identifier' );
                  });

                  it('Should have item with top-level attributes', () => {
                    if( !_.isEmpty( Identifier ) ){
                      expect( Identifier ).to.have.property( 'Identifier[0].Source' );
                      expect( Identifier ).to.have.property( 'Identifier[0].id' );
                    }
                  });

                });//Identifier

              }); // Author

            }); //AuthorList

          }); //Article

          describe( 'ChemicalList', () => {

            let ChemicalList;
            before( () => {
              ChemicalList = _.get( MedlineCitation, 'ChemicalList' );
            });

            it('Attribute should exist', () => {
              expect( MedlineCitation ).to.have.nested.property( 'ChemicalList' );
            });

            it('Should consist of one item or empty', () => {
              expect( Array.isArray( ChemicalList ) ).to.be.true;
            });

            describe( 'Chemical', () => {

              let Chemical;
              before( () => {
                Chemical = _.head( ChemicalList );
              });

              it('Should have optional item with top-level attributes', () => {
                if( Chemical ){
                  expect( Chemical ).to.have.property( 'RegistryNumber' );
                  expect( Chemical ).to.have.property( 'NameOfSubstance' );
                  expect( Chemical ).to.have.property( 'UI' );
                }
              });
            });

          });//ChemicalList

          describe( 'KeywordList', () => {

            let KeywordList;
            before( () => {
              KeywordList = _.get( MedlineCitation, 'KeywordList' );
            });

            it('Attribute should exist', () => {
              expect( MedlineCitation ).to.have.nested.property( 'KeywordList' );
            });

            it('Should consist of multiple items or empty', () => {
              expect( Array.isArray( KeywordList ) ).to.be.true;
            });

          });//KeywordList


          describe( 'MeshheadingList', () => {

            let MeshheadingList;
            before( () => {
              MeshheadingList = _.get( MedlineCitation, 'MeshheadingList' );
            });

            it('Attribute should exist', () => {
              expect( MedlineCitation ).to.have.nested.property( 'MeshheadingList' );
            });

            it('Should consist of multiple items or empty', () => {
              expect( Array.isArray( MeshheadingList ) ).to.be.true;
            });

            it('Should have item with top-level attributes', () => {
              if( !_.isEmpty( MeshheadingList ) ){
                expect( MeshheadingList ).to.have.nested.property( '[0].DescriptorName.value' );
                expect( MeshheadingList ).to.have.nested.property( '[0].DescriptorName.UI' );
                expect( MeshheadingList ).to.have.nested.property( '[0].DescriptorName.MajorTopicYN' );

                if( !_.isEmpty( MeshheadingList[0].QualifierName ) ){
                  expect( MeshheadingList ).to.have.nested.property( '[0].QualifierName[0].value' );
                  expect( MeshheadingList ).to.have.nested.property( '[0].QualifierName[0].MajorTopicYN' );
                  expect( MeshheadingList ).to.have.nested.property( '[0].QualifierName[0].UI' );
                }
              }
            });

          });//MeshheadingList

          describe( 'InvestigatorList', () => {

            let InvestigatorList;
            before( () => {
              InvestigatorList = _.get( MedlineCitation, 'InvestigatorList' );
            });

            it('Attribute should exist', () => {
              expect( MedlineCitation ).to.have.nested.property( 'InvestigatorList' );
            });

            it('Should consist of multiple items or null', () => {
              expect( InvestigatorList === null || Array.isArray( InvestigatorList ) ).to.be.true;
            });

            describe( 'Investigator', () => {

              let Investigator;
              before( () => {
                Investigator = _.head( InvestigatorList );
              });

              it('Should have item with top-level attributes', () => {
                if( Investigator ){
                  expect( Investigator ).to.have.nested.property( 'LastName' );
                  expect( Investigator ).to.have.nested.property( 'ForeName' );
                  expect( Investigator ).to.have.nested.property( 'Initials' );
                  expect( Investigator ).to.have.nested.property( 'Identifier' );
                  expect( Investigator ).to.have.nested.property( 'AffiliationInfo' );
                }
              });

            }); // Investigator

          }); // InvestigatorList

        });//MedlineCitation

        describe( 'PubmedData', () => {

          let PubmedData;
          before( () => {
            PubmedData = _.get( pubmedInfo, 'PubmedArticleSet[0].PubmedData' );
          });

          it('Should contain top-level attributes', () => {
            expect( PubmedData ).to.exist;
          });

          it('Should contain top-level attributes', () => {
            expect( PubmedData ).to.have.property( 'History' );
            expect( PubmedData ).to.have.property( 'ArticleIdList' );
            expect( PubmedData ).to.have.property( 'ReferenceList' );
          });

          describe( 'History', () => {

            let History;
            before( () => {
              History = _.get( PubmedData, 'History' );
            });

            it('Should consist of multiple items or none', () => {
              expect( Array.isArray( History ) ).to.be.true;
            });

            it('Should contain items with top-level attributes', () => {
              if( !_.isEmpty( History ) ){
                expect( History ).to.have.nested.property( '[0].PubStatus' );
                expect( History ).to.have.nested.property( '[0].PubMedPubDate' );
              }
            });

            it('Should have a "pubmed" PubStatus', () => {
              expect( _.find( History, o => o.PubStatus === 'pubmed' ) ).to.exist;
            });

          }); //History

          describe( 'ArticleIdList', () => {

            let ArticleIdList;
            before( () => {
              ArticleIdList = _.get( PubmedData, 'ArticleIdList' );
            });

            it('Should consist of multiple items', () => {
              expect( ArticleIdList.length ).not.to.equal( 0 );
            });

            it('Should contain items with top-level attributes', () => {
              expect( ArticleIdList[0] ).to.have.property( 'IdType' );
              expect( ArticleIdList[0] ).to.have.property( 'id' );
            });

          }); //ArticleIdList

          describe( 'ReferenceList', () => {

            let ReferenceList;
            before( () => {
              ReferenceList = _.get( PubmedData, 'ReferenceList' );
            });

            it('Should contain items with top-level attributes', () => {
              if ( !_.isEmpty( ReferenceList ) ) {
                expect( ReferenceList[0] ).to.have.property( 'Title' );
                expect( ReferenceList[0] ).to.have.property( 'Reference' );
                expect( ReferenceList[0] ).to.have.property( 'ReferenceList' );
              }
            });

          });//ReferenceList

        });//PubmedData

      });//PubmedArticleSet

    });//fetchArticleSet

  } // TEST_PUBMED_DATA cases

}); // fetchPubmed
