return;

let expect = require('chai').expect;
let Element = require('../src/model/element');

describe('Element', function(){ return;
  let ele;

  beforeEach(function(){
    ele = new Element({
      // TODO revise
    });

    return ele.create();
  });

  describe('name', function(){
    it('has a name', function(){
      expect( ele.name ).to.exist;
      expect( ele.name ).to.be.a('string');
    });

    it('can be renamed', function(){
      ele.rename('foo');

      expect( ele.name ).to.equal('foo');
    });

    it('fires rename event when renamed', function( done ){
      ele.on('rename', done);

      ele.rename('foo');
    });
  });

  describe('position', function(){
    it('has a position object', function(){
      expect( ele.position ).to.exist;
      expect( ele.position ).to.be.an('object');
    });

    it('has a position with (x, y) numbers', function(){
      expect( ele.position ).to.have.property('x');
      expect( ele.position ).to.have.property('y');

      expect( ele.position.x ).to.be.a('number');
      expect( ele.position.y ).to.be.a('number');
    });

    it('can be repositioned', function(){
      let newPos = { x: 1, y: 2 };

      ele.reposition( newPos );

      expect( ele.position ).to.deep.equal( newPos );
    });

    it('fires a reposition event when repositioned', function( done ){
      ele.on( 'reposition', done );

      ele.reposition({ x: 2, y: 3 });
    });
  });
});
