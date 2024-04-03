import { expect } from 'chai';

import organism from '../../src/server/routes/api/document/hint/organism.js';

import hints_no_org from './hints/10.1016_j.molcel.2016.11.034.json';
import hints_1_org_a_t from './hints/10.1126_scisignal.abf3535.json';
import hints_unsupp_org from './hints/10.1016_j.cryobiol.2022.04.004.json';
import hints_mix_supp_orgs from './hints/10.1126_science.abo0924.json';
import hints_tie from './hints/10.1016_j.cell.2013.05.011.json';

describe('organism hints', function(){

  describe('order', function(){

    it('Should return empty organismOrdering (default) when hints have no organisms', function(){
      const organismOrdering = organism.order( hints_no_org );
      expect( organismOrdering ).to.be.empty;
    });

    it('Should return the sole organism in hint', function(){
      const expected = [ '10090' ];
      const organismOrdering = organism.order( hints_1_org_a_t );
      expect( organismOrdering ).to.eql( expected );
    });

    it('Should return unsupported organisms in hints', function(){
      const expected = new Set([ '208526', '9031' ]);
      const organismOrdering = organism.order( hints_unsupp_org );
      expect( organismOrdering.every( o => expected.has( o ) ) ).to.be.true;
    });

    it('Should return focus organism when organisms with mixed support in hints', function(){
      const expected = [ '9606', '10090', '9539' ];
      const organismOrdering = organism.order( hints_mix_supp_orgs );
      expect( organismOrdering ).to.eql( expected );
    });

    it('Should return organisms when equally prevalent in hints', function(){
      const expected = new Set([ '7227', '10090' ]);
      const organismOrdering = organism.order( hints_tie );
      expect( organismOrdering.every( o => expected.has( o ) ) ).to.be.true;
    });

  }); // order

}); // organism
