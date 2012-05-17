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

}

