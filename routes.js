var textmining = require("./textmining");

// Define the controllers for the server
exports.listen = function( app ){

	app.get("/editor", function(req, res){
		res.render('editor', {
			title: "Factoid",
			namespaces: ["editor"]
		});
	});

	app.error(function(err, req, res, next){
		res.render('error');
	});

	app.get("/", function(req, res){
		res.render('home', { title: "Factoid" });
	});

	app.get("/style", function(req, res){
		res.render('style', { title: "CSS style demo" });
	});

	app.get("/user/:id", function(req, res){
		res.json({ id: req.params.id, name: "Max", "is": "awesome" });
	});

	app.get("/mine", function(req, res){
		textmining.mine({
			text: "Chromosomal double-strand breaks (DSBs) have the potential to permanently arrest cell cycle progression and endanger cell survival. They must therefore be efficiently repaired to preserve genome integrity and functionality. Homologous recombination (HR) provides an important error-free mechanism for DSB repair in mammalian cells. In addition to RAD51, the central recombinase activity in mammalian cells, a family of proteins known as the RAD51 paralogs and consisting of five proteins (RAD51B, RAD51C, RAD51D, XRCC2 and XRCC3), play an essential role in the DNA repair reactions through HR. The RAD51 paralogs act to transduce the DNA damage signal to effector kinases and to promote break repair. However, their precise cellular functions are not fully elucidated. Here we discuss recent advances in our understanding of how these factors mediate checkpoint responses and act in the HR repair process. In addition, we highlight potential functional similarities with the BRCA2 tumour suppressor, through the recently reported links between RAD51 paralog deficiencies and tumorigenesis triggered by genome instability."
		}, function(r){
			res.json(r);
		});
	});

}
