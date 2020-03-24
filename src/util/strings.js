import dice from 'dice-coefficient'; // sorensen dice coeff

function stringDistanceMetric(a, b){
  return 1 - dice(a, b);
}

function longestCommonPrefixLength(str1, str2){
  var minL = Math.min(str1.length, str2.length);
  let i = 0;
  while( i < minL ) {
    if ( str1[i] !== str2[i] ) {
      break;
    }

    i++;
  }

  return i;
}

const truncateString = ( text, maxChars = 150, texOverflow = '...' ) => {
  return text.length > maxChars ? `${text.slice( 0, maxChars )}${texOverflow}` : text;
};

export { stringDistanceMetric, longestCommonPrefixLength, truncateString };
