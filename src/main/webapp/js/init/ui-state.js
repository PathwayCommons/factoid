UiState = {
		INIT: { name: "default state (i.e. app start/init state)" },
		ADD_EDGE: { name: "add edge state" },
		DELETE_EDGE: { name: "delete edge state" },
		ADD_ENTITY: { name: "add entity state" },
		ADD_INTERACTION: { name: "add interaction state" },
		
		currentState: null,
		
		enter: function(newState, options){
			
			options = $.extend({}, options);
			
			if( typeof options.before == typeof function(){} ){
				options.before();
			}
			
			if( newState == null ){
				$.console.error("Null new state to enter specified; make sure it exists in UiState");
				$.console.trace();
				return;
			}
			
			if( newState == UiState.currentState ){
				return; // if we're already in the state, don't do anything
			}
			
			var old_state = UiState.currentState;
			
			if( UiState.currentState.leave != null ){
				UiState.currentState.leave();
			}
			
			if( newState.enter != null ){
				newState.enter(options);
			}
			UiState.currentState = newState;
			
			$.log("Entered %s and automatically left %s", newState.name, old_state.name);
			
			if( typeof options.after == typeof function(){} ){
				options.after();
			}
		},
		
		leave: function(state, options){
			
			options = $.extend({}, options);
			
			if( typeof options.before == typeof function(){} ){
				options.before();
			}
			
			if( state == null ){
				$.console.warn("Leaving current state (%s) because the current state was not specified; did you accidentally make a typo?", UiState.currentState.name);
				state = UiState.currentState;
			}
			
			if( UiState.currentState != state ){
				$.log("Attempting to leave %s when in %s; not doing anything (you are probably just being extra safe)", state.name, UiState.currentState.name);
				return;
			}
			
			state.leave();
			UiState.currentState = UiState.INIT;
			$.log("Left state %s", state.name);
			
			if( typeof options.after == typeof function(){} ){
				options.after();
			}
		},
		
		enterInitState: function(){
			UiState.enter(UiState.INIT);
		},
		
		leaveCurrentState: function(){
			UiState.enterInitState();
		},
		
		inside: function(state){
			var ret = false;
			$.each(arguments, function(i, state){				
				if( state == UiState.currentState ){
					ret = true;
				}
			});
			
			return ret;
		}
};
UiState.currentState = UiState.INIT;