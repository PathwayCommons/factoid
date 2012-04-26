;(function($){
	
	$.sortedEach = function(set, fn, sortfn){
		if( typeof set == "object" ){

			if( set.length != null ){
				
				var sorted = [];
				for(var i = 0; i < set.length; i++){
					sorted.push( set[i] );
				}
				sorted.sort(sortfn);
				$.each(sorted, fn);
			} else {
				
				var ins = [];
				for(var i in set){
					ins.push(i);
				}
				ins.sort(sortfn);
				
				$.each(ins, function(i, index){
					fn(index, set[index]);
				});
			}
			
		}
	};
	
})(jQuery); 