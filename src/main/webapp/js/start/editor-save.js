ui.save = function(){
	
	$("#menubar-save").menubar("disable");
	var network = cy.exportTo({
		name: "json"
	});
	
	$("#menubar-save").menubar("icon", "ui-icon-loading");
	
	var max_tries = 3;
	var tries = 0;
	var reset_delay = 1000;
	
	function delayedReenable(){
		setTimeout(function(){
			$("#menubar-save").menubar("icon", "ui-icon-noun ui-icon-upload-alt-1");
			$("#menubar-save").menubar("enable");
		}, reset_delay);
	}
	
	function try_save(){
		$.ajax({
			type: "POST",
			url: util.absolute_url("json/cytoweb/save"),
			data: {
				id: "foo", // TODO replace with real id
				network: JSON.stringify(network)
			},
			success: function(){
				$("#menubar-save").menubar("icon", "ui-icon-noun ui-icon-check-mark");
				delayedReenable();
			}, 
			error: function(jqXHR, textStatus, errorThrown){
				tries++;
				if( tries < max_tries ){
					try_save();
				} else {
					$("#menubar-save").menubar("icon", "ui-icon-noun ui-icon-no");
					delayedReenable();
				}
			}
		});
	}
	
	function fake_save(){
		setTimeout(function(){
			$("#menubar-save").menubar("icon", "ui-icon-noun ui-icon-check-mark");
			delayedReenable();
		}, 3000);
	}
	
	//try_save();
	fake_save();
	
};