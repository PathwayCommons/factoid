NodeType = {

	// defined via ajax call to server
		
	fromVal: function(val){

		for(var name in NodeType){
			var type = NodeType[name];
			
			if( $.isPlainObject(val) ){
				if( type == val ){
					return type;
				}
			} else if( type != null && 
					type.val != null && typeof type.val == typeof "" && typeof val == typeof "" &&
					type.val.toLowerCase() == val.toLowerCase() ){
				return type;
			}
			
		}
		
		return null;
	}
};