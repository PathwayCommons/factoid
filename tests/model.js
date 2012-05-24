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
		test.expect(1);

		var entity = new model.Entity({
			name: "pcna"
		});

		try {
			entity.set("name", null);
		} catch(e){}

		test.equal( entity.get("name"), "pcna", "entity name unchanged" );

		test.done();
	},

	"connect interaction to entity": function( test ){
		test.expect(4);

		var entity = new model.Entity();
		var interaction = new model.Interaction();

		// connect
		interaction.connect( entity );
		test.equal( interaction.get("participants").at(0), entity, "interaction has entity" );

		var changed = false;
		interaction.on("change", function(){
			changed = true;
		});

		var added = false;
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