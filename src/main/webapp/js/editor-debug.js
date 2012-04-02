$(function(){
	
	$("#debug").dialog({
		title: "Debugging tools"
	}).dialog("close");
	
	function toggle_debug(){
		if( $("#debug").is(":visible") ){
			$("#debug").dialog("close");
		} else {
			$("#debug").dialog("open");
		}
	}
	
	$("html").bind("keydown", function(e){
		if( e.which == 192 && e.shiftKey ){ // backtab with shift`
			toggle_debug();			
		} else if( e.which == 192 ){
			count++;

			if( count == 1 ){
				clearTimeout(timeout);
				timeout = setTimeout(function(){
					count = 0;
				}, time);
			} else if( count >= times ){
				toggle_debug();
			}
		}
	});
	
	var open = $('<div></div>');
	
	$("#debug").append(open);
	
	open.uploadbutton({
		url: util.absolute_url("json/upload"),
		label: "Load BioPAX from file",
		successText: function(){ return "Uploaded file" },
		startText: function(){ return "Uploading file..." },
		cancelText: function(){ return "Upload cancelled" },
		errorText: function(meta, msg){ return "Upload error"; },
		progressedText: function(meta){ return "Processing file..."; },
		success: function(meta, network){
			ui.load_network(network);
		}
	});
	
});