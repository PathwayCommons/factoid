let typeofObj = typeof {};
let typeofWin = typeof window;

function isClient(){
  return typeofWin === typeofObj;
}

function isServer(){
  return !isClient();
}

function isDoi( str ){
  // 99.3% of CrossRef DOIs (https://www.crossref.org/blog/dois-and-matching-regular-expressions/)
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
  return doiRegex.test( str );
}

function isDigits( str ){
  const digitsRegex = /^[0-9.]+$/;
  return  digitsRegex.test( str );
}

export { isClient, isServer, isDoi, isDigits };
