(function($){

$.fn.quickeq = function(index){
  var set = $(this);
  var elem = $([1]);
  var size = set.length;

  if( index < 0 ){
    index = size - 1 + index;
  } 

  if( index < 0 || index >= size ){
    return null; 
  }

  (elem.context = elem[0] = set[index]);

  return elem;
};

})( jQuery );