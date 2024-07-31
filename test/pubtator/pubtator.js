import { expect } from 'chai';
import map from './map';
import  pubtator_2  from './10.1016_j.molcel.2019.03.023.json';
import  pubtator_4  from './10.1016_j.molcel.2024.01.007.json';
import  pubtator_5  from './10.1038_s41556-021-00642-9.json';
import  pubtator_6  from './10.1126_scisignal.abf3535.json';
import  pubtator_7  from './10.15252_embj.2023113616.json';
/** 
 * bioCDocuments
 * 
 * This is an array of object documents that have set of fields { _id, infons, passages, relations, pmid, etc. }
 * A passage is and array of 2 objects, each object is either of type: { title or abstract }, and has an 
 * annotations array of objects where each object indicates the id and the type of the bioentity (i.e gene, species, etc).
*/
const bioCDocuments = [
    //0..1 (one organism hint in abstract)
    pubtator_2, // pmid: 31003867 | 0 organism hints in title { } | 1 organism hints in abstract: { 10090 aka (Mus musculus): 1 } | text: [ [] , ["mouse"] ]
    //0..0 (no organism hints)
    pubtator_4, // pmid: 38309274 | 0 organism hints in title { } | 0 organism hints in abstract: { } | text: [ [] , [] ]
    //0..1 (one organism hint in abstract)
    pubtator_5, // pmid: 33664495 | 0 organism hints in title { } | 1 organism hints in abstract: { 10090 aka (Mus musculus): 1 } | text: [ [] , ["mice"] ]
    //1..* (one organism hint in title and multiple organism hints in abstract)
    pubtator_6, // pmid: 34546791 | 1 organism hints in title { 10090 aka (Mus musculus): 1 } | 4 organism hints in abstract: { 10090 aka (Mus musculus): 1 } | text: [ ["mice"] , ["mice" , "mice" , "mice" , "mice"] ]
    //*..* (multiple organism hints in title and abstract)
    pubtator_7  // pmid: 37317646 | 2 organism hints in title { 7227 aka (Drosophila melanogaster): 1 , 6239 aka (Caeonorhabditis elegans): 1 } | 3 organism hints in abstract: { 9606 aka (Homo sapiens): 1 , 7227 aka (Drosophila melanogaster): 1 , 6239 aka (Caeonorhabditis elegans): 1 } | text: [ [ "Drosophila" , "C. elegans"] , [ "human" , "Drosophila" , "C. elegans" ] ]                                
  ];

describe(`map`, function() {

    bioCDocuments.forEach( bioCDocument => {
        
        describe(`BioC Document ${bioCDocument.id}`, function() {
            let hints;

            before( () => {
                hints = map(bioCDocument);
                console.log(`hints for document ${bioCDocument.id}:` , hints);
            });

            it('should have subarrays of hints for title and abstract', function() {
                expect(hints[0]).to.be.an('array');
                expect(hints[1]).to.be.an('array');
            });

            it('should have at least one hint in either title or abstract', function() {
                const hasHintsInTitle = hints[0].length > 0;
                const hasHintsInAbstract = hints[1].length > 0;
                expect(hasHintsInTitle || hasHintsInAbstract).to.be.true;
            });
    
        });

    });
    
});

