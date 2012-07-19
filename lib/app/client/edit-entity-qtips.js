$(function(){

  $('body').on( 'keyup change paste', '.name-input', _.debounce(function(){
    var $input = $(this);
    var val = $input.val();
    var lastVal = $input.attr('data-last-val');
    var entityId = $input.attr('data-id');
    var entity = doc.entity( entityId );

    if( lastVal === val ){ return; }
    $input.attr('data-last-val', val);

    var lastChangeTime = parseInt( $input.attr('data-last-val-time') ) || 0;
    var thisChangeTime = +new Date;
    $input.attr('data-last-val-time', thisChangeTime);

    var textminingHandler = function(err, entities){
      var thisQueryIsTheLatestOne = thisChangeTime >= lastChangeTime;
      if( !thisQueryIsTheLatestOne ){ return; }

      if( err ){
        console.log('TODO if textmining tried 3 times and still fails, then show an error message in the ui');
      } else {
        //doc.setPotentialAssociationsForEntity(entityId, entities);
      }
      
    };

    if( !entity.interaction ){
      textmining.getAssociatedEntitiesFromQuery(val, textminingHandler);
    }

  }, 100) );

});