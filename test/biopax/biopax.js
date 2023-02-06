import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import nock from 'nock';
import _ from 'lodash';

import { GROUNDING_SEARCH_BASE_URL } from '../../src/config';
import { mapToUniprotIds } from '../../src/server/routes/api/document';

describe('mapToUniprotIds', function(){
    before( () => {
        const rawBiopaxTemplate = fs.readFileSync(path.resolve( __dirname, 'sampleTemplate.json' ), 'utf8');
        this.biopaxTemplate = JSON.parse(rawBiopaxTemplate);

        const dbXref = this.dbXref = {
            id: '_testid',
            db: 'uniprot'
        };

        const mockRes = [
            {
                dbXrefs: [
                    dbXref
                ]
            }
        ];

        nock(GROUNDING_SEARCH_BASE_URL)
            .post('/map')
            .times(Infinity)
            .reply(200, mockRes);
    });

    after( () => {
        nock.cleanAll();
    } );

    it( 'updated uniprot ids', () => {
        const entityPaths = ['interactions.0.controller', 'interactions.0.source', 'interactions.0.participants.0', 'interactions.0.participants.1'];
        entityPaths.forEach( entityPath => {
            entityPaths.push(entityPath + '.components.0');
            entityPaths.push(entityPath + '.components.1');
        } );
        
        return mapToUniprotIds(this.biopaxTemplate)
            .then( updatedTemplate => {
                entityPaths.forEach( entityPath => {
                    const xrefPath = entityPath + '.xref';
                    const xref = _.get(updatedTemplate, xrefPath);
                    if ( !_.isNil( xref ) ) {
                        expect(xref.id).to.equal(this.dbXref.id);
                        expect(xref.db).to.equal(this.dbXref.db);
                    }
                } );
            } );
    } );
});
