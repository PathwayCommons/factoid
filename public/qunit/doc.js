$(function(){
  
  module('doc', {
    setup: function(){
      doc.removeAllEntities(); // so we start fresh
    },

    teardown: function(){
      doc.removeAllEntities(); // so we don't break some other test
    }
  });

  test('doc.addEntity()', function(){
    doc.removeAllEntities(); // so we start fresh

    var triggers = 0;
    var ent, ent2, listEnt;
    doc.addEntity(function(entity){ // listen for when entities are added
      triggers++;
      listEnt = entity;
    });

    equal( doc.entities().length, 0, 'should start empty' );

    ent = doc.addEntity();
    equal( doc.entities().length, 1, 'doc has an entity' );
    ok( ent.id != null, 'entity has some id' );
    equal( triggers, 1, 'listener was triggered' );
    ok( ent.name != null, 'entity has some kind of default name' );
    ok( ent.entity, 'entity has .entity boolean' );
    equal( ent.type, 'entity', 'new entity defaults to "entity" type' );
    deepEqual( listEnt, ent, '1st listener callback entity' );

    ent2 = doc.addEntity();
    equal( doc.entities().length, 2, '2nd entity added to pool & 1st one still there' );
    deepEqual( listEnt, ent2, '2nd listener callback entity' );

  });

  test('doc.entity()', function(){
    doc.removeAllEntities(); // so we start fresh

    var ent = doc.addEntity({ id: 'foo' });
    var entFromDoc = doc.entity('foo');
    deepEqual( ent, entFromDoc, 'entity is the same as when gotten from the doc' );
  });

  test('doc.addInteraction()', function(){
    doc.removeAllEntities(); // so we start fresh

    var inter = doc.addInteraction({ id: 'inter' });
    equal( doc.entities().length, 1, 'doc has an entity' );
  });

  test('doc.connectEntityToInteraction()', function(){
    doc.removeAllEntities(); // so we start fresh

    var foo = doc.addEntity({ id: 'foo' });
    var inter = doc.addInteraction({ id: 'inter' });

    doc.connectEntityToInteraction('foo', 'inter');
    equal( doc.entity('inter').participantIds[0], 'foo', 'foo in participantIds' );
    equal( doc.entity('inter').participantIds.length, 1, 'only 1 participant id' );
  });

  test('doc.removeEntity()', function(){
    doc.removeAllEntities(); // so we start fresh

    var triggers = 0;
    var listId;
    doc.removeEntity(function(id){
      triggers++;
      listId = id;
    });

    equal( doc.entities().length, 0, 'should start empty' );

    var foo = doc.addEntity({ id: 'foo' });
    var bar = doc.addEntity({ id: 'bar' });
    var inter = doc.addInteraction({ id: 'inter' });

    equal( doc.entities().length, 3, 'doc has 3 entities' );

    doc.removeEntity('foo');
    equal( doc.entities().length, 2, 'entities left after removing foo' );
    deepEqual( doc.entity('bar'), bar, 'bar is still there and the same' );
    deepEqual( doc.entity('inter'), inter, 'inter is still there and the same' );
    equal( triggers, 1, 'handler got triggered for removing foo' );
    equal( listId, 'foo', 'id passed to handler for removing foo' );

    doc.connectEntityToInteraction('bar', 'inter');
    doc.removeEntity('bar');
    equal( doc.entity('inter').participantIds.length, 1, 'number of participant ids for inter after removing bar' );
    equal( triggers, 2, 'handler got triggered for removing bar' );
    equal( listId, 'bar', 'id passed to handler for removing bar' );
  });

  

});