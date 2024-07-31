function map(document) {
   
    let result = [[] , []];

    document.passages.forEach(passage => {
        
        if(passage.infons.type === 'title') {
            passage.annotations.forEach(ann => {
                if(ann.infons.biotype === 'species') {
                    result[0].push(ann.infons.normalized_id);
                }
            });
        }
        else if(passage.infons.type === 'abstract') {
            passage.annotations.forEach(ann => {
                if(ann.infons.biotype === 'species') {
                    result[1].push(ann.infons.normalized_id);
                }
            });
        }
    });

    return result;

}
export default map;
