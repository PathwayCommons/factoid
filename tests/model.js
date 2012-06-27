var model = require("../model");

module.exports = {
	"entity association": function( test ) {
		test.expect(1);

		var entity = new model.Entity();
		
		try {
			entity.associate("rad51");
		} catch(e){}
		
		test.ok( entity.get("uid") == null, "entity doesn't have uid set if not properly associated" );

		test.done();
	},

	"entity name": function( test ){
		test.expect(2);

		var entity = new model.Entity({
			name: "pcna"
		});
		var interaction = new model.Interaction();

		try {
			entity.set("name", null);
		} catch(e){}
		test.equal( entity.get("name"), "pcna", "entity name unchanged, i.e. can't be set to null" );

		test.ok( interaction.get("name") != null, "interaction has a default name" );

		test.done();
	},

	"protein retains type in entities collection": function( test ){
		test.expect(5);

		var entities = new model.Entities();
		var entity = new model.Entity();
		var protein = new model.Protein();
		var interaction = new model.Interaction();

		entities.add( entity );
		entities.add( protein );
		interaction.connect( protein );

		test.ok( entities.at(0) instanceof model.Entity, "entity is type entity" );
		test.ok( entities.at(1) instanceof model.Entity, "protein is type entity" );
		test.ok( entities.at(1) instanceof model.Protein, "protein is type protein" );
		test.ok( interaction.get("participants").at(0) instanceof model.Entity, "connected protein is type entity" );
		test.ok( interaction.get("participants").at(0) instanceof model.Protein, "connected protein is type protein" );

		test.done();
	},

	"connect interaction to entity": function( test ){
		test.expect(5);
		var changed;
		var added;

		var entity = new model.Entity();
		var interaction = new model.Interaction();

		// connect
		added = false;
		interaction.get("participants").on("add", function(){
			added = true;
		});

		interaction.connect( entity );
		test.equal( interaction.get("participants").at(0), entity, "interaction has entity" );
		test.ok( added, "participants `add` event triggered" );

		changed = false;
		interaction.on("change", function(){
			changed = true;
		});

		added = false;
		interaction.get("participants").on("add", function(){
			added = true;
		});

		// try connecting again
		try {
			interaction.connect( entity );
		} catch(e){}
		test.equal( interaction.get("participants").size(), 1, "interaction only has 1 entity" );
		test.ok( !changed, "interaction didn't fire any change event" );
		test.ok( !added, "interaction participants didn't fire any add event" );

		test.done();
	}
};