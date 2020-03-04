/**
 * HTTPStatusError
 *
 * Class representing a Fetch Response error
 */
class HTTPStatusError extends Error {
  constructor( message, status, statusText ) {
    super( message );
    this.status = status;
    this.statusText = statusText;
    this.name = 'HTTPStatusError';
  }
}

/**
 * checkHTTPStatus
 *
 * Check that the Fetch Response is ok or throw an error
 *
 * @param {Object} response the (node-)Fetch [response]{@link https://developer.mozilla.org/en-US/docs/Web/API/Response}
 * @returns {Object} response the (node-)Fetch [response]{@link https://developer.mozilla.org/en-US/docs/Web/API/Response}
 * @throws {HTTPStatusError} when response.status is > 200 or >= 300
 */
const checkHTTPStatus = response => {
  const { statusText, status, ok } = response;
  if ( !ok ) {
    throw new HTTPStatusError( `${statusText} (${status})`, status, statusText );
  }
  return response;
};


export { checkHTTPStatus, HTTPStatusError };