var Backbone = require("backbone");

/*
	method : "create" | "read" | "update" | "delete"
*/
Backbone.sync = function(method, model, options){

	console.log("Backbone.sync :: %s :: %j :: %j", method, model, options);

	switch(method){
	case "create":
		// put entry in db
		break;

	case "read":
		// get entry from db
		break;

	case "update":
		// update entry in db
		break;

	case"delete":
		// delete from db
		break;

	default:
		throw new Error("Backbone.sync encountered an invalid method `" + method + "`");
	}

};