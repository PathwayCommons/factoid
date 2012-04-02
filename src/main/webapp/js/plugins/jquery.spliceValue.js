;(function($){
	
	$.spliceValue = function(array, value){
		
		var copy = [];
		
		for(var i = 0; i < array.length; i++){
			copy[i] = array[i];
		}
		
		var indices = [];
		
		for(var i = 0; i < copy.length; i++){
			if( copy[i] == value ){
				indices.push(i);
			}
		}
		
		for(var i = 0; i < copy.length; i++){
			if( copy[i] == value ){
				copy.splice(i, 1);
				i--;
			}
		}
	
		return {
			array: copy,
			indices: indices
		};
		
	};
	
})(jQuery); 