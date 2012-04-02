String.prototype.capitalize = function(){
	if( this.length > 0 ){
		var firstChar = this.charAt(0);
		var substr = this.substr(1);
		
		return firstChar.toUpperCase() + substr;
	}
};