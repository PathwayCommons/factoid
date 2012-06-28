/*! Socket.IO.js build:0.9.6, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * IO namespace.
   *
   * @namespace
   */

  var io = exports;

  /**
   * Socket.IO version
   *
   * @api public
   */

  io.version = '0.9.6';

  /**
   * Protocol implemented.
   *
   * @api public
   */

  io.protocol = 1;

  /**
   * Available transports, these will be populated with the available transports
   *
   * @api public
   */

  io.transports = [];

  /**
   * Keep track of jsonp callbacks.
   *
   * @api private
   */

  io.j = [];

  /**
   * Keep track of our io.Sockets
   *
   * @api private
   */
  io.sockets = {};


  /**
   * Manages connections to hosts.
   *
   * @param {String} uri
   * @Param {Boolean} force creation of new socket (defaults to false)
   * @api public
   */

  io.connect = function (host, details) {
    var uri = io.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = io.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    io.util.merge(options, details);

    if (options['force new connection'] || !io.sockets[uuri]) {
      socket = new io.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      io.sockets[uuri] = socket;
    }

    socket = socket || io.sockets[uuri];

    // if path is different from '' or /
    return socket.of(uri.path.length > 1 ? uri.path : '');
  };

})('object' === typeof module ? module.exports : (this.io = {}), this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * Utilities namespace.
   *
   * @namespace
   */

  var util = exports.util = {};

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api public
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
               'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
               'anchor'];

  util.parseUri = function (str) {
    var m = re.exec(str || '')
      , uri = {}
      , i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  /**
   * Produces a unique url that identifies a Socket.IO connection.
   *
   * @param {Object} uri
   * @api public
   */

  util.uniqueUri = function (uri) {
    var protocol = uri.protocol
      , host = uri.host
      , port = uri.port;

    if ('document' in global) {
      host = host || document.domain;
      port = port || (protocol == 'https'
        && document.location.protocol !== 'https:' ? 443 : document.location.port);
    } else {
      host = host || 'localhost';

      if (!port && protocol == 'https') {
        port = 443;
      }
    }

    return (protocol || 'http') + '://' + host + ':' + (port || 80);
  };

  /**
   * Mergest 2 query strings in to once unique query string
   *
   * @param {String} base
   * @param {String} addition
   * @api public
   */

  util.query = function (base, addition) {
    var query = util.chunkQuery(base || '')
      , components = [];

    util.merge(query, util.chunkQuery(addition || ''));
    for (var part in query) {
      if (query.hasOwnProperty(part)) {
        components.push(part + '=' + query[part]);
      }
    }

    return components.length ? '?' + components.join('&') : '';
  };

  /**
   * Transforms a querystring in to an object
   *
   * @param {String} qs
   * @api public
   */

  util.chunkQuery = function (qs) {
    var query = {}
      , params = qs.split('&')
      , i = 0
      , l = params.length
      , kv;

    for (; i < l; ++i) {
      kv = params[i].split('=');
      if (kv[0]) {
        query[kv[0]] = kv[1];
      }
    }

    return query;
  };

  /**
   * Executes the given function when the page is loaded.
   *
   *     io.util.load(function () { console.log('page loaded'); });
   *
   * @param {Function} fn
   * @api public
   */

  var pageLoaded = false;

  util.load = function (fn) {
    if ('document' in global && document.readyState === 'complete' || pageLoaded) {
      return fn();
    }

    util.on(global, 'load', fn, false);
  };

  /**
   * Adds an event.
   *
   * @api private
   */

  util.on = function (element, event, fn, capture) {
    if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    } else if (element.addEventListener) {
      element.addEventListener(event, fn, capture);
    }
  };

  /**
   * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
   *
   * @param {Boolean} [xdomain] Create a request that can be used cross domain.
   * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
   * @api private
   */

  util.request = function (xdomain) {

    if (xdomain && 'undefined' != typeof XDomainRequest) {
      return new XDomainRequest();
    }

    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }

    if (!xdomain) {
      try {
        return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
      } catch(e) { }
    }

    return null;
  };

  /**
   * XHR based transport constructor.
   *
   * @constructor
   * @api public
   */

  /**
   * Change the internal pageLoaded value.
   */

  if ('undefined' != typeof window) {
    util.load(function () {
      pageLoaded = true;
    });
  }

  /**
   * Defers a function to ensure a spinner is not displayed by the browser
   *
   * @param {Function} fn
   * @api public
   */

  util.defer = function (fn) {
    if (!util.ua.webkit || 'undefined' != typeof importScripts) {
      return fn();
    }

    util.load(function () {
      setTimeout(fn, 100);
    });
  };

  /**
   * Merges two objects.
   *
   * @api public
   */
  
  util.merge = function merge (target, additional, deep, lastseen) {
    var seen = lastseen || []
      , depth = typeof deep == 'undefined' ? 2 : deep
      , prop;

    for (prop in additional) {
      if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
        if (typeof target[prop] !== 'object' || !depth) {
          target[prop] = additional[prop];
          seen.push(additional[prop]);
        } else {
          util.merge(target[prop], additional[prop], depth - 1, seen);
        }
      }
    }

    return target;
  };

  /**
   * Merges prototypes from objects
   *
   * @api public
   */
  
  util.mixin = function (ctor, ctor2) {
    util.merge(ctor.prototype, ctor2.prototype);
  };

  /**
   * Shortcut for prototypical and static inheritance.
   *
   * @api private
   */

  util.inherit = function (ctor, ctor2) {
    function f() {};
    f.prototype = ctor2.prototype;
    ctor.prototype = new f;
  };

  /**
   * Checks if the given object is an Array.
   *
   *     io.util.isArray([]); // true
   *     io.util.isArray({}); // false
   *
   * @param Object obj
   * @api public
   */

  util.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Intersects values of two arrays into a third
   *
   * @api public
   */

  util.intersect = function (arr, arr2) {
    var ret = []
      , longest = arr.length > arr2.length ? arr : arr2
      , shortest = arr.length > arr2.length ? arr2 : arr;

    for (var i = 0, l = shortest.length; i < l; i++) {
      if (~util.indexOf(longest, shortest[i]))
        ret.push(shortest[i]);
    }

    return ret;
  }

  /**
   * Array indexOf compatibility.
   *
   * @see bit.ly/a5Dxa2
   * @api public
   */

  util.indexOf = function (arr, o, i) {
    
    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; 
         i < j && arr[i] !== o; i++) {}

    return j <= i ? -1 : i;
  };

  /**
   * Converts enumerables to array.
   *
   * @api public
   */

  util.toArray = function (enu) {
    var arr = [];

    for (var i = 0, l = enu.length; i < l; i++)
      arr.push(enu[i]);

    return arr;
  };

  /**
   * UA / engines detection namespace.
   *
   * @namespace
   */

  util.ua = {};

  /**
   * Whether the UA supports CORS for XHR.
   *
   * @api public
   */

  util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
    try {
      var a = new XMLHttpRequest();
    } catch (e) {
      return false;
    }

    return a.withCredentials != undefined;
  })();

  /**
   * Detect webkit.
   *
   * @api public
   */

  util.ua.webkit = 'undefined' != typeof navigator
    && /webkit/i.test(navigator.userAgent);

})('undefined' != typeof io ? io : module.exports, this);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Event emitter constructor.
   *
   * @api public.
   */

  function EventEmitter () {};

  /**
   * Adds a listener
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (io.util.isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on () {
      self.removeListener(name, on);
      fn.apply(this, arguments);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (io.util.isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    // TODO: enable this when node 0.5 is stable
    //if (name === undefined) {
      //this.$events = {};
      //return this;
    //}

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api publci
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!io.util.isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (io.util.isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Based on JSON2 (http://www.JSON.org/js.html).
 */

(function (exports, nativeJSON) {
  "use strict";

  // use native JSON if it's available
  if (nativeJSON && nativeJSON.parse){
    return exports.JSON = {
      parse: nativeJSON.parse
    , stringify: nativeJSON.stringify
    }
  }

  var JSON = exports.JSON = {};

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  function date(d, key) {
    return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
  };

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      },
      rep;


  function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
              '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
  }


  function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value instanceof Date) {
          value = date(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
      case 'string':
          return quote(value);

      case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

      case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
              return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || 'null';
              }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

              v = partial.length === 0 ? '[]' : gap ?
                  '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                  '[' + partial.join(',') + ']';
              gap = mind;
              return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          } else {

// Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0 ? '{}' : gap ?
              '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
  }

// If the JSON object does not yet have a stringify method, give it one.

  JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
              (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
  };

// If the JSON object does not yet have a parse method, give it one.

  JSON.parse = function (text, reviver) {
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.

          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }


  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.

  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.

          j = eval('(' + text + ')');

  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

  // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
  };

})(
    'undefined' != typeof io ? io : module.exports
  , typeof JSON !== 'undefined' ? JSON : undefined
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Parser namespace.
   *
   * @namespace
   */

  var parser = exports.parser = {};

  /**
   * Packet types.
   */

  var packets = parser.packets = [
      'disconnect'
    , 'connect'
    , 'heartbeat'
    , 'message'
    , 'json'
    , 'event'
    , 'ack'
    , 'error'
    , 'noop'
  ];

  /**
   * Errors reasons.
   */

  var reasons = parser.reasons = [
      'transport not supported'
    , 'client not handshaken'
    , 'unauthorized'
  ];

  /**
   * Errors advice.
   */

  var advice = parser.advice = [
      'reconnect'
  ];

  /**
   * Shortcuts.
   */

  var JSON = io.JSON
    , indexOf = io.util.indexOf;

  /**
   * Encodes a packet.
   *
   * @api private
   */

  parser.encodePacket = function (packet) {
    var type = indexOf(packets, packet.type)
      , id = packet.id || ''
      , endpoint = packet.endpoint || ''
      , ack = packet.ack
      , data = null;

    switch (packet.type) {
      case 'error':
        var reason = packet.reason ? indexOf(reasons, packet.reason) : ''
          , adv = packet.advice ? indexOf(advice, packet.advice) : '';

        if (reason !== '' || adv !== '')
          data = reason + (adv !== '' ? ('+' + adv) : '');

        break;

      case 'message':
        if (packet.data !== '')
          data = packet.data;
        break;

      case 'event':
        var ev = { name: packet.name };

        if (packet.args && packet.args.length) {
          ev.args = packet.args;
        }

        data = JSON.stringify(ev);
        break;

      case 'json':
        data = JSON.stringify(packet.data);
        break;

      case 'connect':
        if (packet.qs)
          data = packet.qs;
        break;

      case 'ack':
        data = packet.ackId
          + (packet.args && packet.args.length
              ? '+' + JSON.stringify(packet.args) : '');
        break;
    }

    // construct packet with required fragments
    var encoded = [
        type
      , id + (ack == 'data' ? '+' : '')
      , endpoint
    ];

    // data fragment is optional
    if (data !== null && data !== undefined)
      encoded.push(data);

    return encoded.join(':');
  };

  /**
   * Encodes multiple messages (payload).
   *
   * @param {Array} messages
   * @api private
   */

  parser.encodePayload = function (packets) {
    var decoded = '';

    if (packets.length == 1)
      return packets[0];

    for (var i = 0, l = packets.length; i < l; i++) {
      var packet = packets[i];
      decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
    }

    return decoded;
  };

  /**
   * Decodes a packet
   *
   * @api private
   */

  var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

  parser.decodePacket = function (data) {
    var pieces = data.match(regexp);

    if (!pieces) return {};

    var id = pieces[2] || ''
      , data = pieces[5] || ''
      , packet = {
            type: packets[pieces[1]]
          , endpoint: pieces[4] || ''
        };

    // whether we need to acknowledge the packet
    if (id) {
      packet.id = id;
      if (pieces[3])
        packet.ack = 'data';
      else
        packet.ack = true;
    }

    // handle different packet types
    switch (packet.type) {
      case 'error':
        var pieces = data.split('+');
        packet.reason = reasons[pieces[0]] || '';
        packet.advice = advice[pieces[1]] || '';
        break;

      case 'message':
        packet.data = data || '';
        break;

      case 'event':
        try {
          var opts = JSON.parse(data);
          packet.name = opts.name;
          packet.args = opts.args;
        } catch (e) { }

        packet.args = packet.args || [];
        break;

      case 'json':
        try {
          packet.data = JSON.parse(data);
        } catch (e) { }
        break;

      case 'connect':
        packet.qs = data || '';
        break;

      case 'ack':
        var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
        if (pieces) {
          packet.ackId = pieces[1];
          packet.args = [];

          if (pieces[3]) {
            try {
              packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
            } catch (e) { }
          }
        }
        break;

      case 'disconnect':
      case 'heartbeat':
        break;
    };

    return packet;
  };

  /**
   * Decodes data payload. Detects multiple messages
   *
   * @return {Array} messages
   * @api public
   */

  parser.decodePayload = function (data) {
    // IE doesn't like data[i] for unicode chars, charAt works fine
    if (data.charAt(0) == '\ufffd') {
      var ret = [];

      for (var i = 1, length = ''; i < data.length; i++) {
        if (data.charAt(i) == '\ufffd') {
          ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
          i += Number(length) + 1;
          length = '';
        } else {
          length += data.charAt(i);
        }
      }

      return ret;
    } else {
      return [parser.decodePacket(data)];
    }
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.Transport = Transport;

  /**
   * This is the transport template for all supported transport methods.
   *
   * @constructor
   * @api public
   */

  function Transport (socket, sessid) {
    this.socket = socket;
    this.sessid = sessid;
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Transport, io.EventEmitter);

  /**
   * Handles the response from the server. When a new response is received
   * it will automatically update the timeout, decode the message and
   * forwards the response to the onMessage function for further processing.
   *
   * @param {String} data Response from the server.
   * @api private
   */

  Transport.prototype.onData = function (data) {
    this.clearCloseTimeout();
    
    // If the connection in currently open (or in a reopening state) reset the close 
    // timeout since we have just received data. This check is necessary so
    // that we don't reset the timeout on an explicitly disconnected connection.
    if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
      this.setCloseTimeout();
    }

    if (data !== '') {
      // todo: we should only do decodePayload for xhr transports
      var msgs = io.parser.decodePayload(data);

      if (msgs && msgs.length) {
        for (var i = 0, l = msgs.length; i < l; i++) {
          this.onPacket(msgs[i]);
        }
      }
    }

    return this;
  };

  /**
   * Handles packets.
   *
   * @api private
   */

  Transport.prototype.onPacket = function (packet) {
    this.socket.setHeartbeatTimeout();

    if (packet.type == 'heartbeat') {
      return this.onHeartbeat();
    }

    if (packet.type == 'connect' && packet.endpoint == '') {
      this.onConnect();
    }

    if (packet.type == 'error' && packet.advice == 'reconnect') {
      this.open = false;
    }

    this.socket.onPacket(packet);

    return this;
  };

  /**
   * Sets close timeout
   *
   * @api private
   */
  
  Transport.prototype.setCloseTimeout = function () {
    if (!this.closeTimeout) {
      var self = this;

      this.closeTimeout = setTimeout(function () {
        self.onDisconnect();
      }, this.socket.closeTimeout);
    }
  };

  /**
   * Called when transport disconnects.
   *
   * @api private
   */

  Transport.prototype.onDisconnect = function () {
    if (this.close && this.open) this.close();
    this.clearTimeouts();
    this.socket.onDisconnect();
    return this;
  };

  /**
   * Called when transport connects
   *
   * @api private
   */

  Transport.prototype.onConnect = function () {
    this.socket.onConnect();
    return this;
  }

  /**
   * Clears close timeout
   *
   * @api private
   */

  Transport.prototype.clearCloseTimeout = function () {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  };

  /**
   * Clear timeouts
   *
   * @api private
   */

  Transport.prototype.clearTimeouts = function () {
    this.clearCloseTimeout();

    if (this.reopenTimeout) {
      clearTimeout(this.reopenTimeout);
    }
  };

  /**
   * Sends a packet
   *
   * @param {Object} packet object.
   * @api private
   */

  Transport.prototype.packet = function (packet) {
    this.send(io.parser.encodePacket(packet));
  };

  /**
   * Send the received heartbeat message back to server. So the server
   * knows we are still connected.
   *
   * @param {String} heartbeat Heartbeat response from the server.
   * @api private
   */

  Transport.prototype.onHeartbeat = function (heartbeat) {
    this.packet({ type: 'heartbeat' });
  };
 
  /**
   * Called when the transport opens.
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.open = true;
    this.clearCloseTimeout();
    this.socket.onOpen();
  };

  /**
   * Notifies the base when the connection with the Socket.IO server
   * has been disconnected.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    var self = this;

    /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

    this.open = false;
    this.socket.onClose();
    this.onDisconnect();
  };

  /**
   * Generates a connection url based on the Socket.IO URL Protocol.
   * See <https://github.com/learnboost/socket.io-node/> for more details.
   *
   * @returns {String} Connection url
   * @api private
   */

  Transport.prototype.prepareUrl = function () {
    var options = this.socket.options;

    return this.scheme() + '://'
      + options.host + ':' + options.port + '/'
      + options.resource + '/' + io.protocol
      + '/' + this.name + '/' + this.sessid;
  };

  /**
   * Checks if the transport is ready to start a connection.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Transport.prototype.ready = function (socket, fn) {
    fn.call(this);
  };
})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.Socket = Socket;

  /**
   * Create a new `Socket.IO client` which can establish a persistent
   * connection with a Socket.IO enabled server.
   *
   * @api public
   */

  function Socket (options) {
    this.options = {
        port: 80
      , secure: false
      , document: 'document' in global ? document : false
      , resource: 'socket.io'
      , transports: io.transports
      , 'connect timeout': 10000
      , 'try multiple transports': true
      , 'reconnect': true
      , 'reconnection delay': 500
      , 'reconnection limit': Infinity
      , 'reopen delay': 3000
      , 'max reconnection attempts': 10
      , 'sync disconnect on unload': true
      , 'auto connect': true
      , 'flash policy port': 10843
    };

    io.util.merge(this.options, options);

    this.connected = false;
    this.open = false;
    this.connecting = false;
    this.reconnecting = false;
    this.namespaces = {};
    this.buffer = [];
    this.doBuffer = false;

    if (this.options['sync disconnect on unload'] &&
        (!this.isXDomain() || io.util.ua.hasCORS)) {
      var self = this;

      io.util.on(global, 'unload', function () {
        self.disconnectSync();
      }, false);
    }

    if (this.options['auto connect']) {
      this.connect();
    }
};

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Socket, io.EventEmitter);

  /**
   * Returns a namespace listener/emitter for this socket
   *
   * @api public
   */

  Socket.prototype.of = function (name) {
    if (!this.namespaces[name]) {
      this.namespaces[name] = new io.SocketNamespace(this, name);

      if (name !== '') {
        this.namespaces[name].packet({ type: 'connect' });
      }
    }

    return this.namespaces[name];
  };

  /**
   * Emits the given event to the Socket and all namespaces
   *
   * @api private
   */

  Socket.prototype.publish = function () {
    this.emit.apply(this, arguments);

    var nsp;

    for (var i in this.namespaces) {
      if (this.namespaces.hasOwnProperty(i)) {
        nsp = this.of(i);
        nsp.$emit.apply(nsp, arguments);
      }
    }
  };

  /**
   * Performs the handshake
   *
   * @api private
   */

  function empty () { };

  Socket.prototype.handshake = function (fn) {
    var self = this
      , options = this.options;

    function complete (data) {
      if (data instanceof Error) {
        self.onError(data.message);
      } else {
        fn.apply(null, data.split(':'));
      }
    };

    var url = [
          'http' + (options.secure ? 's' : '') + ':/'
        , options.host + ':' + options.port
        , options.resource
        , io.protocol
        , io.util.query(this.options.query, 't=' + +new Date)
      ].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
      var insertAt = document.getElementsByTagName('script')[0]
        , script = document.createElement('script');

      script.src = url + '&jsonp=' + io.j.length;
      insertAt.parentNode.insertBefore(script, insertAt);

      io.j.push(function (data) {
        complete(data);
        script.parentNode.removeChild(script);
      });
    } else {
      var xhr = io.util.request();

      xhr.open('GET', url, true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;

          if (xhr.status == 200) {
            complete(xhr.responseText);
          } else {
            !self.reconnecting && self.onError(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  /**
   * Find an available transport based on the options supplied in the constructor.
   *
   * @api private
   */

  Socket.prototype.getTransport = function (override) {
    var transports = override || this.transports, match;

    for (var i = 0, transport; transport = transports[i]; i++) {
      if (io.Transport[transport]
        && io.Transport[transport].check(this)
        && (!this.isXDomain() || io.Transport[transport].xdomainCheck())) {
        return new io.Transport[transport](this, this.sessionid);
      }
    }

    return null;
  };

  /**
   * Connects to the server.
   *
   * @param {Function} [fn] Callback.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.connect = function (fn) {
    if (this.connecting) {
      return this;
    }

    var self = this;

    this.handshake(function (sid, heartbeat, close, transports) {
      self.sessionid = sid;
      self.closeTimeout = close * 1000;
      self.heartbeatTimeout = heartbeat * 1000;
      self.transports = transports ? io.util.intersect(
          transports.split(',')
        , self.options.transports
      ) : self.options.transports;

      self.setHeartbeatTimeout();

      function connect (transports){
        if (self.transport) self.transport.clearTimeouts();

        self.transport = self.getTransport(transports);
        if (!self.transport) return self.publish('connect_failed');

        // once the transport is ready
        self.transport.ready(self, function () {
          self.connecting = true;
          self.publish('connecting', self.transport.name);
          self.transport.open();

          if (self.options['connect timeout']) {
            self.connectTimeoutTimer = setTimeout(function () {
              if (!self.connected) {
                self.connecting = false;

                if (self.options['try multiple transports']) {
                  if (!self.remainingTransports) {
                    self.remainingTransports = self.transports.slice(0);
                  }

                  var remaining = self.remainingTransports;

                  while (remaining.length > 0 && remaining.splice(0,1)[0] !=
                         self.transport.name) {}

                    if (remaining.length){
                      connect(remaining);
                    } else {
                      self.publish('connect_failed');
                    }
                }
              }
            }, self.options['connect timeout']);
          }
        });
      }

      connect(self.transports);

      self.once('connect', function (){
        clearTimeout(self.connectTimeoutTimer);

        fn && typeof fn == 'function' && fn();
      });
    });

    return this;
  };

  /**
   * Clears and sets a new heartbeat timeout using the value given by the
   * server during the handshake.
   *
   * @api private
   */

  Socket.prototype.setHeartbeatTimeout = function () {
    clearTimeout(this.heartbeatTimeoutTimer);

    var self = this;
    this.heartbeatTimeoutTimer = setTimeout(function () {
      self.transport.onClose();
    }, this.heartbeatTimeout);
  };

  /**
   * Sends a message.
   *
   * @param {Object} data packet.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.packet = function (data) {
    if (this.connected && !this.doBuffer) {
      this.transport.packet(data);
    } else {
      this.buffer.push(data);
    }

    return this;
  };

  /**
   * Sets buffer state
   *
   * @api private
   */

  Socket.prototype.setBuffer = function (v) {
    this.doBuffer = v;

    if (!v && this.connected && this.buffer.length) {
      this.transport.payload(this.buffer);
      this.buffer = [];
    }
  };

  /**
   * Disconnect the established connect.
   *
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.disconnect = function () {
    if (this.connected || this.connecting) {
      if (this.open) {
        this.of('').packet({ type: 'disconnect' });
      }

      // handle disconnection immediately
      this.onDisconnect('booted');
    }

    return this;
  };

  /**
   * Disconnects the socket with a sync XHR.
   *
   * @api private
   */

  Socket.prototype.disconnectSync = function () {
    // ensure disconnection
    var xhr = io.util.request()
      , uri = this.resource + '/' + io.protocol + '/' + this.sessionid;

    xhr.open('GET', uri, true);

    // handle disconnection immediately
    this.onDisconnect('booted');
  };

  /**
   * Check if we need to use cross domain enabled transports. Cross domain would
   * be a different port or different domain name.
   *
   * @returns {Boolean}
   * @api private
   */

  Socket.prototype.isXDomain = function () {

    var port = global.location.port ||
      ('https:' == global.location.protocol ? 443 : 80);

    return this.options.host !== global.location.hostname 
      || this.options.port != port;
  };

  /**
   * Called upon handshake.
   *
   * @api private
   */

  Socket.prototype.onConnect = function () {
    if (!this.connected) {
      this.connected = true;
      this.connecting = false;
      if (!this.doBuffer) {
        // make sure to flush the buffer
        this.setBuffer(false);
      }
      this.emit('connect');
    }
  };

  /**
   * Called when the transport opens
   *
   * @api private
   */

  Socket.prototype.onOpen = function () {
    this.open = true;
  };

  /**
   * Called when the transport closes.
   *
   * @api private
   */

  Socket.prototype.onClose = function () {
    this.open = false;
    clearTimeout(this.heartbeatTimeoutTimer);
  };

  /**
   * Called when the transport first opens a connection
   *
   * @param text
   */

  Socket.prototype.onPacket = function (packet) {
    this.of(packet.endpoint).onPacket(packet);
  };

  /**
   * Handles an error.
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    if (err && err.advice) {
      if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
        this.disconnect();
        if (this.options.reconnect) {
          this.reconnect();
        }
      }
    }

    this.publish('error', err && err.reason ? err.reason : err);
  };

  /**
   * Called when the transport disconnects.
   *
   * @api private
   */

  Socket.prototype.onDisconnect = function (reason) {
    var wasConnected = this.connected
      , wasConnecting = this.connecting;

    this.connected = false;
    this.connecting = false;
    this.open = false;

    if (wasConnected || wasConnecting) {
      this.transport.close();
      this.transport.clearTimeouts();
      if (wasConnected) {
        this.publish('disconnect', reason);

        if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
          this.reconnect();
        }
      }
    }
  };

  /**
   * Called upon reconnection.
   *
   * @api private
   */

  Socket.prototype.reconnect = function () {
    this.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.reconnectionDelay = this.options['reconnection delay'];

    var self = this
      , maxAttempts = this.options['max reconnection attempts']
      , tryMultiple = this.options['try multiple transports']
      , limit = this.options['reconnection limit'];

    function reset () {
      if (self.connected) {
        for (var i in self.namespaces) {
          if (self.namespaces.hasOwnProperty(i) && '' !== i) {
              self.namespaces[i].packet({ type: 'connect' });
          }
        }
        self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
      }

      clearTimeout(self.reconnectionTimer);

      self.removeListener('connect_failed', maybeReconnect);
      self.removeListener('connect', maybeReconnect);

      self.reconnecting = false;

      delete self.reconnectionAttempts;
      delete self.reconnectionDelay;
      delete self.reconnectionTimer;
      delete self.redoTransports;

      self.options['try multiple transports'] = tryMultiple;
    };

    function maybeReconnect () {
      if (!self.reconnecting) {
        return;
      }

      if (self.connected) {
        return reset();
      };

      if (self.connecting && self.reconnecting) {
        return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
      }

      if (self.reconnectionAttempts++ >= maxAttempts) {
        if (!self.redoTransports) {
          self.on('connect_failed', maybeReconnect);
          self.options['try multiple transports'] = true;
          self.transport = self.getTransport();
          self.redoTransports = true;
          self.connect();
        } else {
          self.publish('reconnect_failed');
          reset();
        }
      } else {
        if (self.reconnectionDelay < limit) {
          self.reconnectionDelay *= 2; // exponential back off
        }

        self.connect();
        self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
        self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
      }
    };

    this.options['try multiple transports'] = false;
    this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

    this.on('connect', maybeReconnect);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.SocketNamespace = SocketNamespace;

  /**
   * Socket namespace constructor.
   *
   * @constructor
   * @api public
   */

  function SocketNamespace (socket, name) {
    this.socket = socket;
    this.name = name || '';
    this.flags = {};
    this.json = new Flag(this, 'json');
    this.ackPackets = 0;
    this.acks = {};
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(SocketNamespace, io.EventEmitter);

  /**
   * Copies emit since we override it
   *
   * @api private
   */

  SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

  /**
   * Creates a new namespace, by proxying the request to the socket. This
   * allows us to use the synax as we do on the server.
   *
   * @api public
   */

  SocketNamespace.prototype.of = function () {
    return this.socket.of.apply(this.socket, arguments);
  };

  /**
   * Sends a packet.
   *
   * @api private
   */

  SocketNamespace.prototype.packet = function (packet) {
    packet.endpoint = this.name;
    this.socket.packet(packet);
    this.flags = {};
    return this;
  };

  /**
   * Sends a message
   *
   * @api public
   */

  SocketNamespace.prototype.send = function (data, fn) {
    var packet = {
        type: this.flags.json ? 'json' : 'message'
      , data: data
    };

    if ('function' == typeof fn) {
      packet.id = ++this.ackPackets;
      packet.ack = true;
      this.acks[packet.id] = fn;
    }

    return this.packet(packet);
  };

  /**
   * Emits an event
   *
   * @api public
   */
  
  SocketNamespace.prototype.emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1)
      , lastArg = args[args.length - 1]
      , packet = {
            type: 'event'
          , name: name
        };

    if ('function' == typeof lastArg) {
      packet.id = ++this.ackPackets;
      packet.ack = 'data';
      this.acks[packet.id] = lastArg;
      args = args.slice(0, args.length - 1);
    }

    packet.args = args;

    return this.packet(packet);
  };

  /**
   * Disconnects the namespace
   *
   * @api private
   */

  SocketNamespace.prototype.disconnect = function () {
    if (this.name === '') {
      this.socket.disconnect();
    } else {
      this.packet({ type: 'disconnect' });
      this.$emit('disconnect');
    }

    return this;
  };

  /**
   * Handles a packet
   *
   * @api private
   */

  SocketNamespace.prototype.onPacket = function (packet) {
    var self = this;

    function ack () {
      self.packet({
          type: 'ack'
        , args: io.util.toArray(arguments)
        , ackId: packet.id
      });
    };

    switch (packet.type) {
      case 'connect':
        this.$emit('connect');
        break;

      case 'disconnect':
        if (this.name === '') {
          this.socket.onDisconnect(packet.reason || 'booted');
        } else {
          this.$emit('disconnect', packet.reason);
        }
        break;

      case 'message':
      case 'json':
        var params = ['message', packet.data];

        if (packet.ack == 'data') {
          params.push(ack);
        } else if (packet.ack) {
          this.packet({ type: 'ack', ackId: packet.id });
        }

        this.$emit.apply(this, params);
        break;

      case 'event':
        var params = [packet.name].concat(packet.args);

        if (packet.ack == 'data')
          params.push(ack);

        this.$emit.apply(this, params);
        break;

      case 'ack':
        if (this.acks[packet.ackId]) {
          this.acks[packet.ackId].apply(this, packet.args);
          delete this.acks[packet.ackId];
        }
        break;

      case 'error':
        if (packet.advice){
          this.socket.onError(packet);
        } else {
          if (packet.reason == 'unauthorized') {
            this.$emit('connect_failed', packet.reason);
          } else {
            this.$emit('error', packet.reason);
          }
        }
        break;
    }
  };

  /**
   * Flag interface.
   *
   * @api private
   */

  function Flag (nsp, name) {
    this.namespace = nsp;
    this.name = name;
  };

  /**
   * Send a message
   *
   * @api public
   */

  Flag.prototype.send = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.send.apply(this.namespace, arguments);
  };

  /**
   * Emit an event
   *
   * @api public
   */

  Flag.prototype.emit = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.emit.apply(this.namespace, arguments);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.websocket = WS;

  /**
   * The WebSocket transport uses the HTML5 WebSocket API to establish an
   * persistent connection with the Socket.IO server. This transport will also
   * be inherited by the FlashSocket fallback as it provides a API compatible
   * polyfill for the WebSockets.
   *
   * @constructor
   * @extends {io.Transport}
   * @api public
   */

  function WS (socket) {
    io.Transport.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(WS, io.Transport);

  /**
   * Transport name
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /**
   * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
   * all the appropriate listeners to handle the responses from the server.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.open = function () {
    var query = io.util.query(this.socket.options.query)
      , self = this
      , Socket


    if (!Socket) {
      Socket = global.MozWebSocket || global.WebSocket;
    }

    this.websocket = new Socket(this.prepareUrl() + query);

    this.websocket.onopen = function () {
      self.onOpen();
      self.socket.setBuffer(false);
    };
    this.websocket.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.websocket.onclose = function () {
      self.onClose();
      self.socket.setBuffer(true);
    };
    this.websocket.onerror = function (e) {
      self.onError(e);
    };

    return this;
  };

  /**
   * Send a message to the Socket.IO server. The message will automatically be
   * encoded in the correct message format.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.send = function (data) {
    this.websocket.send(data);
    return this;
  };

  /**
   * Payload
   *
   * @api private
   */

  WS.prototype.payload = function (arr) {
    for (var i = 0, l = arr.length; i < l; i++) {
      this.packet(arr[i]);
    }
    return this;
  };

  /**
   * Disconnect the established `WebSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.close = function () {
    this.websocket.close();
    return this;
  };

  /**
   * Handle the errors that `WebSocket` might be giving when we
   * are attempting to connect or send messages.
   *
   * @param {Error} e The error.
   * @api private
   */

  WS.prototype.onError = function (e) {
    this.socket.onError(e);
  };

  /**
   * Returns the appropriate scheme for the URI generation.
   *
   * @api private
   */
  WS.prototype.scheme = function () {
    return this.socket.options.secure ? 'wss' : 'ws';
  };

  /**
   * Checks if the browser has support for native `WebSockets` and that
   * it's not the polyfill created for the FlashSocket transport.
   *
   * @return {Boolean}
   * @api public
   */

  WS.check = function () {
    return ('WebSocket' in global && !('__addTask' in WebSocket))
          || 'MozWebSocket' in global;
  };

  /**
   * Check if the `WebSocket` transport support cross domain communications.
   *
   * @returns {Boolean}
   * @api public
   */

  WS.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('websocket');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   *
   * @api public
   */

  exports.XHR = XHR;

  /**
   * XHR constructor
   *
   * @costructor
   * @api public
   */

  function XHR (socket) {
    if (!socket) return;

    io.Transport.apply(this, arguments);
    this.sendBuffer = [];
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(XHR, io.Transport);

  /**
   * Establish a connection
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.open = function () {
    this.socket.setBuffer(false);
    this.onOpen();
    this.get();

    // we need to make sure the request succeeds since we have no indication
    // whether the request opened or not until it succeeded.
    this.setCloseTimeout();

    return this;
  };

  /**
   * Check if we need to send data to the Socket.IO server, if we have data in our
   * buffer we encode it and forward it to the `post` method.
   *
   * @api private
   */

  XHR.prototype.payload = function (payload) {
    var msgs = [];

    for (var i = 0, l = payload.length; i < l; i++) {
      msgs.push(io.parser.encodePacket(payload[i]));
    }

    this.send(io.parser.encodePayload(msgs));
  };

  /**
   * Send data to the Socket.IO server.
   *
   * @param data The message
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.send = function (data) {
    this.post(data);
    return this;
  };

  /**
   * Posts a encoded message to the Socket.IO server.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  function empty () { };

  XHR.prototype.post = function (data) {
    var self = this;
    this.socket.setBuffer(true);

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;
        self.posting = false;

        if (this.status == 200){
          self.socket.setBuffer(false);
        } else {
          self.onClose();
        }
      }
    }

    function onload () {
      this.onload = empty;
      self.socket.setBuffer(false);
    };

    this.sendXHR = this.request('POST');

    if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
      this.sendXHR.onload = this.sendXHR.onerror = onload;
    } else {
      this.sendXHR.onreadystatechange = stateChange;
    }

    this.sendXHR.send(data);
  };

  /**
   * Disconnects the established `XHR` connection.
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.close = function () {
    this.onClose();
    return this;
  };

  /**
   * Generates a configured XHR request
   *
   * @param {String} url The url that needs to be requested.
   * @param {String} method The method the request should use.
   * @returns {XMLHttpRequest}
   * @api private
   */

  XHR.prototype.request = function (method) {
    var req = io.util.request(this.socket.isXDomain())
      , query = io.util.query(this.socket.options.query, 't=' + +new Date);

    req.open(method || 'GET', this.prepareUrl() + query, true);

    if (method == 'POST') {
      try {
        if (req.setRequestHeader) {
          req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        } else {
          // XDomainRequest
          req.contentType = 'text/plain';
        }
      } catch (e) {}
    }

    return req;
  };

  /**
   * Returns the scheme to use for the transport URLs.
   *
   * @api private
   */

  XHR.prototype.scheme = function () {
    return this.socket.options.secure ? 'https' : 'http';
  };

  /**
   * Check if the XHR transports are supported
   *
   * @param {Boolean} xdomain Check if we support cross domain requests.
   * @returns {Boolean}
   * @api public
   */

  XHR.check = function (socket, xdomain) {
    try {
      var request = io.util.request(xdomain),
          usesXDomReq = (global.XDomainRequest && request instanceof XDomainRequest),
          socketProtocol = (socket && socket.options && socket.options.secure ? 'https:' : 'http:'),
          isXProtocol = (socketProtocol != global.location.protocol);
      if (request && !(usesXDomReq && isXProtocol)) {
        return true;
      }
    } catch(e) {}

    return false;
  };

  /**
   * Check if the XHR transport supports cross domain requests.
   *
   * @returns {Boolean}
   * @api public
   */

  XHR.xdomainCheck = function () {
    return XHR.check(null, true);
  };

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports['xhr-polling'] = XHRPolling;

  /**
   * The XHR-polling transport uses long polling XHR requests to create a
   * "persistent" connection with the server.
   *
   * @constructor
   * @api public
   */

  function XHRPolling () {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(XHRPolling, io.Transport.XHR);

  /**
   * Merge the properties from XHR transport
   */

  io.util.merge(XHRPolling, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  XHRPolling.prototype.name = 'xhr-polling';

  /** 
   * Establish a connection, for iPhone and Android this will be done once the page
   * is loaded.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  XHRPolling.prototype.open = function () {
    var self = this;

    io.Transport.XHR.prototype.open.call(self);
    return false;
  };

  /**
   * Starts a XHR request to wait for incoming messages.
   *
   * @api private
   */

  function empty () {};

  XHRPolling.prototype.get = function () {
    if (!this.open) return;

    var self = this;

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;

        if (this.status == 200) {
          self.onData(this.responseText);
          self.get();
        } else {
          self.onClose();
        }
      }
    };

    function onload () {
      this.onload = empty;
      this.onerror = empty;
      self.onData(this.responseText);
      self.get();
    };

    function onerror () {
      self.onClose();
    };

    this.xhr = this.request();

    if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
      this.xhr.onload = onload;
      this.xhr.onerror = onerror;
    } else {
      this.xhr.onreadystatechange = stateChange;
    }

    this.xhr.send(null);
  };

  /**
   * Handle the unclean close behavior.
   *
   * @api private
   */

  XHRPolling.prototype.onClose = function () {
    io.Transport.XHR.prototype.onClose.call(this);

    if (this.xhr) {
      this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
      try {
        this.xhr.abort();
      } catch(e){}
      this.xhr = null;
    }
  };

  /**
   * Webkit based browsers show a infinit spinner when you start a XHR request
   * before the browsers onload event is called so we need to defer opening of
   * the transport until the onload event is called. Wrapping the cb in our
   * defer method solve this.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  XHRPolling.prototype.ready = function (socket, fn) {
    var self = this;

    io.util.defer(function () {
      fn.call(self);
    });
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('xhr-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
;var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    
    require.define = function (filename, fn) {
        if (require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            return require(file, dirname);
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = { exports : {} };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process
            );
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};
});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process){var process = module.exports = {};

process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();
});

require.define("/node_modules/derby/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./lib/derby.js"}});

require.define("/node_modules/derby/lib/derby.js",function(require,module,exports,__dirname,__filename,process){var racer = require('racer')
  , component = require('./component')
  , derby = module.exports = Object.create(racer)
  , derbyPlugin = racer.util.isServer ?
      __dirname + '/derby.server' : require('./derby.browser');

// Allow derby object to be targeted via plugin.decorate
racer._makePlugable('derby', derby);

derby
  // Shared methods
  .use(component)
  // Server-side or browser-side methods
  .use(derbyPlugin);
});

require.define("/node_modules/derby/node_modules/racer/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./lib/racer.js"}});

require.define("/node_modules/derby/node_modules/racer/lib/racer.js",function(require,module,exports,__dirname,__filename,process){var util = require('./util')
  , mergeAll = util.mergeAll
  , isServer = util.isServer
  , isClient = !isServer;

if (isClient) require('es5-shim');

var EventEmitter = require('events').EventEmitter
  , plugin = require('./plugin');

var racer = module.exports = new EventEmitter();

mergeAll(racer, plugin, {
  version: require('../package.json').version
, isServer: isServer
, isClient: isClient
, protected: {
    Model: require('./Model')
  }
, util: util
});

// Note that this plugin is passed by string to prevent Browserify from
// including it
if (isServer) {
  racer.use(__dirname + '/racer.server');
}

racer
  .use(require('./mutators'))
  .use(require('./refs'))
  .use(require('./pubSub'))
  .use(require('./computed'))
  .use(require('./queries'))
  .use(require('./txns'))
  .use(require('./reconnect'));

if (isServer) {
  racer.use(__dirname + '/adapters/pubsub-memory');
}

// The browser module must be included last, since it creates a model instance,
// before which all plugins should be included
if (isClient) {
  racer.use(require('./racer.browser'));
}
});

require.define("/node_modules/derby/node_modules/racer/lib/util/index.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var deepCopy, deepEqual, equalsNaN, indexOf, isArguments, isServer, objEquiv, toString,
  __slice = [].slice;

toString = Object.prototype.toString;

module.exports = {
  isServer: isServer = typeof window === 'undefined',
  isProduction: isServer && process.env.NODE_ENV === 'production',
  isArguments: isArguments = function(obj) {
    return toString.call(obj) === '[object Arguments]';
  },
  mergeAll: function() {
    var from, froms, key, to, _i, _len;
    to = arguments[0], froms = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = froms.length; _i < _len; _i++) {
      from = froms[_i];
      if (from) {
        for (key in from) {
          to[key] = from[key];
        }
      }
    }
    return to;
  },
  merge: function(to, from) {
    var key;
    for (key in from) {
      to[key] = from[key];
    }
    return to;
  },
  hasKeys: function(obj, ignore) {
    var key;
    for (key in obj) {
      if (key === ignore) {
        continue;
      }
      return true;
    }
    return false;
  },
  escapeRegExp: function(s) {
    return s.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  },
  deepEqual: deepEqual = function(actual, expected) {
    if (actual === expected) {
      return true;
    }
    if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();
    }
    if (typeof actual === 'function' && typeof expected === 'function') {
      return actual === expected || actual.toString() === expected.toString();
    }
    if (typeof actual !== 'object' && typeof expected !== 'object') {
      return actual === expected;
    }
    return objEquiv(actual, expected);
  },
  objEquiv: objEquiv = function(a, b) {
    var i, ka, kb, key;
    if (a == null || b == null) {
      return false;
    }
    if (a.prototype !== b.prototype) {
      return false;
    }
    if (isArguments(a)) {
      if (!isArguments(b)) {
        return false;
      }
      a = pSlice.call(a);
      b = pSlice.call(b);
      return deepEqual(a, b);
    }
    try {
      ka = Object.keys(a);
      kb = Object.keys(b);
    } catch (e) {
      return false;
    }
    if (ka.length !== kb.length) {
      return false;
    }
    ka.sort();
    kb.sort();
    i = ka.length;
    while (i--) {
      if (ka[i] !== kb[i]) {
        return false;
      }
    }
    i = ka.length;
    while (i--) {
      key = ka[i];
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  },
  deepCopy: deepCopy = function(obj) {
    var k, ret, v;
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = obj.length; _i < _len; _i++) {
            v = obj[_i];
            _results.push(deepCopy(v));
          }
          return _results;
        })();
      }
      ret = {};
      for (k in obj) {
        v = obj[k];
        ret[k] = deepCopy(v);
      }
      return ret;
    }
    return obj;
  },
  indexOf: indexOf = function(list, obj, isEqual) {
    var i, v, _i, _len;
    for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
      v = list[i];
      if (isEqual(obj, v)) {
        return i;
      }
    }
    return -1;
  },
  deepIndexOf: function(list, obj) {
    return indexOf(list, obj, deepEqual);
  },
  equalsNaN: equalsNaN = function(x) {
    return x !== x;
  },
  equal: function(a, b) {
    return a === b || (equalsNaN(a) && equalsNaN(b));
  },
  noop: function() {},
  countWhile: function(array, predicate) {
    var count, i, x, _i, _len;
    count = 0;
    for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
      x = array[i];
      if (!predicate(x, i)) {
        return count++;
      }
    }
    return count;
  },
  Promise: require('./Promise'),
  async: require('./async')
};
});

require.define("/node_modules/derby/node_modules/racer/lib/util/Promise.js",function(require,module,exports,__dirname,__filename,process){var util = require('./index')
  , finishAfter = require('./async').finishAfter;

module.exports = Promise;

function Promise () {
  this.callbacks = [];
  this.resolved = false;
}

Promise.prototype = {
  resolve: function (err, value) {
    if (this.resolved) {
      throw new Error('Promise has already been resolved');
    }
    this.resolved = true;
    this.err = err;
    this.value = value;
    var callbacks = this.callbacks;
    for (var i = 0, l = callbacks.length; i < l; i++) {
      callbacks[i](err, value);
    }
    this.callbacks = [];
    return this;
  }

, on: function (callback) {
    if (this.resolved) {
      callback(this.err, this.value);
    } else {
      this.callbacks.push(callback);
    }
    return this;
  }

, clear: function () {
    this.resolved = false;
    delete this.value;
    delete this.err;
    return this;
  }
};

Promise.parallel = function (promises) {
  var composite = new Promise()
    , remaining = promises.length
    , compositeValue = []
    , didErr;

  promises.forEach( function (promise, i) {
    promise.on( function (err, val) {
      if (didErr) return;
      if (err) {
        didErr = true;
        return composite.resolve(err);
      }
      compositeValue[i] = val;
      --remaining || composite.resolve(null, compositeValue);
    });
  });

  return composite;
};
});

require.define("/node_modules/derby/node_modules/racer/lib/util/async.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var finishAfter;

module.exports = {
  finishAfter: finishAfter = function(count, callback) {
    var err;
    callback || (callback = function(err) {
      if (err) {
        throw err;
      }
    });
    if (!count) {
      return callback;
    }
    err = null;
    return function(_err) {
      err || (err = _err);
      return --count || callback(err);
    };
  },
  forEach: function(items, fn, done) {
    var finish, item, _i, _len;
    finish = finishAfter(items.length, done);
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      fn(item, finish);
    }
  },
  bufferifyMethods: function(Klass, methodNames, _arg) {
    var await, buffer, fns;
    await = _arg.await;
    fns = {};
    buffer = null;
    methodNames.forEach(function(methodName) {
      fns[methodName] = Klass.prototype[methodName];
      return Klass.prototype[methodName] = function() {
        var didFlush, flush, _arguments,
          _this = this;
        _arguments = arguments;
        didFlush = false;
        flush = function() {
          var args, _i, _len;
          didFlush = true;
          methodNames.forEach(function(methodName) {
            return _this[methodName] = fns[methodName];
          });
          delete await.alredyCalled;
          if (!buffer) {
            return;
          }
          for (_i = 0, _len = buffer.length; _i < _len; _i++) {
            args = buffer[_i];
            fns[methodName].apply(_this, args);
          }
          buffer = null;
        };
        if (await.alredyCalled) {
          return;
        }
        await.alredyCalled = true;
        await.call(this, flush);
        if (didFlush) {
          return this[methodName].apply(this, _arguments);
        }
        this[methodName] = function() {
          buffer || (buffer = []);
          return buffer.push(arguments);
        };
        this[methodName].apply(this, arguments);
      };
    });
    return {
      bufferify: function(methodName, _arg1) {
        var await, fn;
        fn = _arg1.fn, await = _arg1.await;
        buffer = null;
        return function() {
          var didFlush, flush, _arguments,
            _this = this;
          _arguments = arguments;
          didFlush = false;
          flush = function() {
            var args, _i, _len;
            didFlush = true;
            _this[methodName] = fn;
            if (!buffer) {
              return;
            }
            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
              args = buffer[_i];
              fn.apply(_this, args);
            }
            buffer = null;
          };
          await.call(this, flush);
          if (didFlush) {
            return this[methodName].apply(this, _arguments);
          }
          this[methodName] = function() {
            buffer || (buffer = []);
            return buffer.push(arguments);
          };
          this[methodName].apply(this, arguments);
        };
      }
    };
  }
};
});

require.define("/node_modules/derby/node_modules/racer/node_modules/es5-shim/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"es5-shim.js"}});

require.define("/node_modules/derby/node_modules/racer/node_modules/es5-shim/es5-shim.js",function(require,module,exports,__dirname,__filename,process){// vim: ts=4 sts=4 sw=4 expandtab
// -- kriskowal Kris Kowal Copyright (C) 2009-2011 MIT License
// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)
// -- dantman Daniel Friesen Copyright (C) 2010 XXX TODO License or CLA
// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License
// -- Gozala Irakli Gozalishvili Copyright (C) 2010 MIT License
// -- kitcambridge Kit Cambridge Copyright (C) 2011 MIT License
// -- kossnocorp Sasha Koss XXX TODO License or CLA
// -- bryanforbes Bryan Forbes XXX TODO License or CLA
// -- killdream Quildreen Motta XXX TODO License or CLA
// -- michaelficarra Michael Ficarra Copyright (C) 2011 3-clause BSD License
// -- sharkbrainguy Gerard Paapu Copyright (C) 2011 MIT License
// -- bbqsrc Brendan Molloy XXX TODO License or CLA
// -- iwyg XXX TODO License or CLA
// -- DomenicDenicola Domenic Denicola XXX TODO License or CLA
// -- xavierm02 Montillet Xavier XXX TODO License or CLA
// -- Raynos Raynos XXX TODO License or CLA
// -- samsonjs Sami Samhuri XXX TODO License or CLA
// -- rwldrn Rick Waldron XXX TODO License or CLA
// -- lexer Alexey Zakharov XXX TODO License or CLA

/*!
    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/

// Module systems magic dance
(function (definition) {
    // RequireJS
    if (typeof define == "function") {
        define(definition);
    // CommonJS and <script>
    } else {
        definition();
    }
})(function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * ES5 Draft
 * http://www.ecma-international.org/publications/files/drafts/tc39-2009-050.pdf
 *
 * NOTE: this is a draft, and as such, the URL is subject to change.  If the
 * link is broken, check in the parent directory for the latest TC39 PDF.
 * http://www.ecma-international.org/publications/files/drafts/
 *
 * Previous ES5 Draft
 * http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf
 * This is a broken link to the previous draft of ES5 on which most of the
 * numbered specification references and quotes herein were taken.  Updating
 * these references and quotes to reflect the new document would be a welcome
 * volunteer project.
 *
 * @module
 */

/*whatsupdoc*/

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function")
            throw new TypeError(); // TODO message
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 9. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 10. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 11. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 12. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        // 13. The [[Scope]] internal property of F is unused and need not
        //   exist.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.

                var F = function(){};
                F.prototype = target.prototype;
                var self = new F;

                var result = target.apply(
                    self,
                    args.concat(slice.call(arguments))
                );
                if (result !== null && Object(result) === result)
                    return result;
                return self;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the list
                //   boundArgs in the same order followed by the same values as
                //   the list ExtraArgs in the same order. 5.  Return the
                //   result of calling the [[Call]] internal method of target
                //   providing boundThis as the this value and providing args
                //   as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        // XXX bound.length is never writable, so don't even try
        //
        // 16. The length own property of F is given attributes as specified in
        //   15.3.5.1.
        // TODO
        // 17. Set the [[Extensible]] internal property of F to true.
        // TODO
        // 18. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // 19. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property.
        // XXX can't delete it in pure-js.
        return bound;
    };
}

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
var toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}

//
// Array
// =====
//

// ES5 15.4.3.2
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return toString(obj) == "[object Array]";
    };
}

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var self = toObject(this),
            thisp = arguments[1],
            i = 0,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object context
                fun.call(thisp, self[i], i, self);
            }
            i++;
        }
    };
}

// ES5 15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var self = toObject(this),
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, self);
        }
        return result;
    };
}

// ES5 15.4.4.20
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            result = [],
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, self))
                result.push(self[i]);
        }
        return result;
    };
}

// ES5 15.4.4.16
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, self))
                return false;
        }
        return true;
    };
}

// ES5 15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, self))
                return true;
        }
        return false;
    };
}

// ES5 15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var self = toObject(this),
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        // no value to return if no initial value and an empty array
        if (!length && arguments.length == 1)
            throw new TypeError(); // TODO message

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length)
                    throw new TypeError(); // TODO message
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self)
                result = fun.call(void 0, result, self[i], i, self);
        }

        return result;
    };
}

// ES5 15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var self = toObject(this),
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        // no value to return if no initial value, empty array
        if (!length && arguments.length == 1)
            throw new TypeError(); // TODO message

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError(); // TODO message
            } while (true);
        }

        do {
            if (i in this)
                result = fun.call(void 0, result, self[i], i, self);
        } while (i--);

        return result;
    };
}

// ES5 15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = toObject(this),
            length = self.length >>> 0;

        if (!length)
            return -1;

        var i = 0;
        if (arguments.length > 1)
            i = toInteger(arguments[1]);

        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}

// ES5 15.4.4.15
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = toObject(this),
            length = self.length >>> 0;

        if (!length)
            return -1;
        var i = length - 1;
        if (arguments.length > 1)
            i = toInteger(arguments[1]);
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i])
                return i;
        }
        return -1;
    };
}

//
// Object
// ======
//

// ES5 15.2.3.2
if (!Object.getPrototypeOf) {
    // https://github.com/kriskowal/es5-shim/issues#issue/2
    // http://ejohn.org/blog/objectgetprototypeof/
    // recommended by fschaefer on github
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor ?
            object.constructor.prototype :
            prototypeOfObject
        );
    };
}

// ES5 15.2.3.3
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
                         "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT + object);
        // If object does not owns property return undefined immediately.
        if (!owns(object, property))
            return;

        var descriptor, getter, setter;

        // If object has a property then it's for sure both `enumerable` and
        // `configurable`.
        descriptor =  { enumerable: true, configurable: true };

        // If JS engine supports accessor properties then property may be a
        // getter or setter.
        if (supportsAccessors) {
            // Unfortunately `__lookupGetter__` will return a getter even
            // if object has own non getter property along with a same named
            // inherited getter. To avoid misbehavior we temporary remove
            // `__proto__` so that `__lookupGetter__` will return getter only
            // if it's owned by an object.
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);

            // Once we have getter and setter we can put values back.
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) descriptor.get = getter;
                if (setter) descriptor.set = setter;

                // If it was accessor property we're done and return here
                // in order to avoid adding `value` to the descriptor.
                return descriptor;
            }
        }

        // If we got this far we know that object has an own property that is
        // not an accessor so we set it as a value and return descriptor.
        descriptor.value = object[property];
        return descriptor;
    };
}

// ES5 15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5
if (!Object.create) {
    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = { "__proto__": null };
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            // IE has no built-in implementation of `Object.getPrototypeOf`
            // neither `__proto__`, but this manually setting `__proto__` will
            // guarantee that `Object.getPrototypeOf` will work as expected with
            // objects created using `Object.create`
            object.__proto__ = prototype;
        }
        if (properties !== void 0)
            Object.defineProperties(object, properties);
        return object;
    };
}

// ES5 15.2.3.6

// Patch for WebKit and IE8 standard mode
// Designed by hax <hax.github.com>
// related issue: https://github.com/kriskowal/es5-shim/issues#issue/5
// IE8 Reference:
//     http://msdn.microsoft.com/en-us/library/dd282900.aspx
//     http://msdn.microsoft.com/en-us/library/dd229916.aspx
// WebKit Bugs:
//     https://bugs.webkit.org/show_bug.cgi?id=36423

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
        // returns falsy
    }
}

// check whether defineProperty works if it's given. Otherwise,
// shim partially.
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);

        // make a valiant attempt to use the real defineProperty
        // for I8's DOM elements.
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }

        // If it's a data property.
        if (owns(descriptor, "value")) {
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(owns(descriptor, "writable") ? descriptor.writable : true) ||
                !(owns(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(owns(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                // As accessors are supported only on engines implementing
                // `__proto__` we can safely override `__proto__` while defining
                // a property to make sure that we don't hit an inherited
                // accessor.
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                // Deleting a property anyway since getter / setter may be
                // defined on object itself.
                delete object[property];
                object[property] = descriptor.value;
                // Setting original `__proto__` back now.
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors)
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            // If we got that far then getters and setters can be defined !!
            if (owns(descriptor, "get"))
                defineGetter(object, property, descriptor.get);
            if (owns(descriptor, "set"))
                defineSetter(object, property, descriptor.set);
        }

        return object;
    };
}

// ES5 15.2.3.7
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}

// ES5 15.2.3.8
if (!Object.seal) {
    Object.seal = function seal(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.9
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// detect a Rhino bug and patch it
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}

// ES5 15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}

// ES5 15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}

// ES5 15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        // 1. If Type(O) is not Object throw a TypeError exception.
        if (Object(object) === object) {
            throw new TypeError(); // TODO message
        }
        // 2. Return the Boolean value of the [[Extensible]] internal property of O.
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}

// ES5 15.2.3.14
// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
if (!Object.keys) {

    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null})
        hasDontEnumBug = false;

    Object.keys = function keys(object) {

        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError("Object.keys called on a non-object");

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }

        return keys;
    };

}

//
// Date
// ====
//

// ES5 15.9.5.43
// Format a Date object as a string according to a simplified subset of the ISO 8601
// standard as defined in 15.9.1.15.
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function toISOString() {
        var result, length, value;
        if (!isFinite(this))
            throw new RangeError;

        // the date time string format is specified in 15.9.1.15.
        result = [this.getUTCFullYear(), this.getUTCMonth() + 1, this.getUTCDate(),
            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two digits.
            if (value < 10)
                result[length] = "0" + value;
        }
        // pad milliseconds to have three digits.
        return result.slice(0, 3).join("-") + "T" + result.slice(3).join(":") + "." +
            ("000" + this.getUTCMilliseconds()).slice(-3) + "Z";
    }
}

// ES5 15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

// ES5 15.9.5.44
if (!Date.prototype.toJSON) {
    Date.prototype.toJSON = function toJSON(key) {
        // This function provides a String representation of a Date object for
        // use by JSON.stringify (15.12.3). When the toJSON method is called
        // with argument key, the following steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ToPrimitive(O, hint Number).
        // 3. If tv is a Number and is not finite, return null.
        // XXX
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof this.toISOString != "function")
            throw new TypeError(); // TODO message
        // 6. Return the result of calling the [[Call]] internal method of
        // toISO with O as the this value and an empty argument list.
        return this.toISOString();

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// 15.9.4.2 Date.parse (string)
// 15.9.1.15 Date Time String Format
// Date.parse
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (isNaN(Date.parse("2011-06-15T21:40:05+06:00"))) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        var Date = function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length == 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format. This pattern does not implement
        // extended years (15.9.1.15.1), as `Date.UTC` cannot parse them.
        var isoDateExpression = new RegExp("^" +
            "(\\d{4})" + // four-digit year capture
            "(?:-(\\d{2})" + // optional month capture
            "(?:-(\\d{2})" + // optional day capture
            "(?:" + // capture hours:minutes:seconds.milliseconds
                "T(\\d{2})" + // hours capture
                ":(\\d{2})" + // minutes capture
                "(?:" + // optional :seconds.milliseconds
                    ":(\\d{2})" + // seconds capture
                    "(?:\\.(\\d{3}))?" + // milliseconds capture
                ")?" +
            "(?:" + // capture UTC offset component
                "Z|" + // UTC capture
                "(?:" + // offset specifier +/-hours:minutes
                    "([-+])" + // sign capture
                    "(\\d{2})" + // hours offset capture
                    ":(\\d{2})" + // minutes offset capture
                ")" +
            ")?)?)?)?" +
        "$");

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate)
            Date[key] = NativeDate[key];

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        Date.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                match.shift(); // kill match[0], the full match
                // parse months, days, hours, minutes, seconds, and milliseconds
                for (var i = 1; i < 7; i++) {
                    // provide default values if necessary
                    match[i] = +(match[i] || (i < 3 ? 1 : 0));
                    // match[1] is the month. Months are 0-11 in JavaScript
                    // `Date` objects, but 1-12 in ISO notation, so we
                    // decrement.
                    if (i == 1)
                        match[i]--;
                }

                // parse the UTC offset component
                var minuteOffset = +match.pop(), hourOffset = +match.pop(), sign = match.pop();

                // compute the explicit time zone offset if specified
                var offset = 0;
                if (sign) {
                    // detect invalid offsets and return early
                    if (hourOffset > 23 || minuteOffset > 59)
                        return NaN;

                    // express the provided time zone offset in minutes. The offset is
                    // negative for time zones west of UTC; positive otherwise.
                    offset = (hourOffset * 60 + minuteOffset) * 6e4 * (sign == "+" ? -1 : 1);
                }

                // compute a new UTC date value, accounting for the optional offset
                return NativeDate.UTC.apply(this, match) + offset;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

//
// String
// ======
//

// ES5 15.5.4.20
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

//
// Util
// ======
//

// http://jsperf.com/to-integer
var toInteger = function (n) {
    n = +n;
    if (n !== n) // isNaN
        n = -1;
    else if (n !== 0 && n !== (1/0) && n !== -(1/0))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    return n;
};

var prepareString = "a"[0] != "a",
    // ES5 9.9
    toObject = function (o) {
        if (o == null) { // this matches both null and undefined
            throw new TypeError(); // TODO message
        }
        // If the implementation doesn't support by-index access of
        // string characters (ex. IE < 7), split the string
        if (prepareString && typeof o == "string" && o) {
            return o.split("");
        }
        return Object(o);
    };
});
});

require.define("events",function(require,module,exports,__dirname,__filename,process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};
});

require.define("/node_modules/derby/node_modules/racer/lib/plugin.js",function(require,module,exports,__dirname,__filename,process){var util = require('./util')
  , mergeAll = util.mergeAll
  , isServer = util.isServer

    // This tricks Browserify into not logging an error when bundling this file
  , _require = require

  , plugable = {};

module.exports = {

  _makePlugable: function (name, object) {
    plugable[name] = object;
  }

  // @param {Function} plugin(racer, options)
  // @param {Object} options that we pass to the plugin invocation
, use: function (plugin, options) {
    if (typeof plugin === 'string') {
      if (!isServer) return this;
      plugin = _require(plugin);
    }

    var decorate = plugin.decorate
      , target = (decorate === null || decorate === 'racer')
               ? this
               : plugable[decorate];

    if (!target) {
      throw new Error('Invalid plugin.decorate value: ' + decorate);
    }

    var plugins = target._plugins || (target._plugins = []);

    // Don't include a plugin more than once -- useful in tests where race
    // conditions exist regarding require and clearing require.cache
    if (-1 === plugins.indexOf(plugin)) {
      plugins.push(plugin);
      plugin(target, options);
    }
    return this;
  }

  // A mixin is an object literal with:
  //   type:     Name of the racer Klass in which to mixin
  //   [static]: Class/static methods to add to Klass
  //   [proto]:  Methods to add to Klass.prototype
  //   [events]: Event callbacks including 'mixin', 'init', 'socket', etc.
  //
  // proto methods may be either a function or an object literal with:
  //   fn:       The method's function
  //   [type]:   Optionally add this method to a collection of methods accessible
  //             via Klass.<type>. If type is a comma-separated string,
  //             e.g., `type="foo,bar", then this method is added to several
  //             method collections, e.g., added to `Klass.foo` and `Klass.bar`.
  //             This is useful for grouping several methods together.
  //   <other>:  All other key-value pairings are added as properties of the method
, mixin: function () {
    var protected = this.protected;
    for (var i = 0, l = arguments.length; i < l; i++) {
      var mixin = arguments[i];
      if (typeof mixin === 'string') {
        if (!isServer) continue;
        mixin = _require(mixin);
      }

      var type = mixin.type;
      if (!type) throw new Error('Mixins require a type parameter');
      var Klass = protected[type];
      if (!Klass) throw new Error('Cannot find racer.protected.' + type);

      if (Klass.mixins) {
        Klass.mixins.push(mixin);
      } else {
        Klass.mixins = [mixin];
        var self = this;
        Klass.prototype.mixinEmit = function (name) {
          var eventName = type + ':' + name
            , eventArgs = Array.prototype.slice.call(arguments, 1);
          self.emit.apply(self, [eventName].concat(eventArgs));
        };
      }

      if (mixin.decorate) mixin.decorate(Klass);
      mergeAll(Klass, mixin.static);
      mergeProto(mixin.proto, Klass);

      var server;
      if (isServer && (server = mixin.server)) {
        server = (typeof server === 'string')
               ? _require(server)
               : mixin.server;
        mergeProto(server, Klass);
      }

      var events = mixin.events;
      for (var name in events) {
        var fn = events[name];
        this.on(type + ':' + name, fn);
      }

      this.emit(type + ':mixin', Klass);
    }
    return this;
  }
};

function mergeProto (protoSpec, Klass) {
  var targetProto = Klass.prototype;
  for (var name in protoSpec) {
    var descriptor = protoSpec[name];
    if (typeof descriptor === 'function') {
      targetProto[name] = descriptor;
      continue;
    }
    var fn = targetProto[name] = descriptor.fn;
    for (var key in descriptor) {
      var value = descriptor[key];
      switch (key) {
        case 'fn': continue;
        case 'type':
          var csGroups = value.split(',');
          for (var i = 0, l = csGroups.length; i < l; i++) {
            var groupName = csGroups[i]
              , methods = Klass[groupName] || (Klass[groupName] = {});
            methods[name] = fn;
          }
          break;
        default:
          fn[key] = value;
      }
    }
  }
}
});

require.define("/node_modules/derby/node_modules/racer/lib/Model.js",function(require,module,exports,__dirname,__filename,process){var EventEmitter = require('events').EventEmitter
  , Memory = require('./Memory')
  , eventRegExp = require('./path').eventRegExp
  , mergeAll = require('./util').mergeAll
  ;

module.exports = Model;

function Model (init) {
  for (var k in init) {
    this[k] = init[k];
  }
  this._memory = new Memory();
  this._count = { id: 0 };
  // Set max listeners to unlimited
  this.setMaxListeners(0);

  // Used for model scopes
  this._root = this;
  this.mixinEmit('init', this);
}

var modelProto = Model.prototype
  , emitterProto = EventEmitter.prototype;

mergeAll(modelProto, emitterProto, {
  id: function () {
    return '$_' + this._clientId + '_' + (this._count.id++).toString(36);
  }

  /* Socket.io communication */

, connected: true
, canConnect: true

, _setSocket: function (socket) {
    this.socket = socket;
    this.mixinEmit('socket', this, socket);
    this.disconnect = function () { return socket.disconnect(); };
    this.connect = function (callback) {
      if (callback) socket.once('connect', callback);
      socket.socket.connect();
    };

    var self = this;
    this.canConnect = true;
    socket.on('fatalErr', function (msg) {
      self.canConnect = false;
      self.emit('canConnect', false);
      socket.disconnect();
    });

    this.connected = false;
    function onConnected () {
      self.emit('connected', self.connected);
      self.emit('connectionStatus', self.connected, self.canConnect);
    }

    socket.on('connect', function () {
      self.connected = true;
      onConnected();
    });

    socket.on('disconnect', function () {
      self.connected = false;
      // Slight delay after disconnect so that offline does not flash on reload
      setTimeout(onConnected, 400);
    });

    // Needed in case page is loaded from cache while offline
    socket.on('connect_failed', onConnected);
  }

  /* Scoped Models */

  /**
   * Create a model object scoped to a particular path.
   * Example:
   *     var user = model.at('users.1');
   *     user.set('username', 'brian');
   *     user.on('push', 'todos', function (todo) {
   *       // ...
   *     });
   *
   *  @param {String} segment
   *  @param {Boolean} absolute
   *  @return {Model} a scoped model
   *  @api public
   */
, at: function (segment, absolute) {
    var at = this._at
      , val = (at && !absolute)
            ? (segment === '')
              ? at
              : at + '.' + segment
            : segment.toString()
    return Object.create(this, { _at: { value: val } });
  }

  /**
   * Returns a model scope that is a number of levels above the current scoped
   * path. Number of levels defaults to 1, so this method called without
   * arguments returns the model scope's parent model scope.
   *
   * @optional @param {Number} levels
   * @return {Model} a scoped model
   */
, parent: function (levels) {
    if (! levels) levels = 1;
    var at = this._at;
    if (!at) return this;
    var segments = at.split('.');
    return this.at(segments.slice(0, segments.length - levels).join('.'), true);
  }

  /**
   * Returns the path equivalent to the path of the current scoped model plus
   * the suffix path `rest`
   *
   * @optional @param {String} rest
   * @return {String} absolute path
   * @api public
   */
, path: function (rest) {
    var at = this._at;
    if (at) {
      if (rest) return at + '.' + rest;
      return at;
    }
    return rest || '';
  }

  /**
   * Returns the last property segment of the current model scope path
   *
   * @optional @param {String} path
   * @return {String}
   */
, leaf: function (path) {
    if (!path) path = this._at || '';
    var i = path.lastIndexOf('.');
    return path.substr(i+1);
  }

  /* Model events */

  // EventEmitter.prototype.on, EventEmitter.prototype.addListener, and
  // EventEmitter.prototype.once return `this`. The Model equivalents return
  // the listener instead, since it is made internally for method subscriptions
  // and may need to be passed to removeListener.

, _on: emitterProto.on
, on: function (type, pattern, callback) {
    var listener = eventListener(type, pattern, callback, this._at);
    this._on(type, listener);
    return listener;
  }

, _once: emitterProto.once
, once: function (type, pattern, callback) {
    var listener = eventListener(type, pattern, callback, this._at)
      , self;
    this._on( type, function g () {
      var matches = listener.apply(null, arguments);
      if (matches) this.removeListener(type, g);
    });
    return listener;
  }

  /**
   * Used to pass an additional argument to local events. This value is added
   * to the event arguments in txns/mixin.Model
   * Example:
   *     model.pass({ ignore: domId }).move('arr', 0, 2);
   *
   * @param {Object} arg
   * @return {Model} an Object that prototypically inherits from the calling
   * Model instance, but with a _pass attribute equivalent to `arg`.
   * @api public
   */
, pass: function (arg) {
    return Object.create(this, { _pass: { value: arg } });
  }
});

modelProto.addListener = modelProto.on;

/**
 * Returns a function that is assigned as an event listener on method events
 * such as 'set', 'insert', etc.
 *
 * Possible function signatures are:
 *
 * - eventListener(method, pattern, callback, at)
 * - eventListener(method, pattern, callback)
 * - eventListener(method, callback)
 *
 * @param {String} method
 * @param {String} pattern
 * @param {Function} callback
 * @param {String} at
 * @return {Function} function ([path, args...], out, isLocal, pass)
 */
function eventListener (method, pattern, callback, at) {
  if (at) {
    if (typeof pattern === 'string') {
      pattern = at + '.' + pattern;
    } else if (pattern.call) {
      callback = pattern;
      pattern = at;
    } else {
      throw new Error('Unsupported event pattern on scoped model');
    }

    // on(type, listener)
    // Test for function by looking for call, since pattern can be a RegExp,
    // which has typeof pattern === 'function' as well
  } else if ((typeof pattern === 'function') && pattern.call) {
    return pattern;
  }

  // on(method, pattern, callback)
  var regexp = eventRegExp(pattern);
  return function (args, out, isLocal, pass) {
    var path = args[0];
    if (! regexp.test(path)) return;

    args = args.slice(1);
    var captures = regexp.exec(path).slice(1)
      , callbackArgs = captures.concat(args).concat([out, isLocal, pass]);
    callback.apply(null, callbackArgs);
    return true;
  };
}
});

require.define("/node_modules/derby/node_modules/racer/lib/Memory.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var Memory, clone, create, createArray, createObject, isPrivate, lookup, lookupSet, _ref,
  __slice = [].slice;

_ref = require('./util/speculative'), clone = _ref.clone, create = _ref.create, createObject = _ref.createObject, createArray = _ref.createArray;

isPrivate = require('./path').isPrivate;

Memory = module.exports = function() {
  this.flush();
};

Memory.prototype = {
  flush: function() {
    this._data = {
      world: {}
    };
    return this.version = 0;
  },
  init: function(obj) {
    this._data = {
      world: obj.data
    };
    return this.version = obj.ver;
  },
  eraseNonPrivate: function() {
    var path, world;
    world = this._data.world;
    for (path in world) {
      if (!isPrivate(path)) {
        delete world[path];
      }
    }
  },
  toJSON: function() {
    return {
      data: this._data.world,
      ver: this.version
    };
  },
  setVersion: function(ver) {
    return this.version = Math.max(this.version, ver);
  },
  get: function(path, data, getRef) {
    data || (data = this._data);
    data.$deref = null;
    if (path) {
      return lookup(path, data, getRef);
    }
    return data.world;
  },
  set: function(path, value, ver, data) {
    var obj, parent, prop, segments, _ref1;
    this.setVersion(ver);
    _ref1 = lookupSet(path, data || this._data, ver == null, 'object'), obj = _ref1[0], parent = _ref1[1], prop = _ref1[2];
    parent[prop] = value;
    segments = path.split('.');
    if (segments.length === 2 && value && value.constructor === Object) {
      if (value.id == null) {
        value.id = segments[1];
      }
    }
    return obj;
  },
  del: function(path, ver, data) {
    var grandparent, index, obj, parent, parentClone, parentPath, parentProp, prop, speculative, _ref1, _ref2;
    this.setVersion(ver);
    data || (data = this._data);
    speculative = ver == null;
    _ref1 = lookupSet(path, data, speculative), obj = _ref1[0], parent = _ref1[1], prop = _ref1[2];
    if (ver != null) {
      if (parent) {
        delete parent[prop];
      }
      return obj;
    }
    if (!parent) {
      return obj;
    }
    if (~(index = path.lastIndexOf('.'))) {
      parentPath = path.substr(0, index);
      _ref2 = lookupSet(parentPath, data, speculative), parent = _ref2[0], grandparent = _ref2[1], parentProp = _ref2[2];
    } else {
      parent = data.world;
      grandparent = data;
      parentProp = 'world';
    }
    parentClone = clone(parent);
    delete parentClone[prop];
    grandparent[parentProp] = parentClone;
    return obj;
  },
  push: function() {
    var args, arr, data, path, ver, _i;
    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];
    this.setVersion(ver);
    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new TypeError("" + arr + " is not an Array");
    }
    return arr.push.apply(arr, args);
  },
  unshift: function() {
    var args, arr, data, path, ver, _i;
    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];
    this.setVersion(ver);
    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new TypeError("" + arr + " is not an Array");
    }
    return arr.unshift.apply(arr, args);
  },
  insert: function() {
    var args, arr, data, index, len, path, ver, _i;
    path = arguments[0], index = arguments[1], args = 5 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 2) : (_i = 2, []), ver = arguments[_i++], data = arguments[_i++];
    this.setVersion(ver);
    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new TypeError("" + arr + " is not an Array");
    }
    len = arr.length;
    arr.splice.apply(arr, [index, 0].concat(__slice.call(args)));
    return arr.length;
  },
  pop: function(path, ver, data) {
    var arr;
    this.setVersion(ver);
    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new TypeError("" + arr + " is not an Array");
    }
    return arr.pop();
  },
  shift: function(path, ver, data) {
    var arr;
    this.setVersion(ver);
    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new TypeError("" + arr + " is not an Array");
    }
    return arr.shift();
  },
  remove: function(path, index, howMany, ver, data) {
    var arr, len;
    this.setVersion(ver);
    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new TypeError("" + arr + " is not an Array");
    }
    len = arr.length;
    return arr.splice(index, howMany);
  },
  move: function(path, from, to, howMany, ver, data) {
    var arr, len, values;
    this.setVersion(ver);
    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new TypeError("" + arr + " is not an Array");
    }
    len = arr.length;
    from = +from;
    to = +to;
    if (from < 0) {
      from += len;
    }
    if (to < 0) {
      to += len;
    }
    values = arr.splice(from, howMany);
    arr.splice.apply(arr, [to, 0].concat(__slice.call(values)));
    return values;
  }
};

lookup = function(path, data, getRef) {
  var curr, i, len, prop, props, refOut, _ref1;
  props = path.split('.');
  len = props.length;
  i = 0;
  curr = data.world;
  path = '';
  while (i < len) {
    prop = props[i++];
    curr = curr[prop];
    path = path ? path + '.' + prop : prop;
    if (typeof curr === 'function') {
      if (getRef && i === len) {
        break;
      }
      _ref1 = refOut = curr(lookup, data, path, props, len, i), curr = _ref1[0], path = _ref1[1], i = _ref1[2];
    }
    if (curr == null) {
      break;
    }
  }
  return curr;
};

lookupSet = Memory.lookupSet = function(path, data, speculative, pathType) {
  var curr, firstProp, i, len, parent, prop, props;
  props = path.split('.');
  len = props.length;
  i = 0;
  curr = data.world = speculative ? create(data.world) : data.world;
  firstProp = props[0];
  while (i < len) {
    prop = props[i++];
    parent = curr;
    curr = curr[prop];
    if (curr != null) {
      if (speculative && typeof curr === 'object') {
        curr = parent[prop] = create(curr);
      }
    } else {
      if (pathType === 'object') {
        if (i !== 1 && /^[0-9]+$/.test(props[i])) {
          curr = parent[prop] = speculative ? createArray() : [];
        } else if (i !== len) {
          curr = parent[prop] = speculative ? createObject() : {};
          if (i === 2 && !isPrivate(firstProp)) {
            curr.id = prop;
          }
        }
      } else if (pathType === 'array') {
        if (i === len) {
          curr = parent[prop] = speculative ? createArray() : [];
        } else {
          curr = parent[prop] = speculative ? createObject() : {};
          if (i === 2 && !isPrivate(firstProp)) {
            curr.id = prop;
          }
        }
      } else {
        if (i !== len) {
          parent = curr = void 0;
        }
        return [curr, parent, prop];
      }
    }
  }
  return [curr, parent, prop];
};
});

require.define("/node_modules/derby/node_modules/racer/lib/util/speculative.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var merge, util;

merge = (util = require('./index')).merge;

util.speculative = module.exports = {
  createObject: function() {
    return {
      $spec: true
    };
  },
  createArray: function() {
    var obj;
    obj = [];
    obj.$spec = true;
    return obj;
  },
  create: function(proto) {
    var obj;
    if (proto.$spec) {
      return proto;
    }
    if (Array.isArray(proto)) {
      obj = proto.slice();
      obj.$spec = true;
      return obj;
    }
    return Object.create(proto, {
      $spec: {
        value: true
      }
    });
  },
  clone: function(proto) {
    var obj;
    if (Array.isArray(proto)) {
      obj = proto.slice();
      obj.$spec = true;
      return obj;
    }
    return merge({}, proto);
  },
  isSpeculative: function(obj) {
    return obj && obj.$spec;
  },
  identifier: '$spec'
};
});

require.define("/node_modules/derby/node_modules/racer/lib/path.js",function(require,module,exports,__dirname,__filename,process){var hasKeys = require('./util').hasKeys;

// Test to see if path name contains a segment that starts with an underscore.
// Such a path is private to the current session and should not be stored
// in persistent storage or synced with other clients.
exports.isPrivate = function isPrivate (name) { return /(?:^_)|(?:\._)/.test(name); };

exports.isPattern = function isPattern (x) { return -1 === x.indexOf('*'); };

function createEachMatch (matchHandler, fields) {
  fields = fields.split('');
  return function eachMatch (match, index, pattern) {
    // Escape special characters
    if (~fields.indexOf(match) && match in matchHandler) {
      return matchHandler[match];
    }

    // An asterisk matches any single path segment in the middle and any path
    // or paths at the end
    if (pattern.length - index === 1) return '(.+)';

    return '([^.]+)';
  }
}
exports.eventRegExp = function eventRegExp (pattern) {
  if (pattern instanceof RegExp) return pattern;
  var self = this;
  var inner;
  var matchHandler = {
    '.': '\\.'
  , '$': '\\$'
  , '^': '\\^'
  , '[': '\\['
  , ']': '\\]'

    // Commas can be used for or, as in path.(one,two)
  , ',': '|'
  };
  var eachMatch;
  if (pattern.substring(0, 9) === '_$queries') {
    eachMatch = createEachMatch(matchHandler, '.*$^[]');
    inner = '_\\$queries\\.' + pattern.substring(10).replace(/[.*$^\[\]]/g, eachMatch);
  } else {
    eachMatch = createEachMatch(matchHandler, ',.*$');
    inner = pattern.replace(/[,.*$]/g, eachMatch);
  }
  return new RegExp('^' + inner + '$');
};

exports.regExp = function regExp (pattern) {
  // Match anything if there is no pattern or the pattern is ''
  if (! pattern) return /^/;

  return new RegExp('^' + pattern.replace(/[.*$]/g, function (match, index) {
    // Escape periods
    if (match === '.') return '\\.';

    if (match === '$') return '\\$';

    // An asterisk matches any single path segment in the middle
    return '[^.]+';

    // All subscriptions match the root and any path below the root
  }) + '(?:\\.|$)');
};

// Create regular expression matching the path or any of its parents
exports.regExpPathOrParent = function regExpPathOrParent (path) {
  var p = ''
    , parts = path.split('.')
    , source = [];

  for (var i = 0, l = parts.length; i < l; i++) {
    var segment = parts[i];
    p += i ? '\\.' + segment
           : segment;
    source.push( '(?:' + p + ')' );
  }
  source = source.join('|');
  return new RegExp('^(?:' + source + ')$');
};

// Create regular expression matching any of the paths or child paths of any of
// the paths
exports.regExpPathsOrChildren = function regExpPathsOrChildren (paths) {
  var source = [];
  for (var i = 0, l = paths.length; i < l; i++) {
    var path = paths[i];
    source.push( '(?:' + path + "(?:\\..+)?)" );
  }
  source = source.join('|');
  return new RegExp('^(?:' + source + ')$');
};

exports.lookup = lookup;

function lookup (path, obj) {
  if (path.indexOf('.') === -1) return obj[path];

  var parts = path.split('.');
  for (var i = 0, l = parts.length; i < l; i++) {
    if (!obj) return obj;

    var prop = parts[i];
    obj = obj[prop];
  }
  return obj;
};

exports.assign = assign;

function assign (obj, path, val) {
  var parts = path.split('.')
    , lastIndex = parts.length - 1;
  for (var i = 0, l = parts.length; i < l; i++) {
    var prop = parts[i];
    if (i === lastIndex) obj[prop] = val;
    else                 obj = obj[prop] || (obj[prop] = {});
  }
};

exports.objectWithOnly = function objectWithOnly (obj, paths) {
  var projectedDoc = {};
  for (var i = 0, l = paths.length; i < l; i++) {
    var path = paths[i];
    assign(projectedDoc, path, lookup(path, obj));
  }
  return projectedDoc;
};

exports.objectExcept = function objectExcept (from, exceptions) {
  if (! from) return;
  var to = Array.isArray(from) ? [] : {};
  for (var key in from) {
    // Skip exact exception matches
    if (~exceptions.indexOf(key)) continue;

    var nextExceptions = [];
    for (var i = exceptions.length; i--; ) {
      var except = exceptions[i]
        , periodPos = except.indexOf('.')
        , prefix = except.substring(0, periodPos);
      if (prefix === key) {
        nextExceptions.push(except.substring(periodPos + 1, except.length));
      }
    }
    if (nextExceptions.length) {
      var nested = objectExcept( from[key], nextExceptions );
      if (hasKeys(nested)) to[key] = nested;
    } else {
      if (Array.isArray(from)) key = parseInt(key, 10);
      to[key] = from[key];
    }
  }
  return to;
};

exports.isSubPathOf = function isSubPathOf (path, fullPath) {
  return path === fullPath.substring(0, path.length);
};

exports.split = function split (path) {
  return path.split(/\.?[(*]\.?/);
};

exports.expand = function expand (path) {
  // Remove whitespace and line break characters
  path = path.replace(/[\s\n]/g, '');

  // Return right away if path doesn't contain any groups
  if (! ~path.indexOf('(')) return [path];

  // Break up path groups into a list of equivalent paths that contain only
  // names and *
  var paths = [''], out = []
    , stack = { paths: paths, out: out}
    , lastClosed;
  while (path) {
    var match = /^([^,()]*)([,()])(.*)/.exec(path);
    if (! match) return out.map( function (val) { return val + path; });
    var pre = match[1]
      , token = match[2];
    path = match[3]

    if (pre) {
      paths = paths.map( function (val) { return val + pre; });
      if (token !== '(') {
        var out = lastClosed ? paths : out.concat(paths);
      }
    }
    lastClosed = false;
    if (token === ',') {
      stack.out = stack.out.concat(paths);
      paths = stack.paths;
    } else if (token === '(') {
      out = [];
      stack = { parent: stack, paths: paths, out: out };
    } else if (token === ')') {
      lastClosed = true;
      paths = out = stack.out.concat(paths);
      stack = stack.parent;
    }
  }
  return out;
};

// Given a `path`, returns an array of length 3 with the namespace, id, and
// relative path to the attribute
exports.triplet = function triplet (path) {
  var parts = path.split('.');
  return [parts[0], parts[1], parts.slice(2).join('.')];
};

exports.subPathToDoc = function subPathToDoc (path) {
  return path.split('.').slice(0, 2).join('.');
};

exports.join = function join () {
  var joinedPath = [];
  for (var i = 0, l = arguments.length; i < l; i++) {
    var component = arguments[i];
    if (typeof component === 'string') {
      joinedPath.push(component);
    } else if (Array.isArray(component)) {
      joinedPath.push.apply(joinedPath, component);
    } else {
      throw new Error('path.join only takes strings and Arrays as arguments');
    }
  }
  return joinedPath.join('.');
};
});

require.define("/node_modules/derby/node_modules/racer/lib/mutators/index.js",function(require,module,exports,__dirname,__filename,process){var mixinModel = require('./mutators.Model')
  , mixinStore = __dirname + '/mutators.Store';

exports = module.exports = plugin;

function plugin (racer) {
  racer.mixin(mixinModel, mixinStore);
}

exports.useWith = { server: true, browser: true };
exports.decorate = 'racer';
});

require.define("/node_modules/derby/node_modules/racer/lib/mutators/mutators.Model.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var ACCESSOR, ARRAY_MUTATOR, Async, BASIC_MUTATOR, COMPOUND_MUTATOR, Memory,
  __slice = [].slice;

Async = require('./Async');

Memory = require('../Memory');

module.exports = {
  type: 'Model',
  "static": {
    ACCESSOR: ACCESSOR = 'accessor',
    BASIC_MUTATOR: BASIC_MUTATOR = 'mutator,basicMutator',
    COMPOUND_MUTATOR: COMPOUND_MUTATOR = 'mutator,compoundMutator',
    ARRAY_MUTATOR: ARRAY_MUTATOR = 'mutator,arrayMutator'
  },
  events: {
    init: function(model) {
      var memory;
      memory = new Memory;
      return model.async = new Async({
        nextTxnId: function() {
          return model._nextTxnId();
        },
        get: function(path, callback) {
          return model._waitOrFetchData([path], function(err, data) {
            var item, items, len, out, subpath, value, _i, _len, _ref;
            if (err) {
              return callback(err);
            }
            if (!((items = data.data) && (len = items.length))) {
              return callback();
            }
            if (len === 1 && (item = items[0]) && item[0] === path) {
              return callback(null, item[1]);
            }
            for (_i = 0, _len = items.length; _i < _len; _i++) {
              _ref = items[_i], subpath = _ref[0], value = _ref[1];
              memory.set(subpath, value, -1);
            }
            out = memory.get(path);
            memory.flush();
            return callback(null, out);
          });
        },
        commit: function(txn, callback) {
          return model._asyncCommit(txn, callback);
        }
      });
    }
  },
  proto: {
    get: {
      type: ACCESSOR,
      fn: function(path) {
        var at;
        if (at = this._at) {
          path = path ? at + '.' + path : at;
        }
        return this._memory.get(path, this._specModel());
      }
    },
    set: {
      type: BASIC_MUTATOR,
      fn: function(path, value, callback) {
        var at, len;
        if (at = this._at) {
          len = arguments.length;
          path = len === 1 || len === 2 && typeof value === 'function' ? (callback = value, value = path, at) : at + '.' + path;
        }
        return this._addOpAsTxn('set', [path, value], callback);
      }
    },
    del: {
      type: BASIC_MUTATOR,
      fn: function(path, callback) {
        var at;
        if (at = this._at) {
          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);
        }
        return this._addOpAsTxn('del', [path], callback);
      }
    },
    add: {
      type: COMPOUND_MUTATOR,
      fn: function(path, value, callback) {
        var id, len;
        id = this.id();
        len = arguments.length;
        if (this._at && len === 1 || len === 2 && typeof value === 'function') {
          callback = value;
          value = path;
          path = id;
        } else {
          path = path + '.' + id;
        }
        if (typeof value !== 'object') {
          throw 'model.add() requires an object argument';
        }
        value.id = id;
        if (callback) {
          this.set(path, value, callback);
        } else {
          this.set(path, value);
        }
        return id;
      }
    },
    setNull: {
      type: COMPOUND_MUTATOR,
      fn: function(path, value, callback) {
        var len, obj;
        len = arguments.length;
        obj = this._at && len === 1 || len === 2 && typeof value === 'function' ? this.get() : this.get(path);
        if (obj != null) {
          return obj;
        }
        if (len === 1) {
          return this.set(path);
        } else if (len === 2) {
          return this.set(path, value);
        } else {
          return this.set(path, value, callback);
        }
      }
    },
    incr: {
      type: COMPOUND_MUTATOR,
      fn: function(path, byNum, callback) {
        var value;
        if (typeof path !== 'string') {
          callback = byNum;
          byNum = path;
          path = '';
        }
        if (typeof byNum === 'function') {
          callback = byNum;
          byNum = 1;
        } else if (typeof byNum !== 'number') {
          byNum = 1;
        }
        value = (this.get(path) || 0) + byNum;
        if (path) {
          this.set(path, value, callback);
          return value;
        }
        if (callback) {
          this.set(value, callback);
        } else {
          this.set(value);
        }
        return value;
      }
    },
    push: {
      type: ARRAY_MUTATOR,
      insertArgs: 1,
      fn: function() {
        var args, at, callback, path;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (at = this._at) {
          if (typeof (path = args[0]) === 'string' && typeof this.get() === 'object') {
            args[0] = at + '.' + path;
          } else {
            args.unshift(at);
          }
        }
        if (typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        return this._addOpAsTxn('push', args, callback);
      }
    },
    unshift: {
      type: ARRAY_MUTATOR,
      insertArgs: 1,
      fn: function() {
        var args, at, callback, path;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (at = this._at) {
          if (typeof (path = args[0]) === 'string' && typeof this.get() === 'object') {
            args[0] = at + '.' + path;
          } else {
            args.unshift(at);
          }
        }
        if (typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        return this._addOpAsTxn('unshift', args, callback);
      }
    },
    insert: {
      type: ARRAY_MUTATOR,
      indexArgs: [1],
      insertArgs: 2,
      fn: function() {
        var args, at, callback, match, path;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (at = this._at) {
          if (typeof (path = args[0]) === 'string' && isNaN(path)) {
            args[0] = at + '.' + path;
          } else {
            args.unshift(at);
          }
        }
        if (match = /^(.*)\.(\d+)$/.exec(args[0])) {
          args[0] = match[1];
          args.splice(1, 0, match[2]);
        }
        if (typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        return this._addOpAsTxn('insert', args, callback);
      }
    },
    pop: {
      type: ARRAY_MUTATOR,
      fn: function(path, callback) {
        var at;
        if (at = this._at) {
          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);
        }
        return this._addOpAsTxn('pop', [path], callback);
      }
    },
    shift: {
      type: ARRAY_MUTATOR,
      fn: function(path, callback) {
        var at;
        if (at = this._at) {
          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);
        }
        return this._addOpAsTxn('shift', [path], callback);
      }
    },
    remove: {
      type: ARRAY_MUTATOR,
      indexArgs: [1],
      fn: function(path, start, howMany, callback) {
        var at, match;
        if (at = this._at) {
          path = typeof path === 'string' && isNaN(path) ? at + '.' + path : (callback = howMany, howMany = start, start = path, at);
        }
        if (match = /^(.*)\.(\d+)$/.exec(path)) {
          callback = howMany;
          howMany = start;
          start = match[2];
          path = match[1];
        }
        if (typeof howMany !== 'number') {
          callback = howMany;
          howMany = 1;
        }
        return this._addOpAsTxn('remove', [path, start, howMany], callback);
      }
    },
    move: {
      type: ARRAY_MUTATOR,
      indexArgs: [1, 2],
      fn: function(path, from, to, howMany, callback) {
        var at, match;
        if (at = this._at) {
          path = typeof path === 'string' && isNaN(path) ? at + '.' + path : (callback = howMany, howMany = to, to = from, from = path, at);
        }
        if (match = /^(.*)\.(\d+)$/.exec(path)) {
          callback = howMany;
          howMany = to;
          to = from;
          from = match[2];
          path = match[1];
        }
        if (typeof howMany !== 'number') {
          callback = howMany;
          howMany = 1;
        }
        return this._addOpAsTxn('move', [path, from, to, howMany], callback);
      }
    }
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/mutators/Async.js",function(require,module,exports,__dirname,__filename,process){var transaction = require('../transaction')
  , noop = require('../util').noop;

// TODO Implement remaining methods for AsyncAtomic
// TODO Redo implementation using a macro

module.exports = Async;

function Async (options) {
  options || (options = {});
  this.get = options.get;
  this._commit = options.commit;

  // Note that async operation clientIds MUST begin with '#', as this is used
  // to treat conflict detection between async and sync transactions differently
  var nextTxnId = options.nextTxnId;
  if (nextTxnId) {
    this._nextTxnId = function (callback) {
      callback(null, '#' + nextTxnId());
    };
  }
}

Async.prototype = {
  set: function (path, value, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'set'
      , args: [path, value]
      });
      self._commit(txn, callback);
    });
  }

, del: function (path, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'del'
      , args: [path]
      });
      self._commit(txn, callback);
    });
  }

, push: function (path, items, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'push'
      , args: [path].concat(items)
      });
      self._commit(txn, callback);
    });
  }

, unshift: function (path, items, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'unshift'
      , args: [path].concat(items)
      });
      self._commit(txn, callback);
    });
  }

, insert: function (path, index, items, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'insert'
      , args: [path, index].concat(items)
      });
      self._commit(txn, callback);
    });
  }

, pop: function (path, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'pop'
      , args: [path]
      });
      self._commit(txn, callback);
    });
  }

, shift: function (path, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'shift'
      , args: [path]
      });
      self._commit(txn, callback);
    });
  }

, remove: function (path, start, howMany, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'remove'
      , args: [path, start, howMany]
      });
      self._commit(txn, callback);
    });
  }

, move: function (path, from, to, howMany, ver, callback) {
    var self = this;
    self._nextTxnId( function (err, id) {
      var txn = transaction.create({
        ver: ver
      , id: id
      , method: 'move'
      , args: [path, from, to, howMany]
      });
      self._commit(txn, callback);
    });
  }

, incr: function (path, byNum, ver, callback) {
    if (typeof byNum === 'function') {
      // For incr(path, callback)
      callback = byNum;
      byNum = 1;
    } else {
      if (byNum == null) byNum = 1;
      callback || (callback = noop);
    }
    var tryVal;
    this.retry( function (atomic) {
      atomic.get(path, function (val) {
        tryVal = (val || 0) + byNum;
        atomic.set(path, tryVal);
      });
    }, function (err) {
      callback(err, tryVal);
    });
  }

, setNull: function (path, value, callback) {
    var tryVal;
    this.retry( function (atomic) {
      atomic.get(path, function (val) {
        if (val != null) return tryVal = val;
        tryVal = value;
        atomic.set(path, tryVal);
      });
    }, function (err) {
      callback(err, tryVal);
    });
  }

, retry: function (fn, callback) {
    var retries = MAX_RETRIES;
    var atomic = new AsyncAtomic(this, function (err) {
      if (!err) return callback && callback();
      if (! retries--) return callback && callback('maxRetries');
      atomic._reset();
      setTimeout(fn, RETRY_DELAY, atomic);
    });
    fn(atomic);
  }
};

Async.MAX_RETRIES = MAX_RETRIES = 20;
Async.RETRY_DELAY = RETRY_DELAY = 100;

function AsyncAtomic (async, cb) {
  this.async = async;
  this.cb = cb;
  this.minVer = 0;
  this.count = 0;
}

AsyncAtomic.prototype = {
  _reset: function () {
    this.minVer = 0;
    this.count = 0;
  }

, get: function (path, callback) {
    var self = this
      , minVer = self.minVer
      , cb = self.cb
    self.async.get(path, function (err, value, ver) {
      if (err) return cb(err);
      self.minVer = minVer ? Math.min(minVer, ver) : ver;
      callback && callback(value);
    });
  }

, set: function (path, value, callback) {
    var self = this
      , cb = self.cb;
    self.count++;
    self.async.set(path, value, self.minVer, function (err, value) {
      if (err) return cb(err);
      callback && callback(null, value);
      --self.count || cb();
    });
  }

, del: function (path, callback) {
    var self = this
      , cb = self.cb;
    self.count++;
    self.async.del(path, self.minVer, function (err) {
      if (err) return cb(err);
      callback && callback();
      --self.count || cb();
    });
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/transaction.js",function(require,module,exports,__dirname,__filename,process){/**
 * Transactions are represented as an Array
 * [ ver = vrsion at teh time of the transaction
 * , transaction id
 * , method
 * , arguments]
 */

module.exports = {
  create: function (obj) {
    return (obj.ops) ? [obj.ver, obj.id, obj.ops]
                     : [obj.ver, obj.id, obj.method, obj.args];
  }

, getVer: function (txn) { return txn[0]; }
, setVer: function (txn, val) { return txn[0] = val; }

, getId: function (txn) { return txn[1]; }
, setId: function (txn, id) { return txn[1] = id; }

, clientIdAndVer: function (txn) {
    var pair = this.getId(txn).split('.');
    pair[1] = parseInt(pair[1], 10);
    return pair;
  }

, getMethod: function (txn) { return txn[2]; }
, setMethod: function (txn, name) { return txn[2] = name; }

, getArgs: function (txn) { return txn[3]; }
, setArgs: function (txn, vals) { return txn[3] = vals; }
, copyArgs: function (txn) { return this.getArgs(txn).slice(); }

, getPath: function (txn) { return this.getArgs(txn)[0]; }
, setPath: function (txn, val) { return this.getArgs(txn)[0] = val; }

, getMeta: function (txn) { return txn[4]; }
, setMeta: function (txn, vals) { return txn[4] = vals; }

, getClientId: function (txn) { return this.getId(txn).split('.')[0]; }
, setClientId: function (txn, clientId) {
    var pair = this.getId(txn).split('.')
      , clientId = pair[0]
      , num = pair[1];
    this.setId(txn, newClientId + '.' + num);
    return newClientId;
  }

, pathConflict: function (pathA, pathB) {
    // Paths conflict if equal or either is a sub-path of the other
    if (pathA === pathB) return 'equal';
    var pathALen = pathA.length
      , pathBLen = pathB.length;
    if (pathALen === pathBLen) return false;
    if (pathALen > pathBLen)
      return pathA.charAt(pathBLen) === '.' && pathA.substr(0, pathBLen) === pathB && 'child';
    return pathB.charAt(pathALen) === '.' && pathB.substr(0, pathALen) === pathA && 'parent';
  }

, ops: function (txn, ops) {
    if (typeof ops !== 'undefined') txn[2] = ops;
    return txn[2];
  }

, isCompound: function (txn) {
    return Array.isArray(txn[2]);
  }

, applyTxn: function (txn, data, memoryAdapter, ver) {
    return applyTxn(this, txn, data, memoryAdapter, ver);
  }

, op: {
    // Creates an operation
    create: function (obj) { return [obj.method, obj.args]; }

  , getMethod: function (op) { return op[0]; }
  , setMethod: function (op, name) { return op[0] = name; }

  , getArgs: function (op) { return op[1]; }
  , setArgs: function (op, vals) { return op[1] = vals; }

  , applyTxn: function (txn, data, memoryAdapter, ver) {
      return applyTxn(this, txn, data, memoryAdapter, ver);
    }
  }
};

function applyTxn (extractor, txn, data, memoryAdapter, ver) {
  var method = extractor.getMethod(txn);
  if (method === 'get') return;
  var args = extractor.getArgs(txn);
  if (ver !== null) {
    ver = extractor.getVer(txn);
  }
  args = args.concat([ver, data]);
  return memoryAdapter[method].apply(memoryAdapter, args);
}
});

require.define("/node_modules/derby/node_modules/racer/lib/refs/index.js",function(require,module,exports,__dirname,__filename,process){var pathUtils             = require('../path')
  , regExpPathOrParent    = pathUtils.regExpPathOrParent
  , regExpPathsOrChildren = pathUtils.regExpPathsOrChildren
  , refUtils              = require('./util')
  , derefPath             = refUtils.derefPath
  , assertPrivateRefPath  = refUtils.assertPrivateRefPath
  , createRef             = require('./ref')
  , createRefList         = require('./refList')
  , equal                 = require('../util').equal
  , unbundledFunction     = require('../bundle/util').unbundledFunction
  , TransformBuilder      = require('../queries/TransformBuilder') // ugh - leaky abstraction
  ;

exports = module.exports = plugin;
exports.useWith = { server: true, browser: true };
exports.decorate = 'racer';

function plugin (racer) {
  racer.mixin(mixin);
}

var mixin = {
  type: 'Model'

, server: __dirname + '/refs.server'
, events: {
    init: function (model) {
      // [[from, get, item], ...]
      model._refsToBundle = [];

      // [['fn', path, inputs..., cb.toString()], ...]
      model._fnsToBundle = [];

      var Model = model.constructor;

      for (var method in Model.mutator) {
        model.on(method, (function (method) {
          return function () {
            model.emit('mutator', method, arguments);
          };
        })(method));
      }

      var memory = model._memory;
      model.on('beforeTxn', function (method, args) {
        var path = args[0];
        if (!path) return;

        // De-reference transactions to operate on their absolute path
        var data = model._specModel()
          , obj  = memory.get(path, data)

            // $deref may be assigned by a getter during the lookup of path in
            // data via memory.get(path, data)
          , fn   = data.$deref;
        if (fn) {
          args[0] = fn(method, args, model, obj);
        }
      });
    }

  , bundle: function (model) {
      var onLoad       = model._onLoad
        , refsToBundle = model._refsToBundle
        , fnsToBundle  = model._fnsToBundle;

      for (var i = 0, l = refsToBundle.length; i < l; i++) {
        var triplet = refsToBundle[i]
          , from    = triplet[0]
          , getter  = triplet[1]
          , item    = triplet[2];
        if (model._getRef(from) === getter) {
          onLoad.push(item);
        }
      }

      for (i = 0, l = fnsToBundle; i < l; i++) {
        var item = fnsToBundle[i];
        if (item) onLoad.push(item);
      }
    }
  }

, proto: {
    /**
     * Assuming that a ref getter was assigned to `path`, this function will
     * return that ref getter function.
     * @param {String} path
     * @return {Function} the ref getter
     */
    _getRef: function (path) {
      // The 3rd argument `true` below tells Memory#get to return the ref
      // getter function, instead of invoking the getter function and resolve
      // the dereferenced value of the ref.
      return this._memory.get(path, this._specModel(), true);
    }

    /**
     * @param {String} path
     * @param {Boolean} getRef
     * @return {String}
     */
  , dereference: function (path, getRef) {
      if (!getRef) getRef = false;
      var data = this._specModel();
      this._memory.get(path, data, getRef);
      return derefPath(data, path);
    }

    /**
     * Creates a ref at `from` that points to `to`, with an optional `key`
     * @param {String} from path
     * @param {String} to path
     * @param {String} @optional key path
     * @param {Boolean} hardLink
     * @return {Model} a model scope scoped to `from`
     */
  , ref: function (from, to, key, hardLink) {
      if (to instanceof TransformBuilder) {
        return this.ref(from, to.path());
      }
      return this._createRef(createRef, 'ref', from, to, key, hardLink);
    }

    /**
     * Creates a refList at `from` with an array of pointers at `key` that
     * point to documents in `to`.
     * @param {String} from path
     * @param {String} to path
     * @param {String} key path
     * @param {Boolean} hardLink
     * @return {Model} a model scope scoped to `from`
     */
  , refList: function (from, to, key, hardLink) {
      return this._createRef(createRefList, 'refList', from, to, key, hardLink);
    }

    /**
     * @param {Function} refFactory
     * @param {String} refType is either 'ref' or 'refList'
     * @param {String} from path
     * @param {String} to path
     * @param {key} key path
     * @param {Boolean} hardLink
     * @return {Model} a model scope scoped to the `from` path
     */
  , _createRef: function (refFactory, refType, from, to, key, hardLink) {
      // Normalize scoped model arguments
      if (from._at) {
        from = from._at;
      } else if (this._at) {
        from = this._at + '.' + from;
      }
      if (to._at) to = to._at;
      if (key && key._at) key = key._at;

      var model = this._root;

      assertPrivateRefPath(model, from, refType);
      var getter = refFactory(model, from, to, key, hardLink);

      model.setRefGetter(from, getter);

      // The server model adds [from, getter, [refType, from, to, key]] to
      // this._refsToBundle
      if (this._onCreateRef) {
        this._onCreateRef(refType, from, to, key, getter);
      }

      return model.at(from);
    }

  , setRefGetter: function (path, getter) {
      var self = this;
      // Prevent emission of the next set event, since we are setting the
      // dereferencing function and not its value.
      var listener = this.on('beforeTxn', function (method, args) {
        // Supress emission of set events when setting a function, which is
        // what happens when a ref is created
        if (method === 'set' && args[1] === getter) {
          args.cancelEmit = true;
          self.removeListener('beforeTxn', listener);
        }
      });

      // Now, set the dereferencing function
      var prevValue = this.set(path, getter);
      // Emit a set event with the expected de-referenced values
      var newValue = this.get(path);
      this.emit('set', [path, newValue], prevValue, true);
    }

    /**
     * TODO
     * Works similar to model.fn(inputs..., fn) but without having to declare
     * inputs. This means that fn also takes no arguments
     */
  , autofn: function (fn) {
      throw new Error('Unimplemented');
      autodep(this, fn);
    }

    /**
     * model.fn(inputs... ,fn);
     *
     * Defines a reactive value that depends on the paths represented by
     * `inputs`, which are used by `fn` to re-calculate a return value every
     * time any of the `inputs` change.
     */
  , fn: function (/* inputs..., fn */) {
      var arglen = arguments.length
        , inputs = Array.prototype.slice.call(arguments, 0, arglen-1)
        , fn = arguments[arglen-1];

      // Convert scoped models into paths
      for (var i = 0, l = inputs.length; i < l; i++) {
        var scopedPath = inputs[i]._at;
        if (scopedPath) inputs[i] = scopedPath;
      }

      var path = inputs.shift()
        , model = this._root;

      // If we are a scoped model, scoped to this._at
      if (this._at) path = this._at + '.' + path;

      assertPrivateRefPath(this, path, 'fn');
      if (typeof fn === 'string') {
        fn = unbundledFunction(fn);
      }
      return model._createFn(path, inputs, fn);
    }

    /**
     * @param {String} path to the reactive value
     * @param {[String]} inputs is a list of paths from which the reactive
     * value is calculated
     * @param {Function} fn returns the reactive value at `path` calculated
     * from the values at the paths defined by `inputs`
     */
  , _createFn: function (path, inputs, fn, destroy) {
      var prevVal, currVal
        , reSelf = regExpPathOrParent(path)
        , reInput = regExpPathsOrChildren(inputs)
        , destroy = this._onCreateFn && this._onCreateFn(path, inputs, fn)
        , self = this;

      var listener = this.on('mutator', function (mutator, _arguments) {
        var mutatorPath = _arguments[0][0];
        // Ignore mutations created by this reactive function
        if (_arguments[3] === listener) return;

        // Remove reactive function if something else sets the value of its
        // output path. We get the current value here, since a mutator might
        // operate on the path or the parent path that does not actually affect
        // the reactive function. The equal function is true if the objects are
        // identical or if they are both NaN
        if (reSelf.test(mutatorPath) && ! equal(self.get(path), currVal)) {
          self.removeListener('mutator', listener);
          return destroy && destroy();
        }

        if (reInput.test(mutatorPath)) {
          currVal = updateVal();
        }
      });

      var model = this.pass(listener);

      var updateVal = function () {
        prevVal = currVal;
        var inputVals = [];
        for (var i = 0, l = inputs.length; i < l; i++) {
          inputVals.push(self.get(inputs[i]));
        }
        currVal = fn.apply(null, inputVals);
        if (equal(prevVal, currVal)) return currVal;
        model.set(path, currVal);
        return currVal;
      };
      return updateVal();
    }
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/refs/util.js",function(require,module,exports,__dirname,__filename,process){var pathUtils = require('../path')
  , isPrivate = pathUtils.isPrivate
  , eventRegExp = pathUtils.eventRegExp;

module.exports = {
  // TODO This is a horribly named function.
  //
  // $deref is invoked in:
  // - via derefPath in refs/util.js
  // - refs/index.js in the 'beforeTxn' callback.
  derefPath: function (data, to) {
    return data.$deref ? data.$deref() : to;
  }

, addListener: addListener

  /**
   * Asserts that the path of a ref is private.
   * @param {Model} model
   * @param {String} path is the path of the ref
   */
, assertPrivateRefPath: function (model, path) {
    if (! isPrivate(model.dereference(path, true)) )
      throw new Error('Cannot create ref on public path "' + path + '"');
  }
};


/**
 * Add a listener function (method, path, arguments) on the 'mutator' event.
 * The listener ignores mutator events that fire on paths that do not match
 * `pattern`
 * @param {Array} listeners is an Array of listener functions that the listener
 * we generate is added to.
 * @param {Model} model is the model to which we add the listener
 * @param {String} from is the private path of the ref
 * @param {Function} getter
 * @param {String} pattern
 * @param {Function} generatePath(match, mutator, args)
 */
function addListener (listeners, model, from, getter, pattern, generatePath) {
  var regexp = eventRegExp(pattern);
  function listener (mutator, _arguments) {
    var path = _arguments[0][0];
    if (! regexp.test(path)) return;

    // Lazy cleanup of listener
    if (model._getRef(from) !== getter) {
      for (var i = listeners.length; i --; ) {
        model.removeListener('mutator', listeners[i]);
      }
      return;
    }

    // Construct the next de-referenced path to emit on. generatePath may also
    // alter args = _arguments[0].slice()
    var args = _arguments[0].slice();
    args.out = _arguments[1];
    var dereffedPath = generatePath(regexp.exec(path), mutator, args);
    if (dereffedPath === null) return;
    args[0] = dereffedPath;
    var isLocal = _arguments[2]
      , pass    = _arguments[3];
    model.emit(mutator, args, args.out, isLocal, pass);
  }
  listeners.push(listener);

  model.on('mutator', listener);
}
});

require.define("/node_modules/derby/node_modules/racer/lib/refs/ref.js",function(require,module,exports,__dirname,__filename,process){var refUtils = require('./util')
  , derefPath = refUtils.derefPath
  , addListener = refUtils.addListener
  , joinPaths = require('../path').join
  , indexOf = require('../util').indexOf
  , Model = require('../Model')
  ;

exports = module.exports = createRef;

function createRef (model, from, to, key, hardLink) {
  if (!from)
    throw new Error('Missing `from` in `model.ref(from, to, key)`');
  if (!to)
    throw new Error('Missing `to` in `model.ref(from, to, key)`');

  if (key) {
    var getter = createGetterWithKey(to, key, hardLink);
    setupRefWithKeyListeners(model, from, to, key, getter);
    return getter;
  }
  var getter = createGetterWithoutKey(to, hardLink);
  setupRefWithoutKeyListeners(model, from, to, getter);
  return getter;
}

/**
 * Generates a function that is assigned to data.$deref
 * @param {Number} len
 * @param {Number} i
 * @param {String} path
 * @param {String} currPath
 * @param {Boolean} hardLink
 * @return {Function}
 */
function derefFn (len, i, path, currPath, hardLink) {
  if (hardLink) return function () { return currPath; };
  return function (method) {
    return (i === len && method in Model.basicMutator) ? path : currPath;
  };
}

/**
 * Returns a getter function that is assigned to the ref's `from` path. When a
 * lookup function encounters the getter, it invokes the getter in order to
 * navigate to the proper node in `data` that is pointed to by the ref. The
 * invocation also "expands" the current path to the absolute path pointed to
 * by the ref.
 *
 * @param {String} to path
 * @param {String} key path
 * @param {Boolean} hardLink
 * @return {Function} getter
 */
function createGetterWithKey (to, key, hardLink) {
  /**
   * @param {Function} lookup as defined in Memory.js
   * @param {Object} data is all data in the Model or the spec model
   * @param {String} path is the path traversed so far to the ref function
   * @param {[String]} props is the array of all properties that we want to traverse
   * @param {Number} len is the number of properties in props
   * @param {Number} i is the index in props representing the current property
   * we are at in our traversal of props
   * @return {[Object, String, Number]} [current node in data, current path,
   * current props index]
   */
  return function getter (lookup, data, path, props, len, i) {
    // Here, lookup(to, data) is called in order for derefPath to work because
    // derefPath looks for data.$deref, which is lazily re-assigned on a lookup
    var obj = lookup(to, data)
      , dereffedPath = derefPath(data, to);

    // Unset $deref
    data.$deref = null;

    var pointer = lookup(key, data);
    if (Array.isArray(obj)) {
      dereffedPath += '.' + indexOf(obj, pointer, equivId);
    } else if (!obj || obj.constructor === Object) {
      dereffedPath += '.' + pointer;
    }
    var curr = lookup(dereffedPath, data)
      , currPath = joinPaths(dereffedPath, props.slice(i));

    // Reset $deref
    data.$deref = derefFn(len, i, path, currPath, hardLink);

    return [curr, currPath, i];
  }
}

function setupRefWithKeyListeners (model, from, to, key, getter) {
  var listeners = [];
  addListener(listeners, model, from, getter, to + '.*', function (match) {
    var keyPath = model.get(key) + '' // Cast to string
      , remainder = match[1];
    if (remainder === keyPath) return from;
    // Test to see if the remainder starts with the keyPath
    var index = keyPath.length;
    if (remainder.substring(0, index + 1) === keyPath + '.') {
      remainder = remainder.substring(index + 1, remainder.length);
      return from + '.' + remainder;
    }
    // Don't emit another event if the keyPath is not matched
    return null;
  });

  addListener(listeners, model, from, getter, key, function (match, mutator, args) {
    var docs = model.get(to)
      , id;
    if (mutator === 'set') {
      id = args[1];
      if (Array.isArray(docs)) {
        args[1] = docs && docs[ indexOf(docs, id, equivId) ];
        args.out = docs && docs[ indexOf(docs, args.out, equivId) ];
      } else {
        args[1] = docs && docs[id];
        args.out = docs && docs[args.out];
      }
    } else if (mutator === 'del') {
      if (Array.isArray(docs)) {
        args.out = docs && docs[ indexOf(docs, args.out, equivId) ];
      } else {
        args.out = docs && docs[args.out];
      }
    }
    return from;
  });
}

function equivId (id, doc) {
  return doc.id === id;
}

function createGetterWithoutKey (to, hardLink) {
  // TODO Bleeding abstraction - This is very much coupled to Memory's implementation and internals.
  return function getter (lookup, data, path, props, len, i) {
    var curr = lookup(to, data)
      , dereffedPath = derefPath(data, to)
      , currPath = joinPaths(dereffedPath, props.slice(i));

    data.$deref = derefFn(len, i, path, currPath, hardLink);

    return [curr, currPath, i];
  };
}

function setupRefWithoutKeyListeners(model, from, to, getter) {
  var listeners = [];
  addListener(listeners, model, from, getter, to + '.*', function (match) {
    return from + '.' + match[1];
  });

  addListener(listeners, model, from, getter, to, function () {
    return from;
  });
}
});

require.define("/node_modules/derby/node_modules/racer/lib/refs/refList.js",function(require,module,exports,__dirname,__filename,process){var util = require('../util')
  , hasKeys = util.hasKeys
  , indexOf = util.indexOf
  , refUtils = require('./util')
  , derefPath = refUtils.derefPath
  , addListener = refUtils.addListener
  , joinPaths = require('../path').join
  , Model = require('../Model')
  ;

module.exports = createRefList;

function createRefList (model, from, to, key) {
  if (!from || !to || !key) {
    throw new Error('Invalid arguments for model.refList');
  }
  var arrayMutators = Model.arrayMutator
    , getter = createGetter(from, to, key)
    , listeners = [];

  addListener(listeners, model, from, getter, key, function (regexpMatch, method, args) {
    var methodMeta = arrayMutators[method]
      , i = methodMeta && methodMeta.insertArgs;
    if (i) {
      var id, docs;
      while ((id = args[i]) && id != null) {
        docs = model.get(to);
        args[i] = (Array.isArray(docs))
                ? docs && docs[ indexOf(docs, id, function (id, doc) { return doc.id === id; })  ]
                : docs && docs[id];
        // args[i] = model.get(to + '.' + id);
        i++;
      }
    }
    return from;
  });

  addListener(listeners, model, from, getter, to + '.*', function (regexpMatch) {
    var id = regexpMatch[1]
      , i = id.indexOf('.')
      , remainder;
    if (~i) {
      remainder = id.substr(i+1);
      id = id.substr(0, i);
    }
    var pointerList = model.get(key);
    if (!pointerList) return null;
    i = pointerList.indexOf(id);
    if (i === -1) return null;
    return remainder ?
      from + '.' + i + '.' + remainder :
      from + '.' + i;
  });

  return getter;
}

function createGetter (from, to, key) {
  /**
   * This represents a ref function that is assigned as the value of the node
   * located at `path` in `data`
   *
   * @param {Function} lookup is the Memory lookup function
   * @param {Object} data is the speculative or non-speculative data tree
   * @param {String} path is the current path to the ref function
   * @param {[String]} props is the chain of properties representing a full
   * path, of which path may be just a sub path
   * @param {Number} len is the number of properties in props
   * @param {Number} i is the array index of props that we are currently at
   * @return {Array} [evaled, path, i] where
   */
  return function getter (lookup, data, path, props, len, i) {
    var basicMutators = Model.basicMutator
      , arrayMutators = Model.arrayMutator

    // Here, lookup(to, data) is called in order for derefPath to work because
    // derefPath looks for data.$deref, which is lazily re-assigned on a lookup
      , obj = lookup(to, data) || {}
      , dereffed = derefPath(data, to);
    data.$deref = null;
    var pointerList = lookup(key, data)
      , dereffedKey = derefPath(data, key)
      , currPath, id;

    if (i === len) {
      // Method is on the refList itself
      currPath = joinPaths(dereffed, props.slice(i));

      // TODO The mutation of args in here is bad software engineering. It took
      // me a while to track down where args was getting transformed. Fix this.
      data.$deref = function (method, args, model) {
        if (!method || (method in basicMutators)) return path;

        var mutator, j, arg, indexArgs;
        if (mutator = arrayMutators[method]) {
          // Handle index args if they are specified by id
          if (indexArgs = mutator.indexArgs) for (var k = 0, kk = indexArgs.length; k < kk; k++) {
            j = indexArgs[k]
            arg = args[j];
            if (!arg) continue;
            id = arg.id;
            if (id == null) continue;
            // Replace id arg with the current index for the given id
            var idIndex = pointerList.indexOf(id);
            if (idIndex !== -1) args[j] = idIndex;
          } // end if (indexArgs)

          if (j = mutator.insertArgs) while (arg = args[j]) {
            id = (arg.id != null)
               ? arg.id
               : (arg.id = model.id());
            // Set the object being inserted if it contains any properties
            // other than id
            if (hasKeys(arg, 'id')) {
              model.set(dereffed + '.' + id, arg);
            }
            args[j] = id;
            j++;
          }

          return dereffedKey;
        }

        throw new Error(method + ' unsupported on refList');
      }; // end of data.$deref function

      if (pointerList) {
        var curr = [];
        for (var k = 0, kk = pointerList.length; k < kk; k++) {
          var idVal = pointerList[k]
            , docToAdd;
          if (obj.constructor === Object) {
            docToAdd = obj[idVal];
          } else if (Array.isArray(obj)) {
            docToAdd = obj[indexOf(obj, idVal, function (id, doc) { return doc.id === id; })];
          } else {
            throw new TypeError();
          }
          curr.push(docToAdd);
        }
        return [curr, currPath, i];
      }

      return [undefined, currPath, i];

    } else { // if (i !== len)
      var index = props[i++]
        , prop, curr;

      if (pointerList && (prop = pointerList[index])) {
        curr = obj[prop];
      }

      if (i === len) {
        // Method is on an index of refList
        currPath = joinPaths(dereffed, props.slice(i));

        data.$deref = function (method, args, model, obj) {
          // TODO Additional model methods should be done atomically with the
          // original txn instead of making an additional txn

          var value, id;
          if (method === 'set') {
            value = args[1];
            id = (value.id != null)
               ? value.id
               : (value.id = model.id());
            if (pointerList) {
              model.set(dereffedKey + '.' + index, id);
            } else {
              model.set(dereffedKey, [id]);
            }
            return currPath + '.' + id;
          }

          if (method === 'del') {
            id = obj.id;
            if (id == null) {
              throw new Error('Cannot delete refList item without id');
            }
            model.del(dereffedKey + '.' + index);
            return currPath + '.' + id;
          }

          throw new Error(method + ' unsupported on refList index');
        } // end of data.$deref function

      } else { // if (i !== len)
        // Method is on a child of the refList
        currPath = (prop == null)
                 ? joinPaths(dereffed, props.slice(i))
                 : joinPaths(dereffed, prop, props.slice(i));

        data.$deref = function (method) {
          if (method && prop == null) {
            throw new Error(method + ' on undefined refList child ' + props.join('.'));
          }
          return currPath;
        };
      }

      return [curr, currPath, i];
    }
  };
}
});

require.define("/node_modules/derby/node_modules/racer/lib/bundle/util.js",function(require,module,exports,__dirname,__filename,process){var uglify = require('uglify-js')
  , isProduction = require('../util').isProduction

module.exports = {
  bundledFunction: function (fn) {
    fn = fn.toString();
    if (isProduction) {
      // Uglify can't parse a naked function. Executing it allows Uglify to
      // parse it properly
      var uglified = uglify('(' + fn + ')()');
      fn = uglified.slice(1, -3);
    }
    return fn;
  }

, unbundledFunction: function (fnStr) {
    return (new Function('return ' + fnStr + ';'))();
  }
};
});

require.define("/node_modules/derby/node_modules/racer/node_modules/uglify-js/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./uglify-js.js"}});

require.define("/node_modules/derby/node_modules/racer/node_modules/uglify-js/uglify-js.js",function(require,module,exports,__dirname,__filename,process){//convienence function(src, [options]);
function uglify(orig_code, options){
  options || (options = {});
  var jsp = uglify.parser;
  var pro = uglify.uglify;

  var ast = jsp.parse(orig_code, options.strict_semicolons); // parse code and get the initial AST
  ast = pro.ast_mangle(ast, options.mangle_options); // get a new AST with mangled names
  ast = pro.ast_squeeze(ast, options.squeeze_options); // get an AST with compression optimizations
  var final_code = pro.gen_code(ast, options.gen_options); // compressed code here
  return final_code;
};

uglify.parser = require("./lib/parse-js");
uglify.uglify = require("./lib/process");
uglify.consolidator = require("./lib/consolidator");

module.exports = uglify
});

require.define("/node_modules/derby/node_modules/racer/node_modules/uglify-js/lib/parse-js.js",function(require,module,exports,__dirname,__filename,process){/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.

  This version is suitable for Node.js.  With minimal changes (the
  exports stuff) it should work on any JS platform.

  This file contains the tokenizer/parser.  It is a port to JavaScript
  of parse-js [1], a JavaScript parser library written in Common Lisp
  by Marijn Haverbeke.  Thank you Marijn!

  [1] http://marijn.haverbeke.nl/parse-js/

  Exported functions:

    - tokenizer(code) -- returns a function.  Call the returned
      function to fetch the next token.

    - parse(code) -- returns an AST of the given JavaScript code.

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>
    Based on parse-js (http://marijn.haverbeke.nl/parse-js/).

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

/* -----[ Tokenizer (constants) ]----- */

var KEYWORDS = array_to_hash([
        "break",
        "case",
        "catch",
        "const",
        "continue",
        "debugger",
        "default",
        "delete",
        "do",
        "else",
        "finally",
        "for",
        "function",
        "if",
        "in",
        "instanceof",
        "new",
        "return",
        "switch",
        "throw",
        "try",
        "typeof",
        "var",
        "void",
        "while",
        "with"
]);

var RESERVED_WORDS = array_to_hash([
        "abstract",
        "boolean",
        "byte",
        "char",
        "class",
        "double",
        "enum",
        "export",
        "extends",
        "final",
        "float",
        "goto",
        "implements",
        "import",
        "int",
        "interface",
        "long",
        "native",
        "package",
        "private",
        "protected",
        "public",
        "short",
        "static",
        "super",
        "synchronized",
        "throws",
        "transient",
        "volatile"
]);

var KEYWORDS_BEFORE_EXPRESSION = array_to_hash([
        "return",
        "new",
        "delete",
        "throw",
        "else",
        "case"
]);

var KEYWORDS_ATOM = array_to_hash([
        "false",
        "null",
        "true",
        "undefined"
]);

var OPERATOR_CHARS = array_to_hash(characters("+-*&%=<>!?|~^"));

var RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;
var RE_OCT_NUMBER = /^0[0-7]+$/;
var RE_DEC_NUMBER = /^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i;

var OPERATORS = array_to_hash([
        "in",
        "instanceof",
        "typeof",
        "new",
        "void",
        "delete",
        "++",
        "--",
        "+",
        "-",
        "!",
        "~",
        "&",
        "|",
        "^",
        "*",
        "/",
        "%",
        ">>",
        "<<",
        ">>>",
        "<",
        ">",
        "<=",
        ">=",
        "==",
        "===",
        "!=",
        "!==",
        "?",
        "=",
        "+=",
        "-=",
        "/=",
        "*=",
        "%=",
        ">>=",
        "<<=",
        ">>>=",
        "|=",
        "^=",
        "&=",
        "&&",
        "||"
]);

var WHITESPACE_CHARS = array_to_hash(characters(" \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000"));

var PUNC_BEFORE_EXPRESSION = array_to_hash(characters("[{(,.;:"));

var PUNC_CHARS = array_to_hash(characters("[]{}(),;:"));

var REGEXP_MODIFIERS = array_to_hash(characters("gmsiy"));

/* -----[ Tokenizer ]----- */

var UNICODE = {  // Unicode 6.1
        letter: new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u0527\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0\\u08A2-\\u08AC\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0977\\u0979-\\u097F\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F0\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191C\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA697\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA793\\uA7A0-\\uA7AA\\uA7F8-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA80-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),
        combining_mark: new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u08E4-\\u08FE\\u0900-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C01-\\u0C03\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C82\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0D02\\u0D03\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D82\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF2-\\u1CF4\\u1DC0-\\u1DE6\\u1DFC-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA674-\\uA67D\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA880\\uA881\\uA8B4-\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),
        connector_punctuation: new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]"),
        digit: new RegExp("[\\u0030-\\u0039\\u0660-\\u0669\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]")
};

function is_letter(ch) {
        return UNICODE.letter.test(ch);
};

function is_digit(ch) {
        ch = ch.charCodeAt(0);
        return ch >= 48 && ch <= 57;
};

function is_unicode_digit(ch) {
        return UNICODE.digit.test(ch);
}

function is_alphanumeric_char(ch) {
        return is_digit(ch) || is_letter(ch);
};

function is_unicode_combining_mark(ch) {
        return UNICODE.combining_mark.test(ch);
};

function is_unicode_connector_punctuation(ch) {
        return UNICODE.connector_punctuation.test(ch);
};

function is_identifier_start(ch) {
        return ch == "$" || ch == "_" || is_letter(ch);
};

function is_identifier_char(ch) {
        return is_identifier_start(ch)
                || is_unicode_combining_mark(ch)
                || is_unicode_digit(ch)
                || is_unicode_connector_punctuation(ch)
                || ch == "\u200c" // zero-width non-joiner <ZWNJ>
                || ch == "\u200d" // zero-width joiner <ZWJ> (in my ECMA-262 PDF, this is also 200c)
        ;
};

function parse_js_number(num) {
        if (RE_HEX_NUMBER.test(num)) {
                return parseInt(num.substr(2), 16);
        } else if (RE_OCT_NUMBER.test(num)) {
                return parseInt(num.substr(1), 8);
        } else if (RE_DEC_NUMBER.test(num)) {
                return parseFloat(num);
        }
};

function JS_Parse_Error(message, line, col, pos) {
        this.message = message;
        this.line = line + 1;
        this.col = col + 1;
        this.pos = pos + 1;
        this.stack = new Error().stack;
};

JS_Parse_Error.prototype.toString = function() {
        return this.message + " (line: " + this.line + ", col: " + this.col + ", pos: " + this.pos + ")" + "\n\n" + this.stack;
};

function js_error(message, line, col, pos) {
        throw new JS_Parse_Error(message, line, col, pos);
};

function is_token(token, type, val) {
        return token.type == type && (val == null || token.value == val);
};

var EX_EOF = {};

function tokenizer($TEXT) {

        var S = {
                text            : $TEXT.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/^\uFEFF/, ''),
                pos             : 0,
                tokpos          : 0,
                line            : 0,
                tokline         : 0,
                col             : 0,
                tokcol          : 0,
                newline_before  : false,
                regex_allowed   : false,
                comments_before : []
        };

        function peek() { return S.text.charAt(S.pos); };

        function next(signal_eof, in_string) {
                var ch = S.text.charAt(S.pos++);
                if (signal_eof && !ch)
                        throw EX_EOF;
                if (ch == "\n") {
                        S.newline_before = S.newline_before || !in_string;
                        ++S.line;
                        S.col = 0;
                } else {
                        ++S.col;
                }
                return ch;
        };

        function eof() {
                return !S.peek();
        };

        function find(what, signal_eof) {
                var pos = S.text.indexOf(what, S.pos);
                if (signal_eof && pos == -1) throw EX_EOF;
                return pos;
        };

        function start_token() {
                S.tokline = S.line;
                S.tokcol = S.col;
                S.tokpos = S.pos;
        };

        function token(type, value, is_comment) {
                S.regex_allowed = ((type == "operator" && !HOP(UNARY_POSTFIX, value)) ||
                                   (type == "keyword" && HOP(KEYWORDS_BEFORE_EXPRESSION, value)) ||
                                   (type == "punc" && HOP(PUNC_BEFORE_EXPRESSION, value)));
                var ret = {
                        type   : type,
                        value  : value,
                        line   : S.tokline,
                        col    : S.tokcol,
                        pos    : S.tokpos,
                        endpos : S.pos,
                        nlb    : S.newline_before
                };
                if (!is_comment) {
                        ret.comments_before = S.comments_before;
                        S.comments_before = [];
                        // make note of any newlines in the comments that came before
                        for (var i = 0, len = ret.comments_before.length; i < len; i++) {
                                ret.nlb = ret.nlb || ret.comments_before[i].nlb;
                        }
                }
                S.newline_before = false;
                return ret;
        };

        function skip_whitespace() {
                while (HOP(WHITESPACE_CHARS, peek()))
                        next();
        };

        function read_while(pred) {
                var ret = "", ch = peek(), i = 0;
                while (ch && pred(ch, i++)) {
                        ret += next();
                        ch = peek();
                }
                return ret;
        };

        function parse_error(err) {
                js_error(err, S.tokline, S.tokcol, S.tokpos);
        };

        function read_num(prefix) {
                var has_e = false, after_e = false, has_x = false, has_dot = prefix == ".";
                var num = read_while(function(ch, i){
                        if (ch == "x" || ch == "X") {
                                if (has_x) return false;
                                return has_x = true;
                        }
                        if (!has_x && (ch == "E" || ch == "e")) {
                                if (has_e) return false;
                                return has_e = after_e = true;
                        }
                        if (ch == "-") {
                                if (after_e || (i == 0 && !prefix)) return true;
                                return false;
                        }
                        if (ch == "+") return after_e;
                        after_e = false;
                        if (ch == ".") {
                                if (!has_dot && !has_x && !has_e)
                                        return has_dot = true;
                                return false;
                        }
                        return is_alphanumeric_char(ch);
                });
                if (prefix)
                        num = prefix + num;
                var valid = parse_js_number(num);
                if (!isNaN(valid)) {
                        return token("num", valid);
                } else {
                        parse_error("Invalid syntax: " + num);
                }
        };

        function read_escaped_char(in_string) {
                var ch = next(true, in_string);
                switch (ch) {
                    case "n" : return "\n";
                    case "r" : return "\r";
                    case "t" : return "\t";
                    case "b" : return "\b";
                    case "v" : return "\u000b";
                    case "f" : return "\f";
                    case "0" : return "\0";
                    case "x" : return String.fromCharCode(hex_bytes(2));
                    case "u" : return String.fromCharCode(hex_bytes(4));
                    case "\n": return "";
                    default  : return ch;
                }
        };

        function hex_bytes(n) {
                var num = 0;
                for (; n > 0; --n) {
                        var digit = parseInt(next(true), 16);
                        if (isNaN(digit))
                                parse_error("Invalid hex-character pattern in string");
                        num = (num << 4) | digit;
                }
                return num;
        };

        function read_string() {
                return with_eof_error("Unterminated string constant", function(){
                        var quote = next(), ret = "";
                        for (;;) {
                                var ch = next(true);
                                if (ch == "\\") {
                                        // read OctalEscapeSequence (XXX: deprecated if "strict mode")
                                        // https://github.com/mishoo/UglifyJS/issues/178
                                        var octal_len = 0, first = null;
                                        ch = read_while(function(ch){
                                                if (ch >= "0" && ch <= "7") {
                                                        if (!first) {
                                                                first = ch;
                                                                return ++octal_len;
                                                        }
                                                        else if (first <= "3" && octal_len <= 2) return ++octal_len;
                                                        else if (first >= "4" && octal_len <= 1) return ++octal_len;
                                                }
                                                return false;
                                        });
                                        if (octal_len > 0) ch = String.fromCharCode(parseInt(ch, 8));
                                        else ch = read_escaped_char(true);
                                }
                                else if (ch == quote) break;
                                ret += ch;
                        }
                        return token("string", ret);
                });
        };

        function read_line_comment() {
                next();
                var i = find("\n"), ret;
                if (i == -1) {
                        ret = S.text.substr(S.pos);
                        S.pos = S.text.length;
                } else {
                        ret = S.text.substring(S.pos, i);
                        S.pos = i;
                }
                return token("comment1", ret, true);
        };

        function read_multiline_comment() {
                next();
                return with_eof_error("Unterminated multiline comment", function(){
                        var i = find("*/", true),
                            text = S.text.substring(S.pos, i);
                        S.pos = i + 2;
                        S.line += text.split("\n").length - 1;
                        S.newline_before = S.newline_before || text.indexOf("\n") >= 0;

                        // https://github.com/mishoo/UglifyJS/issues/#issue/100
                        if (/^@cc_on/i.test(text)) {
                                warn("WARNING: at line " + S.line);
                                warn("*** Found \"conditional comment\": " + text);
                                warn("*** UglifyJS DISCARDS ALL COMMENTS.  This means your code might no longer work properly in Internet Explorer.");
                        }

                        return token("comment2", text, true);
                });
        };

        function read_name() {
                var backslash = false, name = "", ch, escaped = false, hex;
                while ((ch = peek()) != null) {
                        if (!backslash) {
                                if (ch == "\\") escaped = backslash = true, next();
                                else if (is_identifier_char(ch)) name += next();
                                else break;
                        }
                        else {
                                if (ch != "u") parse_error("Expecting UnicodeEscapeSequence -- uXXXX");
                                ch = read_escaped_char();
                                if (!is_identifier_char(ch)) parse_error("Unicode char: " + ch.charCodeAt(0) + " is not valid in identifier");
                                name += ch;
                                backslash = false;
                        }
                }
                if (HOP(KEYWORDS, name) && escaped) {
                        hex = name.charCodeAt(0).toString(16).toUpperCase();
                        name = "\\u" + "0000".substr(hex.length) + hex + name.slice(1);
                }
                return name;
        };

        function read_regexp(regexp) {
                return with_eof_error("Unterminated regular expression", function(){
                        var prev_backslash = false, ch, in_class = false;
                        while ((ch = next(true))) if (prev_backslash) {
                                regexp += "\\" + ch;
                                prev_backslash = false;
                        } else if (ch == "[") {
                                in_class = true;
                                regexp += ch;
                        } else if (ch == "]" && in_class) {
                                in_class = false;
                                regexp += ch;
                        } else if (ch == "/" && !in_class) {
                                break;
                        } else if (ch == "\\") {
                                prev_backslash = true;
                        } else {
                                regexp += ch;
                        }
                        var mods = read_name();
                        return token("regexp", [ regexp, mods ]);
                });
        };

        function read_operator(prefix) {
                function grow(op) {
                        if (!peek()) return op;
                        var bigger = op + peek();
                        if (HOP(OPERATORS, bigger)) {
                                next();
                                return grow(bigger);
                        } else {
                                return op;
                        }
                };
                return token("operator", grow(prefix || next()));
        };

        function handle_slash() {
                next();
                var regex_allowed = S.regex_allowed;
                switch (peek()) {
                    case "/":
                        S.comments_before.push(read_line_comment());
                        S.regex_allowed = regex_allowed;
                        return next_token();
                    case "*":
                        S.comments_before.push(read_multiline_comment());
                        S.regex_allowed = regex_allowed;
                        return next_token();
                }
                return S.regex_allowed ? read_regexp("") : read_operator("/");
        };

        function handle_dot() {
                next();
                return is_digit(peek())
                        ? read_num(".")
                        : token("punc", ".");
        };

        function read_word() {
                var word = read_name();
                return !HOP(KEYWORDS, word)
                        ? token("name", word)
                        : HOP(OPERATORS, word)
                        ? token("operator", word)
                        : HOP(KEYWORDS_ATOM, word)
                        ? token("atom", word)
                        : token("keyword", word);
        };

        function with_eof_error(eof_error, cont) {
                try {
                        return cont();
                } catch(ex) {
                        if (ex === EX_EOF) parse_error(eof_error);
                        else throw ex;
                }
        };

        function next_token(force_regexp) {
                if (force_regexp != null)
                        return read_regexp(force_regexp);
                skip_whitespace();
                start_token();
                var ch = peek();
                if (!ch) return token("eof");
                if (is_digit(ch)) return read_num();
                if (ch == '"' || ch == "'") return read_string();
                if (HOP(PUNC_CHARS, ch)) return token("punc", next());
                if (ch == ".") return handle_dot();
                if (ch == "/") return handle_slash();
                if (HOP(OPERATOR_CHARS, ch)) return read_operator();
                if (ch == "\\" || is_identifier_start(ch)) return read_word();
                parse_error("Unexpected character '" + ch + "'");
        };

        next_token.context = function(nc) {
                if (nc) S = nc;
                return S;
        };

        return next_token;

};

/* -----[ Parser (constants) ]----- */

var UNARY_PREFIX = array_to_hash([
        "typeof",
        "void",
        "delete",
        "--",
        "++",
        "!",
        "~",
        "-",
        "+"
]);

var UNARY_POSTFIX = array_to_hash([ "--", "++" ]);

var ASSIGNMENT = (function(a, ret, i){
        while (i < a.length) {
                ret[a[i]] = a[i].substr(0, a[i].length - 1);
                i++;
        }
        return ret;
})(
        ["+=", "-=", "/=", "*=", "%=", ">>=", "<<=", ">>>=", "|=", "^=", "&="],
        { "=": true },
        0
);

var PRECEDENCE = (function(a, ret){
        for (var i = 0, n = 1; i < a.length; ++i, ++n) {
                var b = a[i];
                for (var j = 0; j < b.length; ++j) {
                        ret[b[j]] = n;
                }
        }
        return ret;
})(
        [
                ["||"],
                ["&&"],
                ["|"],
                ["^"],
                ["&"],
                ["==", "===", "!=", "!=="],
                ["<", ">", "<=", ">=", "in", "instanceof"],
                [">>", "<<", ">>>"],
                ["+", "-"],
                ["*", "/", "%"]
        ],
        {}
);

var STATEMENTS_WITH_LABELS = array_to_hash([ "for", "do", "while", "switch" ]);

var ATOMIC_START_TOKEN = array_to_hash([ "atom", "num", "string", "regexp", "name" ]);

/* -----[ Parser ]----- */

function NodeWithToken(str, start, end) {
        this.name = str;
        this.start = start;
        this.end = end;
};

NodeWithToken.prototype.toString = function() { return this.name; };

function parse($TEXT, exigent_mode, embed_tokens) {

        var S = {
                input         : typeof $TEXT == "string" ? tokenizer($TEXT, true) : $TEXT,
                token         : null,
                prev          : null,
                peeked        : null,
                in_function   : 0,
                in_directives : true,
                in_loop       : 0,
                labels        : []
        };

        S.token = next();

        function is(type, value) {
                return is_token(S.token, type, value);
        };

        function peek() { return S.peeked || (S.peeked = S.input()); };

        function next() {
                S.prev = S.token;
                if (S.peeked) {
                        S.token = S.peeked;
                        S.peeked = null;
                } else {
                        S.token = S.input();
                }
                S.in_directives = S.in_directives && (
                        S.token.type == "string" || is("punc", ";")
                );
                return S.token;
        };

        function prev() {
                return S.prev;
        };

        function croak(msg, line, col, pos) {
                var ctx = S.input.context();
                js_error(msg,
                         line != null ? line : ctx.tokline,
                         col != null ? col : ctx.tokcol,
                         pos != null ? pos : ctx.tokpos);
        };

        function token_error(token, msg) {
                croak(msg, token.line, token.col);
        };

        function unexpected(token) {
                if (token == null)
                        token = S.token;
                token_error(token, "Unexpected token: " + token.type + " (" + token.value + ")");
        };

        function expect_token(type, val) {
                if (is(type, val)) {
                        return next();
                }
                token_error(S.token, "Unexpected token " + S.token.type + ", expected " + type);
        };

        function expect(punc) { return expect_token("punc", punc); };

        function can_insert_semicolon() {
                return !exigent_mode && (
                        S.token.nlb || is("eof") || is("punc", "}")
                );
        };

        function semicolon() {
                if (is("punc", ";")) next();
                else if (!can_insert_semicolon()) unexpected();
        };

        function as() {
                return slice(arguments);
        };

        function parenthesised() {
                expect("(");
                var ex = expression();
                expect(")");
                return ex;
        };

        function add_tokens(str, start, end) {
                return str instanceof NodeWithToken ? str : new NodeWithToken(str, start, end);
        };

        function maybe_embed_tokens(parser) {
                if (embed_tokens) return function() {
                        var start = S.token;
                        var ast = parser.apply(this, arguments);
                        ast[0] = add_tokens(ast[0], start, prev());
                        return ast;
                };
                else return parser;
        };

        var statement = maybe_embed_tokens(function() {
                if (is("operator", "/") || is("operator", "/=")) {
                        S.peeked = null;
                        S.token = S.input(S.token.value.substr(1)); // force regexp
                }
                switch (S.token.type) {
                    case "string":
                        var dir = S.in_directives, stat = simple_statement();
                        if (dir && stat[1][0] == "string" && !is("punc", ","))
                            return as("directive", stat[1][1]);
                        return stat;
                    case "num":
                    case "regexp":
                    case "operator":
                    case "atom":
                        return simple_statement();

                    case "name":
                        return is_token(peek(), "punc", ":")
                                ? labeled_statement(prog1(S.token.value, next, next))
                                : simple_statement();

                    case "punc":
                        switch (S.token.value) {
                            case "{":
                                return as("block", block_());
                            case "[":
                            case "(":
                                return simple_statement();
                            case ";":
                                next();
                                return as("block");
                            default:
                                unexpected();
                        }

                    case "keyword":
                        switch (prog1(S.token.value, next)) {
                            case "break":
                                return break_cont("break");

                            case "continue":
                                return break_cont("continue");

                            case "debugger":
                                semicolon();
                                return as("debugger");

                            case "do":
                                return (function(body){
                                        expect_token("keyword", "while");
                                        return as("do", prog1(parenthesised, semicolon), body);
                                })(in_loop(statement));

                            case "for":
                                return for_();

                            case "function":
                                return function_(true);

                            case "if":
                                return if_();

                            case "return":
                                if (S.in_function == 0)
                                        croak("'return' outside of function");
                                return as("return",
                                          is("punc", ";")
                                          ? (next(), null)
                                          : can_insert_semicolon()
                                          ? null
                                          : prog1(expression, semicolon));

                            case "switch":
                                return as("switch", parenthesised(), switch_block_());

                            case "throw":
                                if (S.token.nlb)
                                        croak("Illegal newline after 'throw'");
                                return as("throw", prog1(expression, semicolon));

                            case "try":
                                return try_();

                            case "var":
                                return prog1(var_, semicolon);

                            case "const":
                                return prog1(const_, semicolon);

                            case "while":
                                return as("while", parenthesised(), in_loop(statement));

                            case "with":
                                return as("with", parenthesised(), statement());

                            default:
                                unexpected();
                        }
                }
        });

        function labeled_statement(label) {
                S.labels.push(label);
                var start = S.token, stat = statement();
                if (exigent_mode && !HOP(STATEMENTS_WITH_LABELS, stat[0]))
                        unexpected(start);
                S.labels.pop();
                return as("label", label, stat);
        };

        function simple_statement() {
                return as("stat", prog1(expression, semicolon));
        };

        function break_cont(type) {
                var name;
                if (!can_insert_semicolon()) {
                        name = is("name") ? S.token.value : null;
                }
                if (name != null) {
                        next();
                        if (!member(name, S.labels))
                                croak("Label " + name + " without matching loop or statement");
                }
                else if (S.in_loop == 0)
                        croak(type + " not inside a loop or switch");
                semicolon();
                return as(type, name);
        };

        function for_() {
                expect("(");
                var init = null;
                if (!is("punc", ";")) {
                        init = is("keyword", "var")
                                ? (next(), var_(true))
                                : expression(true, true);
                        if (is("operator", "in")) {
                                if (init[0] == "var" && init[1].length > 1)
                                        croak("Only one variable declaration allowed in for..in loop");
                                return for_in(init);
                        }
                }
                return regular_for(init);
        };

        function regular_for(init) {
                expect(";");
                var test = is("punc", ";") ? null : expression();
                expect(";");
                var step = is("punc", ")") ? null : expression();
                expect(")");
                return as("for", init, test, step, in_loop(statement));
        };

        function for_in(init) {
                var lhs = init[0] == "var" ? as("name", init[1][0]) : init;
                next();
                var obj = expression();
                expect(")");
                return as("for-in", init, lhs, obj, in_loop(statement));
        };

        var function_ = function(in_statement) {
                var name = is("name") ? prog1(S.token.value, next) : null;
                if (in_statement && !name)
                        unexpected();
                expect("(");
                return as(in_statement ? "defun" : "function",
                          name,
                          // arguments
                          (function(first, a){
                                  while (!is("punc", ")")) {
                                          if (first) first = false; else expect(",");
                                          if (!is("name")) unexpected();
                                          a.push(S.token.value);
                                          next();
                                  }
                                  next();
                                  return a;
                          })(true, []),
                          // body
                          (function(){
                                  ++S.in_function;
                                  var loop = S.in_loop;
                                  S.in_directives = true;
                                  S.in_loop = 0;
                                  var a = block_();
                                  --S.in_function;
                                  S.in_loop = loop;
                                  return a;
                          })());
        };

        function if_() {
                var cond = parenthesised(), body = statement(), belse;
                if (is("keyword", "else")) {
                        next();
                        belse = statement();
                }
                return as("if", cond, body, belse);
        };

        function block_() {
                expect("{");
                var a = [];
                while (!is("punc", "}")) {
                        if (is("eof")) unexpected();
                        a.push(statement());
                }
                next();
                return a;
        };

        var switch_block_ = curry(in_loop, function(){
                expect("{");
                var a = [], cur = null;
                while (!is("punc", "}")) {
                        if (is("eof")) unexpected();
                        if (is("keyword", "case")) {
                                next();
                                cur = [];
                                a.push([ expression(), cur ]);
                                expect(":");
                        }
                        else if (is("keyword", "default")) {
                                next();
                                expect(":");
                                cur = [];
                                a.push([ null, cur ]);
                        }
                        else {
                                if (!cur) unexpected();
                                cur.push(statement());
                        }
                }
                next();
                return a;
        });

        function try_() {
                var body = block_(), bcatch, bfinally;
                if (is("keyword", "catch")) {
                        next();
                        expect("(");
                        if (!is("name"))
                                croak("Name expected");
                        var name = S.token.value;
                        next();
                        expect(")");
                        bcatch = [ name, block_() ];
                }
                if (is("keyword", "finally")) {
                        next();
                        bfinally = block_();
                }
                if (!bcatch && !bfinally)
                        croak("Missing catch/finally blocks");
                return as("try", body, bcatch, bfinally);
        };

        function vardefs(no_in) {
                var a = [];
                for (;;) {
                        if (!is("name"))
                                unexpected();
                        var name = S.token.value;
                        next();
                        if (is("operator", "=")) {
                                next();
                                a.push([ name, expression(false, no_in) ]);
                        } else {
                                a.push([ name ]);
                        }
                        if (!is("punc", ","))
                                break;
                        next();
                }
                return a;
        };

        function var_(no_in) {
                return as("var", vardefs(no_in));
        };

        function const_() {
                return as("const", vardefs());
        };

        function new_() {
                var newexp = expr_atom(false), args;
                if (is("punc", "(")) {
                        next();
                        args = expr_list(")");
                } else {
                        args = [];
                }
                return subscripts(as("new", newexp, args), true);
        };

        var expr_atom = maybe_embed_tokens(function(allow_calls) {
                if (is("operator", "new")) {
                        next();
                        return new_();
                }
                if (is("punc")) {
                        switch (S.token.value) {
                            case "(":
                                next();
                                return subscripts(prog1(expression, curry(expect, ")")), allow_calls);
                            case "[":
                                next();
                                return subscripts(array_(), allow_calls);
                            case "{":
                                next();
                                return subscripts(object_(), allow_calls);
                        }
                        unexpected();
                }
                if (is("keyword", "function")) {
                        next();
                        return subscripts(function_(false), allow_calls);
                }
                if (HOP(ATOMIC_START_TOKEN, S.token.type)) {
                        var atom = S.token.type == "regexp"
                                ? as("regexp", S.token.value[0], S.token.value[1])
                                : as(S.token.type, S.token.value);
                        return subscripts(prog1(atom, next), allow_calls);
                }
                unexpected();
        });

        function expr_list(closing, allow_trailing_comma, allow_empty) {
                var first = true, a = [];
                while (!is("punc", closing)) {
                        if (first) first = false; else expect(",");
                        if (allow_trailing_comma && is("punc", closing)) break;
                        if (is("punc", ",") && allow_empty) {
                                a.push([ "atom", "undefined" ]);
                        } else {
                                a.push(expression(false));
                        }
                }
                next();
                return a;
        };

        function array_() {
                return as("array", expr_list("]", !exigent_mode, true));
        };

        function object_() {
                var first = true, a = [];
                while (!is("punc", "}")) {
                        if (first) first = false; else expect(",");
                        if (!exigent_mode && is("punc", "}"))
                                // allow trailing comma
                                break;
                        var type = S.token.type;
                        var name = as_property_name();
                        if (type == "name" && (name == "get" || name == "set") && !is("punc", ":")) {
                                a.push([ as_name(), function_(false), name ]);
                        } else {
                                expect(":");
                                a.push([ name, expression(false) ]);
                        }
                }
                next();
                return as("object", a);
        };

        function as_property_name() {
                switch (S.token.type) {
                    case "num":
                    case "string":
                        return prog1(S.token.value, next);
                }
                return as_name();
        };

        function as_name() {
                switch (S.token.type) {
                    case "name":
                    case "operator":
                    case "keyword":
                    case "atom":
                        return prog1(S.token.value, next);
                    default:
                        unexpected();
                }
        };

        function subscripts(expr, allow_calls) {
                if (is("punc", ".")) {
                        next();
                        return subscripts(as("dot", expr, as_name()), allow_calls);
                }
                if (is("punc", "[")) {
                        next();
                        return subscripts(as("sub", expr, prog1(expression, curry(expect, "]"))), allow_calls);
                }
                if (allow_calls && is("punc", "(")) {
                        next();
                        return subscripts(as("call", expr, expr_list(")")), true);
                }
                return expr;
        };

        function maybe_unary(allow_calls) {
                if (is("operator") && HOP(UNARY_PREFIX, S.token.value)) {
                        return make_unary("unary-prefix",
                                          prog1(S.token.value, next),
                                          maybe_unary(allow_calls));
                }
                var val = expr_atom(allow_calls);
                while (is("operator") && HOP(UNARY_POSTFIX, S.token.value) && !S.token.nlb) {
                        val = make_unary("unary-postfix", S.token.value, val);
                        next();
                }
                return val;
        };

        function make_unary(tag, op, expr) {
                if ((op == "++" || op == "--") && !is_assignable(expr))
                        croak("Invalid use of " + op + " operator");
                return as(tag, op, expr);
        };

        function expr_op(left, min_prec, no_in) {
                var op = is("operator") ? S.token.value : null;
                if (op && op == "in" && no_in) op = null;
                var prec = op != null ? PRECEDENCE[op] : null;
                if (prec != null && prec > min_prec) {
                        next();
                        var right = expr_op(maybe_unary(true), prec, no_in);
                        return expr_op(as("binary", op, left, right), min_prec, no_in);
                }
                return left;
        };

        function expr_ops(no_in) {
                return expr_op(maybe_unary(true), 0, no_in);
        };

        function maybe_conditional(no_in) {
                var expr = expr_ops(no_in);
                if (is("operator", "?")) {
                        next();
                        var yes = expression(false);
                        expect(":");
                        return as("conditional", expr, yes, expression(false, no_in));
                }
                return expr;
        };

        function is_assignable(expr) {
                if (!exigent_mode) return true;
                switch (expr[0]+"") {
                    case "dot":
                    case "sub":
                    case "new":
                    case "call":
                        return true;
                    case "name":
                        return expr[1] != "this";
                }
        };

        function maybe_assign(no_in) {
                var left = maybe_conditional(no_in), val = S.token.value;
                if (is("operator") && HOP(ASSIGNMENT, val)) {
                        if (is_assignable(left)) {
                                next();
                                return as("assign", ASSIGNMENT[val], left, maybe_assign(no_in));
                        }
                        croak("Invalid assignment");
                }
                return left;
        };

        var expression = maybe_embed_tokens(function(commas, no_in) {
                if (arguments.length == 0)
                        commas = true;
                var expr = maybe_assign(no_in);
                if (commas && is("punc", ",")) {
                        next();
                        return as("seq", expr, expression(true, no_in));
                }
                return expr;
        });

        function in_loop(cont) {
                try {
                        ++S.in_loop;
                        return cont();
                } finally {
                        --S.in_loop;
                }
        };

        return as("toplevel", (function(a){
                while (!is("eof"))
                        a.push(statement());
                return a;
        })([]));

};

/* -----[ Utilities ]----- */

function curry(f) {
        var args = slice(arguments, 1);
        return function() { return f.apply(this, args.concat(slice(arguments))); };
};

function prog1(ret) {
        if (ret instanceof Function)
                ret = ret();
        for (var i = 1, n = arguments.length; --n > 0; ++i)
                arguments[i]();
        return ret;
};

function array_to_hash(a) {
        var ret = {};
        for (var i = 0; i < a.length; ++i)
                ret[a[i]] = true;
        return ret;
};

function slice(a, start) {
        return Array.prototype.slice.call(a, start || 0);
};

function characters(str) {
        return str.split("");
};

function member(name, array) {
        for (var i = array.length; --i >= 0;)
                if (array[i] == name)
                        return true;
        return false;
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

var warn = function() {};

/* -----[ Exports ]----- */

exports.tokenizer = tokenizer;
exports.parse = parse;
exports.slice = slice;
exports.curry = curry;
exports.member = member;
exports.array_to_hash = array_to_hash;
exports.PRECEDENCE = PRECEDENCE;
exports.KEYWORDS_ATOM = KEYWORDS_ATOM;
exports.RESERVED_WORDS = RESERVED_WORDS;
exports.KEYWORDS = KEYWORDS;
exports.ATOMIC_START_TOKEN = ATOMIC_START_TOKEN;
exports.OPERATORS = OPERATORS;
exports.is_alphanumeric_char = is_alphanumeric_char;
exports.is_identifier_start = is_identifier_start;
exports.is_identifier_char = is_identifier_char;
exports.set_logger = function(logger) {
        warn = logger;
};
});

require.define("/node_modules/derby/node_modules/racer/node_modules/uglify-js/lib/process.js",function(require,module,exports,__dirname,__filename,process){/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.

  This version is suitable for Node.js.  With minimal changes (the
  exports stuff) it should work on any JS platform.

  This file implements some AST processors.  They work on data built
  by parse-js.

  Exported functions:

    - ast_mangle(ast, options) -- mangles the variable/function names
      in the AST.  Returns an AST.

    - ast_squeeze(ast) -- employs various optimizations to make the
      final generated code even smaller.  Returns an AST.

    - gen_code(ast, options) -- generates JS code from the AST.  Pass
      true (or an object, see the code for some options) as second
      argument to get "pretty" (indented) code.

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

var jsp = require("./parse-js"),
    slice = jsp.slice,
    member = jsp.member,
    is_identifier_char = jsp.is_identifier_char,
    PRECEDENCE = jsp.PRECEDENCE,
    OPERATORS = jsp.OPERATORS;

/* -----[ helper for AST traversal ]----- */

function ast_walker() {
        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(def){
                        var a = [ def[0] ];
                        if (def.length > 1)
                                a[1] = walk(def[1]);
                        return a;
                }) ];
        };
        function _block(statements) {
                var out = [ this[0] ];
                if (statements != null)
                        out.push(MAP(statements, walk));
                return out;
        };
        var walkers = {
                "string": function(str) {
                        return [ this[0], str ];
                },
                "num": function(num) {
                        return [ this[0], num ];
                },
                "name": function(name) {
                        return [ this[0], name ];
                },
                "toplevel": function(statements) {
                        return [ this[0], MAP(statements, walk) ];
                },
                "block": _block,
                "splice": _block,
                "var": _vardefs,
                "const": _vardefs,
                "try": function(t, c, f) {
                        return [
                                this[0],
                                MAP(t, walk),
                                c != null ? [ c[0], MAP(c[1], walk) ] : null,
                                f != null ? MAP(f, walk) : null
                        ];
                },
                "throw": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "new": function(ctor, args) {
                        return [ this[0], walk(ctor), MAP(args, walk) ];
                },
                "switch": function(expr, body) {
                        return [ this[0], walk(expr), MAP(body, function(branch){
                                return [ branch[0] ? walk(branch[0]) : null,
                                         MAP(branch[1], walk) ];
                        }) ];
                },
                "break": function(label) {
                        return [ this[0], label ];
                },
                "continue": function(label) {
                        return [ this[0], label ];
                },
                "conditional": function(cond, t, e) {
                        return [ this[0], walk(cond), walk(t), walk(e) ];
                },
                "assign": function(op, lvalue, rvalue) {
                        return [ this[0], op, walk(lvalue), walk(rvalue) ];
                },
                "dot": function(expr) {
                        return [ this[0], walk(expr) ].concat(slice(arguments, 1));
                },
                "call": function(expr, args) {
                        return [ this[0], walk(expr), MAP(args, walk) ];
                },
                "function": function(name, args, body) {
                        return [ this[0], name, args.slice(), MAP(body, walk) ];
                },
                "debugger": function() {
                        return [ this[0] ];
                },
                "defun": function(name, args, body) {
                        return [ this[0], name, args.slice(), MAP(body, walk) ];
                },
                "if": function(conditional, t, e) {
                        return [ this[0], walk(conditional), walk(t), walk(e) ];
                },
                "for": function(init, cond, step, block) {
                        return [ this[0], walk(init), walk(cond), walk(step), walk(block) ];
                },
                "for-in": function(vvar, key, hash, block) {
                        return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];
                },
                "while": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "do": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "return": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "binary": function(op, left, right) {
                        return [ this[0], op, walk(left), walk(right) ];
                },
                "unary-prefix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "unary-postfix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "sub": function(expr, subscript) {
                        return [ this[0], walk(expr), walk(subscript) ];
                },
                "object": function(props) {
                        return [ this[0], MAP(props, function(p){
                                return p.length == 2
                                        ? [ p[0], walk(p[1]) ]
                                        : [ p[0], walk(p[1]), p[2] ]; // get/set-ter
                        }) ];
                },
                "regexp": function(rx, mods) {
                        return [ this[0], rx, mods ];
                },
                "array": function(elements) {
                        return [ this[0], MAP(elements, walk) ];
                },
                "stat": function(stat) {
                        return [ this[0], walk(stat) ];
                },
                "seq": function() {
                        return [ this[0] ].concat(MAP(slice(arguments), walk));
                },
                "label": function(name, block) {
                        return [ this[0], name, walk(block) ];
                },
                "with": function(expr, block) {
                        return [ this[0], walk(expr), walk(block) ];
                },
                "atom": function(name) {
                        return [ this[0], name ];
                },
                "directive": function(dir) {
                        return [ this[0], dir ];
                }
        };

        var user = {};
        var stack = [];
        function walk(ast) {
                if (ast == null)
                        return null;
                try {
                        stack.push(ast);
                        var type = ast[0];
                        var gen = user[type];
                        if (gen) {
                                var ret = gen.apply(ast, ast.slice(1));
                                if (ret != null)
                                        return ret;
                        }
                        gen = walkers[type];
                        return gen.apply(ast, ast.slice(1));
                } finally {
                        stack.pop();
                }
        };

        function dive(ast) {
                if (ast == null)
                        return null;
                try {
                        stack.push(ast);
                        return walkers[ast[0]].apply(ast, ast.slice(1));
                } finally {
                        stack.pop();
                }
        };

        function with_walkers(walkers, cont){
                var save = {}, i;
                for (i in walkers) if (HOP(walkers, i)) {
                        save[i] = user[i];
                        user[i] = walkers[i];
                }
                var ret = cont();
                for (i in save) if (HOP(save, i)) {
                        if (!save[i]) delete user[i];
                        else user[i] = save[i];
                }
                return ret;
        };

        return {
                walk: walk,
                dive: dive,
                with_walkers: with_walkers,
                parent: function() {
                        return stack[stack.length - 2]; // last one is current node
                },
                stack: function() {
                        return stack;
                }
        };
};

/* -----[ Scope and mangling ]----- */

function Scope(parent) {
        this.names = {};        // names defined in this scope
        this.mangled = {};      // mangled names (orig.name => mangled)
        this.rev_mangled = {};  // reverse lookup (mangled => orig.name)
        this.cname = -1;        // current mangled name
        this.refs = {};         // names referenced from this scope
        this.uses_with = false; // will become TRUE if with() is detected in this or any subscopes
        this.uses_eval = false; // will become TRUE if eval() is detected in this or any subscopes
        this.directives = [];   // directives activated from this scope
        this.parent = parent;   // parent scope
        this.children = [];     // sub-scopes
        if (parent) {
                this.level = parent.level + 1;
                parent.children.push(this);
        } else {
                this.level = 0;
        }
};

function base54_digits() {
        if (typeof DIGITS_OVERRIDE_FOR_TESTING != "undefined")
                return DIGITS_OVERRIDE_FOR_TESTING;
        else
                return "etnrisouaflchpdvmgybwESxTNCkLAOM_DPHBjFIqRUzWXV$JKQGYZ0516372984";
}

var base54 = (function(){
        var DIGITS = base54_digits();
        return function(num) {
                var ret = "", base = 54;
                do {
                        ret += DIGITS.charAt(num % base);
                        num = Math.floor(num / base);
                        base = 64;
                } while (num > 0);
                return ret;
        };
})();

Scope.prototype = {
        has: function(name) {
                for (var s = this; s; s = s.parent)
                        if (HOP(s.names, name))
                                return s;
        },
        has_mangled: function(mname) {
                for (var s = this; s; s = s.parent)
                        if (HOP(s.rev_mangled, mname))
                                return s;
        },
        toJSON: function() {
                return {
                        names: this.names,
                        uses_eval: this.uses_eval,
                        uses_with: this.uses_with
                };
        },

        next_mangled: function() {
                // we must be careful that the new mangled name:
                //
                // 1. doesn't shadow a mangled name from a parent
                //    scope, unless we don't reference the original
                //    name from this scope OR from any sub-scopes!
                //    This will get slow.
                //
                // 2. doesn't shadow an original name from a parent
                //    scope, in the event that the name is not mangled
                //    in the parent scope and we reference that name
                //    here OR IN ANY SUBSCOPES!
                //
                // 3. doesn't shadow a name that is referenced but not
                //    defined (possibly global defined elsewhere).
                for (;;) {
                        var m = base54(++this.cname), prior;

                        // case 1.
                        prior = this.has_mangled(m);
                        if (prior && this.refs[prior.rev_mangled[m]] === prior)
                                continue;

                        // case 2.
                        prior = this.has(m);
                        if (prior && prior !== this && this.refs[m] === prior && !prior.has_mangled(m))
                                continue;

                        // case 3.
                        if (HOP(this.refs, m) && this.refs[m] == null)
                                continue;

                        // I got "do" once. :-/
                        if (!is_identifier(m))
                                continue;

                        return m;
                }
        },
        set_mangle: function(name, m) {
                this.rev_mangled[m] = name;
                return this.mangled[name] = m;
        },
        get_mangled: function(name, newMangle) {
                if (this.uses_eval || this.uses_with) return name; // no mangle if eval or with is in use
                var s = this.has(name);
                if (!s) return name; // not in visible scope, no mangle
                if (HOP(s.mangled, name)) return s.mangled[name]; // already mangled in this scope
                if (!newMangle) return name;                      // not found and no mangling requested
                return s.set_mangle(name, s.next_mangled());
        },
        references: function(name) {
                return name && !this.parent || this.uses_with || this.uses_eval || this.refs[name];
        },
        define: function(name, type) {
                if (name != null) {
                        if (type == "var" || !HOP(this.names, name))
                                this.names[name] = type || "var";
                        return name;
                }
        },
        active: function(dir) {
                return member(dir, this.directives) || this.parent && this.parent.active(dir);
        }
};

function ast_add_scope(ast) {

        var current_scope = null;
        var w = ast_walker(), walk = w.walk;
        var having_eval = [];

        function with_new_scope(cont) {
                current_scope = new Scope(current_scope);
                current_scope.labels = new Scope();
                var ret = current_scope.body = cont();
                ret.scope = current_scope;
                current_scope = current_scope.parent;
                return ret;
        };

        function define(name, type) {
                return current_scope.define(name, type);
        };

        function reference(name) {
                current_scope.refs[name] = true;
        };

        function _lambda(name, args, body) {
                var is_defun = this[0] == "defun";
                return [ this[0], is_defun ? define(name, "defun") : name, args, with_new_scope(function(){
                        if (!is_defun) define(name, "lambda");
                        MAP(args, function(name){ define(name, "arg") });
                        return MAP(body, walk);
                })];
        };

        function _vardefs(type) {
                return function(defs) {
                        MAP(defs, function(d){
                                define(d[0], type);
                                if (d[1]) reference(d[0]);
                        });
                };
        };

        function _breacont(label) {
                if (label)
                        current_scope.labels.refs[label] = true;
        };

        return with_new_scope(function(){
                // process AST
                var ret = w.with_walkers({
                        "function": _lambda,
                        "defun": _lambda,
                        "label": function(name, stat) { current_scope.labels.define(name) },
                        "break": _breacont,
                        "continue": _breacont,
                        "with": function(expr, block) {
                                for (var s = current_scope; s; s = s.parent)
                                        s.uses_with = true;
                        },
                        "var": _vardefs("var"),
                        "const": _vardefs("const"),
                        "try": function(t, c, f) {
                                if (c != null) return [
                                        this[0],
                                        MAP(t, walk),
                                        [ define(c[0], "catch"), MAP(c[1], walk) ],
                                        f != null ? MAP(f, walk) : null
                                ];
                        },
                        "name": function(name) {
                                if (name == "eval")
                                        having_eval.push(current_scope);
                                reference(name);
                        }
                }, function(){
                        return walk(ast);
                });

                // the reason why we need an additional pass here is
                // that names can be used prior to their definition.

                // scopes where eval was detected and their parents
                // are marked with uses_eval, unless they define the
                // "eval" name.
                MAP(having_eval, function(scope){
                        if (!scope.has("eval")) while (scope) {
                                scope.uses_eval = true;
                                scope = scope.parent;
                        }
                });

                // for referenced names it might be useful to know
                // their origin scope.  current_scope here is the
                // toplevel one.
                function fixrefs(scope, i) {
                        // do children first; order shouldn't matter
                        for (i = scope.children.length; --i >= 0;)
                                fixrefs(scope.children[i]);
                        for (i in scope.refs) if (HOP(scope.refs, i)) {
                                // find origin scope and propagate the reference to origin
                                for (var origin = scope.has(i), s = scope; s; s = s.parent) {
                                        s.refs[i] = origin;
                                        if (s === origin) break;
                                }
                        }
                };
                fixrefs(current_scope);

                return ret;
        });

};

/* -----[ mangle names ]----- */

function ast_mangle(ast, options) {
        var w = ast_walker(), walk = w.walk, scope;
        options = defaults(options, {
                mangle       : true,
                toplevel     : false,
                defines      : null,
                except       : null,
                no_functions : false
        });

        function get_mangled(name, newMangle) {
                if (!options.mangle) return name;
                if (!options.toplevel && !scope.parent) return name; // don't mangle toplevel
                if (options.except && member(name, options.except))
                        return name;
                if (options.no_functions && HOP(scope.names, name) &&
                    (scope.names[name] == 'defun' || scope.names[name] == 'lambda'))
                        return name;
                return scope.get_mangled(name, newMangle);
        };

        function get_define(name) {
                if (options.defines) {
                        // we always lookup a defined symbol for the current scope FIRST, so declared
                        // vars trump a DEFINE symbol, but if no such var is found, then match a DEFINE value
                        if (!scope.has(name)) {
                                if (HOP(options.defines, name)) {
                                        return options.defines[name];
                                }
                        }
                        return null;
                }
        };

        function _lambda(name, args, body) {
                if (!options.no_functions && options.mangle) {
                        var is_defun = this[0] == "defun", extra;
                        if (name) {
                                if (is_defun) name = get_mangled(name);
                                else if (body.scope.references(name)) {
                                        extra = {};
                                        if (!(scope.uses_eval || scope.uses_with))
                                                name = extra[name] = scope.next_mangled();
                                        else
                                                extra[name] = name;
                                }
                                else name = null;
                        }
                }
                body = with_scope(body.scope, function(){
                        args = MAP(args, function(name){ return get_mangled(name) });
                        return MAP(body, walk);
                }, extra);
                return [ this[0], name, args, body ];
        };

        function with_scope(s, cont, extra) {
                var _scope = scope;
                scope = s;
                if (extra) for (var i in extra) if (HOP(extra, i)) {
                        s.set_mangle(i, extra[i]);
                }
                for (var i in s.names) if (HOP(s.names, i)) {
                        get_mangled(i, true);
                }
                var ret = cont();
                ret.scope = s;
                scope = _scope;
                return ret;
        };

        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(d){
                        return [ get_mangled(d[0]), walk(d[1]) ];
                }) ];
        };

        function _breacont(label) {
                if (label) return [ this[0], scope.labels.get_mangled(label) ];
        };

        return w.with_walkers({
                "function": _lambda,
                "defun": function() {
                        // move function declarations to the top when
                        // they are not in some block.
                        var ast = _lambda.apply(this, arguments);
                        switch (w.parent()[0]) {
                            case "toplevel":
                            case "function":
                            case "defun":
                                return MAP.at_top(ast);
                        }
                        return ast;
                },
                "label": function(label, stat) {
                        if (scope.labels.refs[label]) return [
                                this[0],
                                scope.labels.get_mangled(label, true),
                                walk(stat)
                        ];
                        return walk(stat);
                },
                "break": _breacont,
                "continue": _breacont,
                "var": _vardefs,
                "const": _vardefs,
                "name": function(name) {
                        return get_define(name) || [ this[0], get_mangled(name) ];
                },
                "try": function(t, c, f) {
                        return [ this[0],
                                 MAP(t, walk),
                                 c != null ? [ get_mangled(c[0]), MAP(c[1], walk) ] : null,
                                 f != null ? MAP(f, walk) : null ];
                },
                "toplevel": function(body) {
                        var self = this;
                        return with_scope(self.scope, function(){
                                return [ self[0], MAP(body, walk) ];
                        });
                },
                "directive": function() {
                        return MAP.at_top(this);
                }
        }, function() {
                return walk(ast_add_scope(ast));
        });
};

/* -----[
   - compress foo["bar"] into foo.bar,
   - remove block brackets {} where possible
   - join consecutive var declarations
   - various optimizations for IFs:
     - if (cond) foo(); else bar();  ==>  cond?foo():bar();
     - if (cond) foo();  ==>  cond&&foo();
     - if (foo) return bar(); else return baz();  ==> return foo?bar():baz(); // also for throw
     - if (foo) return bar(); else something();  ==> {if(foo)return bar();something()}
   ]----- */

var warn = function(){};

function best_of(ast1, ast2) {
        return gen_code(ast1).length > gen_code(ast2[0] == "stat" ? ast2[1] : ast2).length ? ast2 : ast1;
};

function last_stat(b) {
        if (b[0] == "block" && b[1] && b[1].length > 0)
                return b[1][b[1].length - 1];
        return b;
}

function aborts(t) {
        if (t) switch (last_stat(t)[0]) {
            case "return":
            case "break":
            case "continue":
            case "throw":
                return true;
        }
};

function boolean_expr(expr) {
        return ( (expr[0] == "unary-prefix"
                  && member(expr[1], [ "!", "delete" ])) ||

                 (expr[0] == "binary"
                  && member(expr[1], [ "in", "instanceof", "==", "!=", "===", "!==", "<", "<=", ">=", ">" ])) ||

                 (expr[0] == "binary"
                  && member(expr[1], [ "&&", "||" ])
                  && boolean_expr(expr[2])
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "conditional"
                  && boolean_expr(expr[2])
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "assign"
                  && expr[1] === true
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "seq"
                  && boolean_expr(expr[expr.length - 1]))
               );
};

function empty(b) {
        return !b || (b[0] == "block" && (!b[1] || b[1].length == 0));
};

function is_string(node) {
        return (node[0] == "string" ||
                node[0] == "unary-prefix" && node[1] == "typeof" ||
                node[0] == "binary" && node[1] == "+" &&
                (is_string(node[2]) || is_string(node[3])));
};

var when_constant = (function(){

        var $NOT_CONSTANT = {};

        // this can only evaluate constant expressions.  If it finds anything
        // not constant, it throws $NOT_CONSTANT.
        function evaluate(expr) {
                switch (expr[0]) {
                    case "string":
                    case "num":
                        return expr[1];
                    case "name":
                    case "atom":
                        switch (expr[1]) {
                            case "true": return true;
                            case "false": return false;
                            case "null": return null;
                        }
                        break;
                    case "unary-prefix":
                        switch (expr[1]) {
                            case "!": return !evaluate(expr[2]);
                            case "typeof": return typeof evaluate(expr[2]);
                            case "~": return ~evaluate(expr[2]);
                            case "-": return -evaluate(expr[2]);
                            case "+": return +evaluate(expr[2]);
                        }
                        break;
                    case "binary":
                        var left = expr[2], right = expr[3];
                        switch (expr[1]) {
                            case "&&"         : return evaluate(left) &&         evaluate(right);
                            case "||"         : return evaluate(left) ||         evaluate(right);
                            case "|"          : return evaluate(left) |          evaluate(right);
                            case "&"          : return evaluate(left) &          evaluate(right);
                            case "^"          : return evaluate(left) ^          evaluate(right);
                            case "+"          : return evaluate(left) +          evaluate(right);
                            case "*"          : return evaluate(left) *          evaluate(right);
                            case "/"          : return evaluate(left) /          evaluate(right);
                            case "%"          : return evaluate(left) %          evaluate(right);
                            case "-"          : return evaluate(left) -          evaluate(right);
                            case "<<"         : return evaluate(left) <<         evaluate(right);
                            case ">>"         : return evaluate(left) >>         evaluate(right);
                            case ">>>"        : return evaluate(left) >>>        evaluate(right);
                            case "=="         : return evaluate(left) ==         evaluate(right);
                            case "==="        : return evaluate(left) ===        evaluate(right);
                            case "!="         : return evaluate(left) !=         evaluate(right);
                            case "!=="        : return evaluate(left) !==        evaluate(right);
                            case "<"          : return evaluate(left) <          evaluate(right);
                            case "<="         : return evaluate(left) <=         evaluate(right);
                            case ">"          : return evaluate(left) >          evaluate(right);
                            case ">="         : return evaluate(left) >=         evaluate(right);
                            case "in"         : return evaluate(left) in         evaluate(right);
                            case "instanceof" : return evaluate(left) instanceof evaluate(right);
                        }
                }
                throw $NOT_CONSTANT;
        };

        return function(expr, yes, no) {
                try {
                        var val = evaluate(expr), ast;
                        switch (typeof val) {
                            case "string": ast =  [ "string", val ]; break;
                            case "number": ast =  [ "num", val ]; break;
                            case "boolean": ast =  [ "name", String(val) ]; break;
                            default:
                                if (val === null) { ast = [ "atom", "null" ]; break; }
                                throw new Error("Can't handle constant of type: " + (typeof val));
                        }
                        return yes.call(expr, ast, val);
                } catch(ex) {
                        if (ex === $NOT_CONSTANT) {
                                if (expr[0] == "binary"
                                    && (expr[1] == "===" || expr[1] == "!==")
                                    && ((is_string(expr[2]) && is_string(expr[3]))
                                        || (boolean_expr(expr[2]) && boolean_expr(expr[3])))) {
                                        expr[1] = expr[1].substr(0, 2);
                                }
                                else if (no && expr[0] == "binary"
                                         && (expr[1] == "||" || expr[1] == "&&")) {
                                    // the whole expression is not constant but the lval may be...
                                    try {
                                        var lval = evaluate(expr[2]);
                                        expr = ((expr[1] == "&&" && (lval ? expr[3] : lval))    ||
                                                (expr[1] == "||" && (lval ? lval    : expr[3])) ||
                                                expr);
                                    } catch(ex2) {
                                        // IGNORE... lval is not constant
                                    }
                                }
                                return no ? no.call(expr, expr) : null;
                        }
                        else throw ex;
                }
        };

})();

function warn_unreachable(ast) {
        if (!empty(ast))
                warn("Dropping unreachable code: " + gen_code(ast, true));
};

function prepare_ifs(ast) {
        var w = ast_walker(), walk = w.walk;
        // In this first pass, we rewrite ifs which abort with no else with an
        // if-else.  For example:
        //
        // if (x) {
        //     blah();
        //     return y;
        // }
        // foobar();
        //
        // is rewritten into:
        //
        // if (x) {
        //     blah();
        //     return y;
        // } else {
        //     foobar();
        // }
        function redo_if(statements) {
                statements = MAP(statements, walk);

                for (var i = 0; i < statements.length; ++i) {
                        var fi = statements[i];
                        if (fi[0] != "if") continue;

                        if (fi[3] && walk(fi[3])) continue;

                        var t = walk(fi[2]);
                        if (!aborts(t)) continue;

                        var conditional = walk(fi[1]);

                        var e_body = redo_if(statements.slice(i + 1));
                        var e = e_body.length == 1 ? e_body[0] : [ "block", e_body ];

                        return statements.slice(0, i).concat([ [
                                fi[0],          // "if"
                                conditional,    // conditional
                                t,              // then
                                e               // else
                        ] ]);
                }

                return statements;
        };

        function redo_if_lambda(name, args, body) {
                body = redo_if(body);
                return [ this[0], name, args, body ];
        };

        function redo_if_block(statements) {
                return [ this[0], statements != null ? redo_if(statements) : null ];
        };

        return w.with_walkers({
                "defun": redo_if_lambda,
                "function": redo_if_lambda,
                "block": redo_if_block,
                "splice": redo_if_block,
                "toplevel": function(statements) {
                        return [ this[0], redo_if(statements) ];
                },
                "try": function(t, c, f) {
                        return [
                                this[0],
                                redo_if(t),
                                c != null ? [ c[0], redo_if(c[1]) ] : null,
                                f != null ? redo_if(f) : null
                        ];
                }
        }, function() {
                return walk(ast);
        });
};

function for_side_effects(ast, handler) {
        var w = ast_walker(), walk = w.walk;
        var $stop = {}, $restart = {};
        function stop() { throw $stop };
        function restart() { throw $restart };
        function found(){ return handler.call(this, this, w, stop, restart) };
        function unary(op) {
                if (op == "++" || op == "--")
                        return found.apply(this, arguments);
        };
        return w.with_walkers({
                "try": found,
                "throw": found,
                "return": found,
                "new": found,
                "switch": found,
                "break": found,
                "continue": found,
                "assign": found,
                "call": found,
                "if": found,
                "for": found,
                "for-in": found,
                "while": found,
                "do": found,
                "return": found,
                "unary-prefix": unary,
                "unary-postfix": unary,
                "defun": found
        }, function(){
                while (true) try {
                        walk(ast);
                        break;
                } catch(ex) {
                        if (ex === $stop) break;
                        if (ex === $restart) continue;
                        throw ex;
                }
        });
};

function ast_lift_variables(ast) {
        var w = ast_walker(), walk = w.walk, scope;
        function do_body(body, env) {
                var _scope = scope;
                scope = env;
                body = MAP(body, walk);
                var hash = {}, names = MAP(env.names, function(type, name){
                        if (type != "var") return MAP.skip;
                        if (!env.references(name)) return MAP.skip;
                        hash[name] = true;
                        return [ name ];
                });
                if (names.length > 0) {
                        // looking for assignments to any of these variables.
                        // we can save considerable space by moving the definitions
                        // in the var declaration.
                        for_side_effects([ "block", body ], function(ast, walker, stop, restart) {
                                if (ast[0] == "assign"
                                    && ast[1] === true
                                    && ast[2][0] == "name"
                                    && HOP(hash, ast[2][1])) {
                                        // insert the definition into the var declaration
                                        for (var i = names.length; --i >= 0;) {
                                                if (names[i][0] == ast[2][1]) {
                                                        if (names[i][1]) // this name already defined, we must stop
                                                                stop();
                                                        names[i][1] = ast[3]; // definition
                                                        names.push(names.splice(i, 1)[0]);
                                                        break;
                                                }
                                        }
                                        // remove this assignment from the AST.
                                        var p = walker.parent();
                                        if (p[0] == "seq") {
                                                var a = p[2];
                                                a.unshift(0, p.length);
                                                p.splice.apply(p, a);
                                        }
                                        else if (p[0] == "stat") {
                                                p.splice(0, p.length, "block"); // empty statement
                                        }
                                        else {
                                                stop();
                                        }
                                        restart();
                                }
                                stop();
                        });
                        body.unshift([ "var", names ]);
                }
                scope = _scope;
                return body;
        };
        function _vardefs(defs) {
                var ret = null;
                for (var i = defs.length; --i >= 0;) {
                        var d = defs[i];
                        if (!d[1]) continue;
                        d = [ "assign", true, [ "name", d[0] ], d[1] ];
                        if (ret == null) ret = d;
                        else ret = [ "seq", d, ret ];
                }
                if (ret == null) {
                        if (w.parent()[0] == "for-in")
                                return [ "name", defs[0][0] ];
                        return MAP.skip;
                }
                return [ "stat", ret ];
        };
        function _toplevel(body) {
                return [ this[0], do_body(body, this.scope) ];
        };
        return w.with_walkers({
                "function": function(name, args, body){
                        for (var i = args.length; --i >= 0 && !body.scope.references(args[i]);)
                                args.pop();
                        if (!body.scope.references(name)) name = null;
                        return [ this[0], name, args, do_body(body, body.scope) ];
                },
                "defun": function(name, args, body){
                        if (!scope.references(name)) return MAP.skip;
                        for (var i = args.length; --i >= 0 && !body.scope.references(args[i]);)
                                args.pop();
                        return [ this[0], name, args, do_body(body, body.scope) ];
                },
                "var": _vardefs,
                "toplevel": _toplevel
        }, function(){
                return walk(ast_add_scope(ast));
        });
};

function ast_squeeze(ast, options) {
        options = defaults(options, {
                make_seqs   : true,
                dead_code   : true,
                no_warnings : false,
                keep_comps  : true,
                unsafe      : false
        });

        var w = ast_walker(), walk = w.walk, scope;

        function negate(c) {
                var not_c = [ "unary-prefix", "!", c ];
                switch (c[0]) {
                    case "unary-prefix":
                        return c[1] == "!" && boolean_expr(c[2]) ? c[2] : not_c;
                    case "seq":
                        c = slice(c);
                        c[c.length - 1] = negate(c[c.length - 1]);
                        return c;
                    case "conditional":
                        return best_of(not_c, [ "conditional", c[1], negate(c[2]), negate(c[3]) ]);
                    case "binary":
                        var op = c[1], left = c[2], right = c[3];
                        if (!options.keep_comps) switch (op) {
                            case "<="  : return [ "binary", ">", left, right ];
                            case "<"   : return [ "binary", ">=", left, right ];
                            case ">="  : return [ "binary", "<", left, right ];
                            case ">"   : return [ "binary", "<=", left, right ];
                        }
                        switch (op) {
                            case "=="  : return [ "binary", "!=", left, right ];
                            case "!="  : return [ "binary", "==", left, right ];
                            case "===" : return [ "binary", "!==", left, right ];
                            case "!==" : return [ "binary", "===", left, right ];
                            case "&&"  : return best_of(not_c, [ "binary", "||", negate(left), negate(right) ]);
                            case "||"  : return best_of(not_c, [ "binary", "&&", negate(left), negate(right) ]);
                        }
                        break;
                }
                return not_c;
        };

        function make_conditional(c, t, e) {
                var make_real_conditional = function() {
                        if (c[0] == "unary-prefix" && c[1] == "!") {
                                return e ? [ "conditional", c[2], e, t ] : [ "binary", "||", c[2], t ];
                        } else {
                                return e ? best_of(
                                        [ "conditional", c, t, e ],
                                        [ "conditional", negate(c), e, t ]
                                ) : [ "binary", "&&", c, t ];
                        }
                };
                // shortcut the conditional if the expression has a constant value
                return when_constant(c, function(ast, val){
                        warn_unreachable(val ? e : t);
                        return          (val ? t : e);
                }, make_real_conditional);
        };

        function rmblock(block) {
                if (block != null && block[0] == "block" && block[1]) {
                        if (block[1].length == 1)
                                block = block[1][0];
                        else if (block[1].length == 0)
                                block = [ "block" ];
                }
                return block;
        };

        function _lambda(name, args, body) {
                return [ this[0], name, args, with_scope(body.scope, function() {
                        return tighten(body, "lambda");
                }) ];
        };

        function with_scope(s, cont) {
                var _scope = scope;
                scope = s;
                var ret = cont();
                scope = _scope;
                return ret;
        };

        // this function does a few things:
        // 1. discard useless blocks
        // 2. join consecutive var declarations
        // 3. remove obviously dead code
        // 4. transform consecutive statements using the comma operator
        // 5. if block_type == "lambda" and it detects constructs like if(foo) return ... - rewrite like if (!foo) { ... }
        function tighten(statements, block_type) {
                statements = MAP(statements, walk);

                statements = statements.reduce(function(a, stat){
                        if (stat[0] == "block") {
                                if (stat[1]) {
                                        a.push.apply(a, stat[1]);
                                }
                        } else {
                                a.push(stat);
                        }
                        return a;
                }, []);

                statements = (function(a, prev){
                        statements.forEach(function(cur){
                                if (prev && ((cur[0] == "var" && prev[0] == "var") ||
                                             (cur[0] == "const" && prev[0] == "const"))) {
                                        prev[1] = prev[1].concat(cur[1]);
                                } else {
                                        a.push(cur);
                                        prev = cur;
                                }
                        });
                        return a;
                })([]);

                if (options.dead_code) statements = (function(a, has_quit){
                        statements.forEach(function(st){
                                if (has_quit) {
                                        if (st[0] == "function" || st[0] == "defun") {
                                                a.push(st);
                                        }
                                        else if (st[0] == "var" || st[0] == "const") {
                                                if (!options.no_warnings)
                                                        warn("Variables declared in unreachable code");
                                                st[1] = MAP(st[1], function(def){
                                                        if (def[1] && !options.no_warnings)
                                                                warn_unreachable([ "assign", true, [ "name", def[0] ], def[1] ]);
                                                        return [ def[0] ];
                                                });
                                                a.push(st);
                                        }
                                        else if (!options.no_warnings)
                                                warn_unreachable(st);
                                }
                                else {
                                        a.push(st);
                                        if (member(st[0], [ "return", "throw", "break", "continue" ]))
                                                has_quit = true;
                                }
                        });
                        return a;
                })([]);

                if (options.make_seqs) statements = (function(a, prev) {
                        statements.forEach(function(cur){
                                if (prev && prev[0] == "stat" && cur[0] == "stat") {
                                        prev[1] = [ "seq", prev[1], cur[1] ];
                                } else {
                                        a.push(cur);
                                        prev = cur;
                                }
                        });
                        if (a.length >= 2
                            && a[a.length-2][0] == "stat"
                            && (a[a.length-1][0] == "return" || a[a.length-1][0] == "throw")
                            && a[a.length-1][1])
                        {
                                a.splice(a.length - 2, 2,
                                         [ a[a.length-1][0],
                                           [ "seq", a[a.length-2][1], a[a.length-1][1] ]]);
                        }
                        return a;
                })([]);

                // this increases jQuery by 1K.  Probably not such a good idea after all..
                // part of this is done in prepare_ifs anyway.
                // if (block_type == "lambda") statements = (function(i, a, stat){
                //         while (i < statements.length) {
                //                 stat = statements[i++];
                //                 if (stat[0] == "if" && !stat[3]) {
                //                         if (stat[2][0] == "return" && stat[2][1] == null) {
                //                                 a.push(make_if(negate(stat[1]), [ "block", statements.slice(i) ]));
                //                                 break;
                //                         }
                //                         var last = last_stat(stat[2]);
                //                         if (last[0] == "return" && last[1] == null) {
                //                                 a.push(make_if(stat[1], [ "block", stat[2][1].slice(0, -1) ], [ "block", statements.slice(i) ]));
                //                                 break;
                //                         }
                //                 }
                //                 a.push(stat);
                //         }
                //         return a;
                // })(0, []);

                return statements;
        };

        function make_if(c, t, e) {
                return when_constant(c, function(ast, val){
                        if (val) {
                                t = walk(t);
                                warn_unreachable(e);
                                return t || [ "block" ];
                        } else {
                                e = walk(e);
                                warn_unreachable(t);
                                return e || [ "block" ];
                        }
                }, function() {
                        return make_real_if(c, t, e);
                });
        };

        function abort_else(c, t, e) {
                var ret = [ [ "if", negate(c), e ] ];
                if (t[0] == "block") {
                        if (t[1]) ret = ret.concat(t[1]);
                } else {
                        ret.push(t);
                }
                return walk([ "block", ret ]);
        };

        function make_real_if(c, t, e) {
                c = walk(c);
                t = walk(t);
                e = walk(e);

                if (empty(e) && empty(t))
                        return [ "stat", c ];

                if (empty(t)) {
                        c = negate(c);
                        t = e;
                        e = null;
                } else if (empty(e)) {
                        e = null;
                } else {
                        // if we have both else and then, maybe it makes sense to switch them?
                        (function(){
                                var a = gen_code(c);
                                var n = negate(c);
                                var b = gen_code(n);
                                if (b.length < a.length) {
                                        var tmp = t;
                                        t = e;
                                        e = tmp;
                                        c = n;
                                }
                        })();
                }
                var ret = [ "if", c, t, e ];
                if (t[0] == "if" && empty(t[3]) && empty(e)) {
                        ret = best_of(ret, walk([ "if", [ "binary", "&&", c, t[1] ], t[2] ]));
                }
                else if (t[0] == "stat") {
                        if (e) {
                                if (e[0] == "stat")
                                        ret = best_of(ret, [ "stat", make_conditional(c, t[1], e[1]) ]);
                                else if (aborts(e))
                                        ret = abort_else(c, t, e);
                        }
                        else {
                                ret = best_of(ret, [ "stat", make_conditional(c, t[1]) ]);
                        }
                }
                else if (e && t[0] == e[0] && (t[0] == "return" || t[0] == "throw") && t[1] && e[1]) {
                        ret = best_of(ret, [ t[0], make_conditional(c, t[1], e[1] ) ]);
                }
                else if (e && aborts(t)) {
                        ret = [ [ "if", c, t ] ];
                        if (e[0] == "block") {
                                if (e[1]) ret = ret.concat(e[1]);
                        }
                        else {
                                ret.push(e);
                        }
                        ret = walk([ "block", ret ]);
                }
                else if (t && aborts(e)) {
                        ret = abort_else(c, t, e);
                }
                return ret;
        };

        function _do_while(cond, body) {
                return when_constant(cond, function(cond, val){
                        if (!val) {
                                warn_unreachable(body);
                                return [ "block" ];
                        } else {
                                return [ "for", null, null, null, walk(body) ];
                        }
                });
        };

        return w.with_walkers({
                "sub": function(expr, subscript) {
                        if (subscript[0] == "string") {
                                var name = subscript[1];
                                if (is_identifier(name))
                                        return [ "dot", walk(expr), name ];
                                else if (/^[1-9][0-9]*$/.test(name) || name === "0")
                                        return [ "sub", walk(expr), [ "num", parseInt(name, 10) ] ];
                        }
                },
                "if": make_if,
                "toplevel": function(body) {
                        return with_scope(this.scope, function() {
                            return [ "toplevel", tighten(body) ];
                        });
                },
                "switch": function(expr, body) {
                        var last = body.length - 1;
                        return [ "switch", walk(expr), MAP(body, function(branch, i){
                                var block = tighten(branch[1]);
                                if (i == last && block.length > 0) {
                                        var node = block[block.length - 1];
                                        if (node[0] == "break" && !node[1])
                                                block.pop();
                                }
                                return [ branch[0] ? walk(branch[0]) : null, block ];
                        }) ];
                },
                "function": _lambda,
                "defun": _lambda,
                "block": function(body) {
                        if (body) return rmblock([ "block", tighten(body) ]);
                },
                "binary": function(op, left, right) {
                        return when_constant([ "binary", op, walk(left), walk(right) ], function yes(c){
                                return best_of(walk(c), this);
                        }, function no() {
                                return function(){
                                        if(op != "==" && op != "!=") return;
                                        var l = walk(left), r = walk(right);
                                        if(l && l[0] == "unary-prefix" && l[1] == "!" && l[2][0] == "num")
                                                left = ['num', +!l[2][1]];
                                        else if (r && r[0] == "unary-prefix" && r[1] == "!" && r[2][0] == "num")
                                                right = ['num', +!r[2][1]];
                                        return ["binary", op, left, right];
                                }() || this;
                        });
                },
                "conditional": function(c, t, e) {
                        return make_conditional(walk(c), walk(t), walk(e));
                },
                "try": function(t, c, f) {
                        return [
                                "try",
                                tighten(t),
                                c != null ? [ c[0], tighten(c[1]) ] : null,
                                f != null ? tighten(f) : null
                        ];
                },
                "unary-prefix": function(op, expr) {
                        expr = walk(expr);
                        var ret = [ "unary-prefix", op, expr ];
                        if (op == "!")
                                ret = best_of(ret, negate(expr));
                        return when_constant(ret, function(ast, val){
                                return walk(ast); // it's either true or false, so minifies to !0 or !1
                        }, function() { return ret });
                },
                "name": function(name) {
                        switch (name) {
                            case "true": return [ "unary-prefix", "!", [ "num", 0 ]];
                            case "false": return [ "unary-prefix", "!", [ "num", 1 ]];
                        }
                },
                "while": _do_while,
                "assign": function(op, lvalue, rvalue) {
                        lvalue = walk(lvalue);
                        rvalue = walk(rvalue);
                        var okOps = [ '+', '-', '/', '*', '%', '>>', '<<', '>>>', '|', '^', '&' ];
                        if (op === true && lvalue[0] === "name" && rvalue[0] === "binary" &&
                            ~okOps.indexOf(rvalue[1]) && rvalue[2][0] === "name" &&
                            rvalue[2][1] === lvalue[1]) {
                                return [ this[0], rvalue[1], lvalue, rvalue[3] ]
                        }
                        return [ this[0], op, lvalue, rvalue ];
                },
                "directive": function(dir) {
                        if (scope.active(dir))
                            return [ "block" ];
                        scope.directives.push(dir);
                        return [ this[0], dir ];
                },
                "call": function(expr, args) {
                        expr = walk(expr);
                        if (options.unsafe && expr[0] == "dot" && expr[1][0] == "string" && expr[2] == "toString") {
                                return expr[1];
                        }
                        return [ this[0], expr,  MAP(args, walk) ];
                },
                "num": function (num) {
                        if (!isFinite(num))
                                return [ "binary", "/", num === 1 / 0
                                         ? [ "num", 1 ] : num === -1 / 0
                                         ? [ "unary-prefix", "-", [ "num", 1 ] ]
                                         : [ "num", 0 ], [ "num", 0 ] ];

                        return [ this[0], num ];
                }
        }, function() {
                for (var i = 0; i < 2; ++i) {
                        ast = prepare_ifs(ast);
                        ast = walk(ast_add_scope(ast));
                }
                return ast;
        });
};

/* -----[ re-generate code from the AST ]----- */

var DOT_CALL_NO_PARENS = jsp.array_to_hash([
        "name",
        "array",
        "object",
        "string",
        "dot",
        "sub",
        "call",
        "regexp",
        "defun"
]);

function make_string(str, ascii_only) {
        var dq = 0, sq = 0;
        str = str.replace(/[\\\b\f\n\r\t\x22\x27\u2028\u2029\0]/g, function(s){
                switch (s) {
                    case "\\": return "\\\\";
                    case "\b": return "\\b";
                    case "\f": return "\\f";
                    case "\n": return "\\n";
                    case "\r": return "\\r";
                    case "\u2028": return "\\u2028";
                    case "\u2029": return "\\u2029";
                    case '"': ++dq; return '"';
                    case "'": ++sq; return "'";
                    case "\0": return "\\0";
                }
                return s;
        });
        if (ascii_only) str = to_ascii(str);
        if (dq > sq) return "'" + str.replace(/\x27/g, "\\'") + "'";
        else return '"' + str.replace(/\x22/g, '\\"') + '"';
};

function to_ascii(str) {
        return str.replace(/[\u0080-\uffff]/g, function(ch) {
                var code = ch.charCodeAt(0).toString(16);
                while (code.length < 4) code = "0" + code;
                return "\\u" + code;
        });
};

var SPLICE_NEEDS_BRACKETS = jsp.array_to_hash([ "if", "while", "do", "for", "for-in", "with" ]);

function gen_code(ast, options) {
        options = defaults(options, {
                indent_start : 0,
                indent_level : 4,
                quote_keys   : false,
                space_colon  : false,
                beautify     : false,
                ascii_only   : false,
                inline_script: false
        });
        var beautify = !!options.beautify;
        var indentation = 0,
            newline = beautify ? "\n" : "",
            space = beautify ? " " : "";

        function encode_string(str) {
                var ret = make_string(str, options.ascii_only);
                if (options.inline_script)
                        ret = ret.replace(/<\x2fscript([>\/\t\n\f\r ])/gi, "<\\/script$1");
                return ret;
        };

        function make_name(name) {
                name = name.toString();
                if (options.ascii_only)
                        name = to_ascii(name);
                return name;
        };

        function indent(line) {
                if (line == null)
                        line = "";
                if (beautify)
                        line = repeat_string(" ", options.indent_start + indentation * options.indent_level) + line;
                return line;
        };

        function with_indent(cont, incr) {
                if (incr == null) incr = 1;
                indentation += incr;
                try { return cont.apply(null, slice(arguments, 1)); }
                finally { indentation -= incr; }
        };

        function last_char(str) {
                str = str.toString();
                return str.charAt(str.length - 1);
        };

        function first_char(str) {
                return str.toString().charAt(0);
        };

        function add_spaces(a) {
                if (beautify)
                        return a.join(" ");
                var b = [];
                for (var i = 0; i < a.length; ++i) {
                        var next = a[i + 1];
                        b.push(a[i]);
                        if (next &&
                            ((is_identifier_char(last_char(a[i])) && (is_identifier_char(first_char(next))
                                                                      || first_char(next) == "\\")) ||
                             (/[\+\-]$/.test(a[i].toString()) && /^[\+\-]/.test(next.toString())))) {
                                b.push(" ");
                        }
                }
                return b.join("");
        };

        function add_commas(a) {
                return a.join("," + space);
        };

        function parenthesize(expr) {
                var gen = make(expr);
                for (var i = 1; i < arguments.length; ++i) {
                        var el = arguments[i];
                        if ((el instanceof Function && el(expr)) || expr[0] == el)
                                return "(" + gen + ")";
                }
                return gen;
        };

        function best_of(a) {
                if (a.length == 1) {
                        return a[0];
                }
                if (a.length == 2) {
                        var b = a[1];
                        a = a[0];
                        return a.length <= b.length ? a : b;
                }
                return best_of([ a[0], best_of(a.slice(1)) ]);
        };

        function needs_parens(expr) {
                if (expr[0] == "function" || expr[0] == "object") {
                        // dot/call on a literal function requires the
                        // function literal itself to be parenthesized
                        // only if it's the first "thing" in a
                        // statement.  This means that the parent is
                        // "stat", but it could also be a "seq" and
                        // we're the first in this "seq" and the
                        // parent is "stat", and so on.  Messy stuff,
                        // but it worths the trouble.
                        var a = slice(w.stack()), self = a.pop(), p = a.pop();
                        while (p) {
                                if (p[0] == "stat") return true;
                                if (((p[0] == "seq" || p[0] == "call" || p[0] == "dot" || p[0] == "sub" || p[0] == "conditional") && p[1] === self) ||
                                    ((p[0] == "binary" || p[0] == "assign" || p[0] == "unary-postfix") && p[2] === self)) {
                                        self = p;
                                        p = a.pop();
                                } else {
                                        return false;
                                }
                        }
                }
                return !HOP(DOT_CALL_NO_PARENS, expr[0]);
        };

        function make_num(num) {
                var str = num.toString(10), a = [ str.replace(/^0\./, ".").replace('e+', 'e') ], m;
                if (Math.floor(num) === num) {
                        if (num >= 0) {
                                a.push("0x" + num.toString(16).toLowerCase(), // probably pointless
                                       "0" + num.toString(8)); // same.
                        } else {
                                a.push("-0x" + (-num).toString(16).toLowerCase(), // probably pointless
                                       "-0" + (-num).toString(8)); // same.
                        }
                        if ((m = /^(.*?)(0+)$/.exec(num))) {
                                a.push(m[1] + "e" + m[2].length);
                        }
                } else if ((m = /^0?\.(0+)(.*)$/.exec(num))) {
                        a.push(m[2] + "e-" + (m[1].length + m[2].length),
                               str.substr(str.indexOf(".")));
                }
                return best_of(a);
        };

        var w = ast_walker();
        var make = w.walk;
        return w.with_walkers({
                "string": encode_string,
                "num": make_num,
                "name": make_name,
                "debugger": function(){ return "debugger;" },
                "toplevel": function(statements) {
                        return make_block_statements(statements)
                                .join(newline + newline);
                },
                "splice": function(statements) {
                        var parent = w.parent();
                        if (HOP(SPLICE_NEEDS_BRACKETS, parent)) {
                                // we need block brackets in this case
                                return make_block.apply(this, arguments);
                        } else {
                                return MAP(make_block_statements(statements, true),
                                           function(line, i) {
                                                   // the first line is already indented
                                                   return i > 0 ? indent(line) : line;
                                           }).join(newline);
                        }
                },
                "block": make_block,
                "var": function(defs) {
                        return "var " + add_commas(MAP(defs, make_1vardef)) + ";";
                },
                "const": function(defs) {
                        return "const " + add_commas(MAP(defs, make_1vardef)) + ";";
                },
                "try": function(tr, ca, fi) {
                        var out = [ "try", make_block(tr) ];
                        if (ca) out.push("catch", "(" + ca[0] + ")", make_block(ca[1]));
                        if (fi) out.push("finally", make_block(fi));
                        return add_spaces(out);
                },
                "throw": function(expr) {
                        return add_spaces([ "throw", make(expr) ]) + ";";
                },
                "new": function(ctor, args) {
                        args = args.length > 0 ? "(" + add_commas(MAP(args, function(expr){
                                return parenthesize(expr, "seq");
                        })) + ")" : "";
                        return add_spaces([ "new", parenthesize(ctor, "seq", "binary", "conditional", "assign", function(expr){
                                var w = ast_walker(), has_call = {};
                                try {
                                        w.with_walkers({
                                                "call": function() { throw has_call },
                                                "function": function() { return this }
                                        }, function(){
                                                w.walk(expr);
                                        });
                                } catch(ex) {
                                        if (ex === has_call)
                                                return true;
                                        throw ex;
                                }
                        }) + args ]);
                },
                "switch": function(expr, body) {
                        return add_spaces([ "switch", "(" + make(expr) + ")", make_switch_block(body) ]);
                },
                "break": function(label) {
                        var out = "break";
                        if (label != null)
                                out += " " + make_name(label);
                        return out + ";";
                },
                "continue": function(label) {
                        var out = "continue";
                        if (label != null)
                                out += " " + make_name(label);
                        return out + ";";
                },
                "conditional": function(co, th, el) {
                        return add_spaces([ parenthesize(co, "assign", "seq", "conditional"), "?",
                                            parenthesize(th, "seq"), ":",
                                            parenthesize(el, "seq") ]);
                },
                "assign": function(op, lvalue, rvalue) {
                        if (op && op !== true) op += "=";
                        else op = "=";
                        return add_spaces([ make(lvalue), op, parenthesize(rvalue, "seq") ]);
                },
                "dot": function(expr) {
                        var out = make(expr), i = 1;
                        if (expr[0] == "num") {
                                if (!/[a-f.]/i.test(out))
                                        out += ".";
                        } else if (expr[0] != "function" && needs_parens(expr))
                                out = "(" + out + ")";
                        while (i < arguments.length)
                                out += "." + make_name(arguments[i++]);
                        return out;
                },
                "call": function(func, args) {
                        var f = make(func);
                        if (f.charAt(0) != "(" && needs_parens(func))
                                f = "(" + f + ")";
                        return f + "(" + add_commas(MAP(args, function(expr){
                                return parenthesize(expr, "seq");
                        })) + ")";
                },
                "function": make_function,
                "defun": make_function,
                "if": function(co, th, el) {
                        var out = [ "if", "(" + make(co) + ")", el ? make_then(th) : make(th) ];
                        if (el) {
                                out.push("else", make(el));
                        }
                        return add_spaces(out);
                },
                "for": function(init, cond, step, block) {
                        var out = [ "for" ];
                        init = (init != null ? make(init) : "").replace(/;*\s*$/, ";" + space);
                        cond = (cond != null ? make(cond) : "").replace(/;*\s*$/, ";" + space);
                        step = (step != null ? make(step) : "").replace(/;*\s*$/, "");
                        var args = init + cond + step;
                        if (args == "; ; ") args = ";;";
                        out.push("(" + args + ")", make(block));
                        return add_spaces(out);
                },
                "for-in": function(vvar, key, hash, block) {
                        return add_spaces([ "for", "(" +
                                            (vvar ? make(vvar).replace(/;+$/, "") : make(key)),
                                            "in",
                                            make(hash) + ")", make(block) ]);
                },
                "while": function(condition, block) {
                        return add_spaces([ "while", "(" + make(condition) + ")", make(block) ]);
                },
                "do": function(condition, block) {
                        return add_spaces([ "do", make(block), "while", "(" + make(condition) + ")" ]) + ";";
                },
                "return": function(expr) {
                        var out = [ "return" ];
                        if (expr != null) out.push(make(expr));
                        return add_spaces(out) + ";";
                },
                "binary": function(operator, lvalue, rvalue) {
                        var left = make(lvalue), right = make(rvalue);
                        // XXX: I'm pretty sure other cases will bite here.
                        //      we need to be smarter.
                        //      adding parens all the time is the safest bet.
                        if (member(lvalue[0], [ "assign", "conditional", "seq" ]) ||
                            lvalue[0] == "binary" && PRECEDENCE[operator] > PRECEDENCE[lvalue[1]] ||
                            lvalue[0] == "function" && needs_parens(this)) {
                                left = "(" + left + ")";
                        }
                        if (member(rvalue[0], [ "assign", "conditional", "seq" ]) ||
                            rvalue[0] == "binary" && PRECEDENCE[operator] >= PRECEDENCE[rvalue[1]] &&
                            !(rvalue[1] == operator && member(operator, [ "&&", "||", "*" ]))) {
                                right = "(" + right + ")";
                        }
                        else if (!beautify && options.inline_script && (operator == "<" || operator == "<<")
                                 && rvalue[0] == "regexp" && /^script/i.test(rvalue[1])) {
                                right = " " + right;
                        }
                        return add_spaces([ left, operator, right ]);
                },
                "unary-prefix": function(operator, expr) {
                        var val = make(expr);
                        if (!(expr[0] == "num" || (expr[0] == "unary-prefix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
                                val = "(" + val + ")";
                        return operator + (jsp.is_alphanumeric_char(operator.charAt(0)) ? " " : "") + val;
                },
                "unary-postfix": function(operator, expr) {
                        var val = make(expr);
                        if (!(expr[0] == "num" || (expr[0] == "unary-postfix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
                                val = "(" + val + ")";
                        return val + operator;
                },
                "sub": function(expr, subscript) {
                        var hash = make(expr);
                        if (needs_parens(expr))
                                hash = "(" + hash + ")";
                        return hash + "[" + make(subscript) + "]";
                },
                "object": function(props) {
                        var obj_needs_parens = needs_parens(this);
                        if (props.length == 0)
                                return obj_needs_parens ? "({})" : "{}";
                        var out = "{" + newline + with_indent(function(){
                                return MAP(props, function(p){
                                        if (p.length == 3) {
                                                // getter/setter.  The name is in p[0], the arg.list in p[1][2], the
                                                // body in p[1][3] and type ("get" / "set") in p[2].
                                                return indent(make_function(p[0], p[1][2], p[1][3], p[2], true));
                                        }
                                        var key = p[0], val = parenthesize(p[1], "seq");
                                        if (options.quote_keys) {
                                                key = encode_string(key);
                                        } else if ((typeof key == "number" || !beautify && +key + "" == key)
                                                   && parseFloat(key) >= 0) {
                                                key = make_num(+key);
                                        } else if (!is_identifier(key)) {
                                                key = encode_string(key);
                                        }
                                        return indent(add_spaces(beautify && options.space_colon
                                                                 ? [ key, ":", val ]
                                                                 : [ key + ":", val ]));
                                }).join("," + newline);
                        }) + newline + indent("}");
                        return obj_needs_parens ? "(" + out + ")" : out;
                },
                "regexp": function(rx, mods) {
                        if (options.ascii_only) rx = to_ascii(rx);
                        return "/" + rx + "/" + mods;
                },
                "array": function(elements) {
                        if (elements.length == 0) return "[]";
                        return add_spaces([ "[", add_commas(MAP(elements, function(el, i){
                                if (!beautify && el[0] == "atom" && el[1] == "undefined") return i === elements.length - 1 ? "," : "";
                                return parenthesize(el, "seq");
                        })), "]" ]);
                },
                "stat": function(stmt) {
                        return make(stmt).replace(/;*\s*$/, ";");
                },
                "seq": function() {
                        return add_commas(MAP(slice(arguments), make));
                },
                "label": function(name, block) {
                        return add_spaces([ make_name(name), ":", make(block) ]);
                },
                "with": function(expr, block) {
                        return add_spaces([ "with", "(" + make(expr) + ")", make(block) ]);
                },
                "atom": function(name) {
                        return make_name(name);
                },
                "directive": function(dir) {
                        return make_string(dir) + ";";
                }
        }, function(){ return make(ast) });

        // The squeezer replaces "block"-s that contain only a single
        // statement with the statement itself; technically, the AST
        // is correct, but this can create problems when we output an
        // IF having an ELSE clause where the THEN clause ends in an
        // IF *without* an ELSE block (then the outer ELSE would refer
        // to the inner IF).  This function checks for this case and
        // adds the block brackets if needed.
        function make_then(th) {
                if (th == null) return ";";
                if (th[0] == "do") {
                        // https://github.com/mishoo/UglifyJS/issues/#issue/57
                        // IE croaks with "syntax error" on code like this:
                        //     if (foo) do ... while(cond); else ...
                        // we need block brackets around do/while
                        return make_block([ th ]);
                }
                var b = th;
                while (true) {
                        var type = b[0];
                        if (type == "if") {
                                if (!b[3])
                                        // no else, we must add the block
                                        return make([ "block", [ th ]]);
                                b = b[3];
                        }
                        else if (type == "while" || type == "do") b = b[2];
                        else if (type == "for" || type == "for-in") b = b[4];
                        else break;
                }
                return make(th);
        };

        function make_function(name, args, body, keyword, no_parens) {
                var out = keyword || "function";
                if (name) {
                        out += " " + make_name(name);
                }
                out += "(" + add_commas(MAP(args, make_name)) + ")";
                out = add_spaces([ out, make_block(body) ]);
                return (!no_parens && needs_parens(this)) ? "(" + out + ")" : out;
        };

        function must_has_semicolon(node) {
                switch (node[0]) {
                    case "with":
                    case "while":
                        return empty(node[2]) || must_has_semicolon(node[2]);
                    case "for":
                    case "for-in":
                        return empty(node[4]) || must_has_semicolon(node[4]);
                    case "if":
                        if (empty(node[2]) && !node[3]) return true; // `if' with empty `then' and no `else'
                        if (node[3]) {
                                if (empty(node[3])) return true; // `else' present but empty
                                return must_has_semicolon(node[3]); // dive into the `else' branch
                        }
                        return must_has_semicolon(node[2]); // dive into the `then' branch
                    case "directive":
                        return true;
                }
        };

        function make_block_statements(statements, noindent) {
                for (var a = [], last = statements.length - 1, i = 0; i <= last; ++i) {
                        var stat = statements[i];
                        var code = make(stat);
                        if (code != ";") {
                                if (!beautify && i == last && !must_has_semicolon(stat)) {
                                        code = code.replace(/;+\s*$/, "");
                                }
                                a.push(code);
                        }
                }
                return noindent ? a : MAP(a, indent);
        };

        function make_switch_block(body) {
                var n = body.length;
                if (n == 0) return "{}";
                return "{" + newline + MAP(body, function(branch, i){
                        var has_body = branch[1].length > 0, code = with_indent(function(){
                                return indent(branch[0]
                                              ? add_spaces([ "case", make(branch[0]) + ":" ])
                                              : "default:");
                        }, 0.5) + (has_body ? newline + with_indent(function(){
                                return make_block_statements(branch[1]).join(newline);
                        }) : "");
                        if (!beautify && has_body && i < n - 1)
                                code += ";";
                        return code;
                }).join(newline) + newline + indent("}");
        };

        function make_block(statements) {
                if (!statements) return ";";
                if (statements.length == 0) return "{}";
                return "{" + newline + with_indent(function(){
                        return make_block_statements(statements).join(newline);
                }) + newline + indent("}");
        };

        function make_1vardef(def) {
                var name = def[0], val = def[1];
                if (val != null)
                        name = add_spaces([ make_name(name), "=", parenthesize(val, "seq") ]);
                return name;
        };

};

function split_lines(code, max_line_length) {
        var splits = [ 0 ];
        jsp.parse(function(){
                var next_token = jsp.tokenizer(code);
                var last_split = 0;
                var prev_token;
                function current_length(tok) {
                        return tok.pos - last_split;
                };
                function split_here(tok) {
                        last_split = tok.pos;
                        splits.push(last_split);
                };
                function custom(){
                        var tok = next_token.apply(this, arguments);
                        out: {
                                if (prev_token) {
                                        if (prev_token.type == "keyword") break out;
                                }
                                if (current_length(tok) > max_line_length) {
                                        switch (tok.type) {
                                            case "keyword":
                                            case "atom":
                                            case "name":
                                            case "punc":
                                                split_here(tok);
                                                break out;
                                        }
                                }
                        }
                        prev_token = tok;
                        return tok;
                };
                custom.context = function() {
                        return next_token.context.apply(this, arguments);
                };
                return custom;
        }());
        return splits.map(function(pos, i){
                return code.substring(pos, splits[i + 1] || code.length);
        }).join("\n");
};

/* -----[ Utilities ]----- */

function repeat_string(str, i) {
        if (i <= 0) return "";
        if (i == 1) return str;
        var d = repeat_string(str, i >> 1);
        d += d;
        if (i & 1) d += str;
        return d;
};

function defaults(args, defs) {
        var ret = {};
        if (args === true)
                args = {};
        for (var i in defs) if (HOP(defs, i)) {
                ret[i] = (args && HOP(args, i)) ? args[i] : defs[i];
        }
        return ret;
};

function is_identifier(name) {
        return /^[a-z_$][a-z0-9_$]*$/i.test(name)
                && name != "this"
                && !HOP(jsp.KEYWORDS_ATOM, name)
                && !HOP(jsp.RESERVED_WORDS, name)
                && !HOP(jsp.KEYWORDS, name);
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

// some utilities

var MAP;

(function(){
        MAP = function(a, f, o) {
                var ret = [], top = [], i;
                function doit() {
                        var val = f.call(o, a[i], i);
                        if (val instanceof AtTop) {
                                val = val.v;
                                if (val instanceof Splice) {
                                        top.push.apply(top, val.v);
                                } else {
                                        top.push(val);
                                }
                        }
                        else if (val != skip) {
                                if (val instanceof Splice) {
                                        ret.push.apply(ret, val.v);
                                } else {
                                        ret.push(val);
                                }
                        }
                };
                if (a instanceof Array) for (i = 0; i < a.length; ++i) doit();
                else for (i in a) if (HOP(a, i)) doit();
                return top.concat(ret);
        };
        MAP.at_top = function(val) { return new AtTop(val) };
        MAP.splice = function(val) { return new Splice(val) };
        var skip = MAP.skip = {};
        function AtTop(val) { this.v = val };
        function Splice(val) { this.v = val };
})();

/* -----[ Exports ]----- */

exports.ast_walker = ast_walker;
exports.ast_mangle = ast_mangle;
exports.ast_squeeze = ast_squeeze;
exports.ast_lift_variables = ast_lift_variables;
exports.gen_code = gen_code;
exports.ast_add_scope = ast_add_scope;
exports.set_logger = function(logger) { warn = logger };
exports.make_string = make_string;
exports.split_lines = split_lines;
exports.MAP = MAP;

// keep this last!
exports.ast_squeeze_more = require("./squeeze-more").ast_squeeze_more;
});

require.define("/node_modules/derby/node_modules/racer/node_modules/uglify-js/lib/squeeze-more.js",function(require,module,exports,__dirname,__filename,process){var jsp = require("./parse-js"),
    pro = require("./process"),
    slice = jsp.slice,
    member = jsp.member,
    curry = jsp.curry,
    MAP = pro.MAP,
    PRECEDENCE = jsp.PRECEDENCE,
    OPERATORS = jsp.OPERATORS;

function ast_squeeze_more(ast) {
        var w = pro.ast_walker(), walk = w.walk, scope;
        function with_scope(s, cont) {
                var save = scope, ret;
                scope = s;
                ret = cont();
                scope = save;
                return ret;
        };
        function _lambda(name, args, body) {
                return [ this[0], name, args, with_scope(body.scope, curry(MAP, body, walk)) ];
        };
        return w.with_walkers({
                "toplevel": function(body) {
                        return [ this[0], with_scope(this.scope, curry(MAP, body, walk)) ];
                },
                "function": _lambda,
                "defun": _lambda,
                "new": function(ctor, args) {
                        if (ctor[0] == "name") {
                                if (ctor[1] == "Array" && !scope.has("Array")) {
                                        if (args.length != 1) {
                                                return [ "array", args ];
                                        } else {
                                                return walk([ "call", [ "name", "Array" ], args ]);
                                        }
                                } else if (ctor[1] == "Object" && !scope.has("Object")) {
                                        if (!args.length) {
                                                return [ "object", [] ];
                                        } else {
                                                return walk([ "call", [ "name", "Object" ], args ]);
                                        }
                                } else if ((ctor[1] == "RegExp" || ctor[1] == "Function" || ctor[1] == "Error") && !scope.has(ctor[1])) {
                                        return walk([ "call", [ "name", ctor[1] ], args]);
                                }
                        }
                },
                "call": function(expr, args) {
                        if (expr[0] == "dot" && expr[1][0] == "string" && args.length == 1
                            && (args[0][1] > 0 && expr[2] == "substring" || expr[2] == "substr")) {
                                return [ "call", [ "dot", expr[1], "slice"], args];
                        }
                        if (expr[0] == "dot" && expr[2] == "toString" && args.length == 0) {
                                // foo.toString()  ==>  foo+""
                                if (expr[1][0] == "string") return expr[1];
                                return [ "binary", "+", expr[1], [ "string", "" ]];
                        }
                        if (expr[0] == "name") {
                                if (expr[1] == "Array" && args.length != 1 && !scope.has("Array")) {
                                        return [ "array", args ];
                                }
                                if (expr[1] == "Object" && !args.length && !scope.has("Object")) {
                                        return [ "object", [] ];
                                }
                                if (expr[1] == "String" && !scope.has("String")) {
                                        return [ "binary", "+", args[0], [ "string", "" ]];
                                }
                        }
                }
        }, function() {
                return walk(pro.ast_add_scope(ast));
        });
};

exports.ast_squeeze_more = ast_squeeze_more;
});

require.define("/node_modules/derby/node_modules/racer/node_modules/uglify-js/lib/consolidator.js",function(require,module,exports,__dirname,__filename,process){/**
 * @preserve Copyright 2012 Robert Gust-Bardon <http://robert.gust-bardon.org/>.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 *     * Redistributions of source code must retain the above
 *       copyright notice, this list of conditions and the following
 *       disclaimer.
 *
 *     * Redistributions in binary form must reproduce the above
 *       copyright notice, this list of conditions and the following
 *       disclaimer in the documentation and/or other materials
 *       provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

/**
 * @fileoverview Enhances <a href="https://github.com/mishoo/UglifyJS/"
 * >UglifyJS</a> with consolidation of null, Boolean, and String values.
 * <p>Also known as aliasing, this feature has been deprecated in <a href=
 * "http://closure-compiler.googlecode.com/">the Closure Compiler</a> since its
 * initial release, where it is unavailable from the <abbr title=
 * "command line interface">CLI</a>. The Closure Compiler allows one to log and
 * influence this process. In contrast, this implementation does not introduce
 * any variable declarations in global code and derives String values from
 * identifier names used as property accessors.</p>
 * <p>Consolidating literals may worsen the data compression ratio when an <a
 * href="http://tools.ietf.org/html/rfc2616#section-3.5">encoding
 * transformation</a> is applied. For instance, <a href=
 * "http://code.jquery.com/jquery-1.7.1.js">jQuery 1.7.1</a> takes 248235 bytes.
 * Building it with <a href="https://github.com/mishoo/UglifyJS/tarball/v1.2.5">
 * UglifyJS v1.2.5</a> results in 93647 bytes (37.73% of the original) which are
 * then compressed to 33154 bytes (13.36% of the original) using <a href=
 * "http://linux.die.net/man/1/gzip">gzip(1)</a>. Building it with the same
 * version of UglifyJS 1.2.5 patched with the implementation of consolidation
 * results in 80784 bytes (a decrease of 12863 bytes, i.e. 13.74%, in comparison
 * to the aforementioned 93647 bytes) which are then compressed to 34013 bytes
 * (an increase of 859 bytes, i.e. 2.59%, in comparison to the aforementioned
 * 33154 bytes).</p>
 * <p>Written in <a href="http://es5.github.com/#x4.2.2">the strict variant</a>
 * of <a href="http://es5.github.com/">ECMA-262 5.1 Edition</a>. Encoded in <a
 * href="http://tools.ietf.org/html/rfc3629">UTF-8</a>. Follows <a href=
 * "http://google-styleguide.googlecode.com/svn-history/r76/trunk/javascriptguide.xml"
 * >Revision 2.28 of the Google JavaScript Style Guide</a> (except for the
 * discouraged use of the {@code function} tag and the {@code namespace} tag).
 * 100% typed for the <a href=
 * "http://closure-compiler.googlecode.com/files/compiler-20120123.tar.gz"
 * >Closure Compiler Version 1741</a>.</p>
 * <p>Should you find this software useful, please consider <a href=
 * "https://paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=JZLW72X8FD4WG"
 * >a donation</a>.</p>
 * @author follow.me@RGustBardon (Robert Gust-Bardon)
 * @supported Tested with:
 *     <ul>
 *     <li><a href="http://nodejs.org/dist/v0.6.10/">Node v0.6.10</a>,</li>
 *     <li><a href="https://github.com/mishoo/UglifyJS/tarball/v1.2.5">UglifyJS
 *       v1.2.5</a>.</li>
 *     </ul>
 */

/*global console:false, exports:true, module:false, require:false */
/*jshint sub:true */
/**
 * Consolidates null, Boolean, and String values found inside an <abbr title=
 * "abstract syntax tree">AST</abbr>.
 * @param {!TSyntacticCodeUnit} oAbstractSyntaxTree An array-like object
 *     representing an <abbr title="abstract syntax tree">AST</abbr>.
 * @return {!TSyntacticCodeUnit} An array-like object representing an <abbr
 *     title="abstract syntax tree">AST</abbr> with its null, Boolean, and
 *     String values consolidated.
 */
// TODO(user) Consolidation of mathematical values found in numeric literals.
// TODO(user) Unconsolidation.
// TODO(user) Consolidation of ECMA-262 6th Edition programs.
// TODO(user) Rewrite in ECMA-262 6th Edition.
exports['ast_consolidate'] = function(oAbstractSyntaxTree) {
  'use strict';
  /*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, immed:true,
        latedef:true, newcap:true, noarge:true, noempty:true, nonew:true,
        onevar:true, plusplus:true, regexp:true, undef:true, strict:true,
        sub:false, trailing:true */

  var _,
      /**
       * A record consisting of data about one or more source elements.
       * @constructor
       * @nosideeffects
       */
      TSourceElementsData = function() {
        /**
         * The category of the elements.
         * @type {number}
         * @see ESourceElementCategories
         */
        this.nCategory = ESourceElementCategories.N_OTHER;
        /**
         * The number of occurrences (within the elements) of each primitive
         * value that could be consolidated.
         * @type {!Array.<!Object.<string, number>>}
         */
        this.aCount = [];
        this.aCount[EPrimaryExpressionCategories.N_IDENTIFIER_NAMES] = {};
        this.aCount[EPrimaryExpressionCategories.N_STRING_LITERALS] = {};
        this.aCount[EPrimaryExpressionCategories.N_NULL_AND_BOOLEAN_LITERALS] =
            {};
        /**
         * Identifier names found within the elements.
         * @type {!Array.<string>}
         */
        this.aIdentifiers = [];
        /**
         * Prefixed representation Strings of each primitive value that could be
         * consolidated within the elements.
         * @type {!Array.<string>}
         */
        this.aPrimitiveValues = [];
      },
      /**
       * A record consisting of data about a primitive value that could be
       * consolidated.
       * @constructor
       * @nosideeffects
       */
      TPrimitiveValue = function() {
        /**
         * The difference in the number of terminal symbols between the original
         * source text and the one with the primitive value consolidated. If the
         * difference is positive, the primitive value is considered worthwhile.
         * @type {number}
         */
        this.nSaving = 0;
        /**
         * An identifier name of the variable that will be declared and assigned
         * the primitive value if the primitive value is consolidated.
         * @type {string}
         */
        this.sName = '';
      },
      /**
       * A record consisting of data on what to consolidate within the range of
       * source elements that is currently being considered.
       * @constructor
       * @nosideeffects
       */
      TSolution = function() {
        /**
         * An object whose keys are prefixed representation Strings of each
         * primitive value that could be consolidated within the elements and
         * whose values are corresponding data about those primitive values.
         * @type {!Object.<string, {nSaving: number, sName: string}>}
         * @see TPrimitiveValue
         */
        this.oPrimitiveValues = {};
        /**
         * The difference in the number of terminal symbols between the original
         * source text and the one with all the worthwhile primitive values
         * consolidated.
         * @type {number}
         * @see TPrimitiveValue#nSaving
         */
        this.nSavings = 0;
      },
      /**
       * The processor of <abbr title="abstract syntax tree">AST</abbr>s found
       * in UglifyJS.
       * @namespace
       * @type {!TProcessor}
       */
      oProcessor = (/** @type {!TProcessor} */ require('./process')),
      /**
       * A record consisting of a number of constants that represent the
       * difference in the number of terminal symbols between a source text with
       * a modified syntactic code unit and the original one.
       * @namespace
       * @type {!Object.<string, number>}
       */
      oWeights = {
        /**
         * The difference in the number of punctuators required by the bracket
         * notation and the dot notation.
         * <p><code>'[]'.length - '.'.length</code></p>
         * @const
         * @type {number}
         */
        N_PROPERTY_ACCESSOR: 1,
        /**
         * The number of punctuators required by a variable declaration with an
         * initialiser.
         * <p><code>':'.length + ';'.length</code></p>
         * @const
         * @type {number}
         */
        N_VARIABLE_DECLARATION: 2,
        /**
         * The number of terminal symbols required to introduce a variable
         * statement (excluding its variable declaration list).
         * <p><code>'var '.length</code></p>
         * @const
         * @type {number}
         */
        N_VARIABLE_STATEMENT_AFFIXATION: 4,
        /**
         * The number of terminal symbols needed to enclose source elements
         * within a function call with no argument values to a function with an
         * empty parameter list.
         * <p><code>'(function(){}());'.length</code></p>
         * @const
         * @type {number}
         */
        N_CLOSURE: 17
      },
      /**
       * Categories of primary expressions from which primitive values that
       * could be consolidated are derivable.
       * @namespace
       * @enum {number}
       */
      EPrimaryExpressionCategories = {
        /**
         * Identifier names used as property accessors.
         * @type {number}
         */
        N_IDENTIFIER_NAMES: 0,
        /**
         * String literals.
         * @type {number}
         */
        N_STRING_LITERALS: 1,
        /**
         * Null and Boolean literals.
         * @type {number}
         */
        N_NULL_AND_BOOLEAN_LITERALS: 2
      },
      /**
       * Prefixes of primitive values that could be consolidated.
       * The String values of the prefixes must have same number of characters.
       * The prefixes must not be used in any properties defined in any version
       * of <a href=
       * "http://www.ecma-international.org/publications/standards/Ecma-262.htm"
       * >ECMA-262</a>.
       * @namespace
       * @enum {string}
       */
      EValuePrefixes = {
        /**
         * Identifies String values.
         * @type {string}
         */
        S_STRING: '#S',
        /**
         * Identifies null and Boolean values.
         * @type {string}
         */
        S_SYMBOLIC: '#O'
      },
      /**
       * Categories of source elements in terms of their appropriateness of
       * having their primitive values consolidated.
       * @namespace
       * @enum {number}
       */
      ESourceElementCategories = {
        /**
         * Identifies a source element that includes the <a href=
         * "http://es5.github.com/#x12.10">{@code with}</a> statement.
         * @type {number}
         */
        N_WITH: 0,
        /**
         * Identifies a source element that includes the <a href=
         * "http://es5.github.com/#x15.1.2.1">{@code eval}</a> identifier name.
         * @type {number}
         */
        N_EVAL: 1,
        /**
         * Identifies a source element that must be excluded from the process
         * unless its whole scope is examined.
         * @type {number}
         */
        N_EXCLUDABLE: 2,
        /**
         * Identifies source elements not posing any problems.
         * @type {number}
         */
        N_OTHER: 3
      },
      /**
       * The list of literals (other than the String ones) whose primitive
       * values can be consolidated.
       * @const
       * @type {!Array.<string>}
       */
      A_OTHER_SUBSTITUTABLE_LITERALS = [
        'null',   // The null literal.
        'false',  // The Boolean literal {@code false}.
        'true'    // The Boolean literal {@code true}.
      ];

  (/**
    * Consolidates all worthwhile primitive values in a syntactic code unit.
    * @param {!TSyntacticCodeUnit} oSyntacticCodeUnit An array-like object
    *     representing the branch of the abstract syntax tree representing the
    *     syntactic code unit along with its scope.
    * @see TPrimitiveValue#nSaving
    */
   function fExamineSyntacticCodeUnit(oSyntacticCodeUnit) {
     var _,
         /**
          * Indicates whether the syntactic code unit represents global code.
          * @type {boolean}
          */
         bIsGlobal = 'toplevel' === oSyntacticCodeUnit[0],
         /**
          * Indicates whether the whole scope is being examined.
          * @type {boolean}
          */
         bIsWhollyExaminable = !bIsGlobal,
         /**
          * An array-like object representing source elements that constitute a
          * syntactic code unit.
          * @type {!TSyntacticCodeUnit}
          */
         oSourceElements,
         /**
          * A record consisting of data about the source element that is
          * currently being examined.
          * @type {!TSourceElementsData}
          */
         oSourceElementData,
         /**
          * The scope of the syntactic code unit.
          * @type {!TScope}
          */
         oScope,
         /**
          * An instance of an object that allows the traversal of an <abbr
          * title="abstract syntax tree">AST</abbr>.
          * @type {!TWalker}
          */
         oWalker,
         /**
          * An object encompassing collections of functions used during the
          * traversal of an <abbr title="abstract syntax tree">AST</abbr>.
          * @namespace
          * @type {!Object.<string, !Object.<string, function(...[*])>>}
          */
         oWalkers = {
           /**
            * A collection of functions used during the surveyance of source
            * elements.
            * @namespace
            * @type {!Object.<string, function(...[*])>}
            */
           oSurveySourceElement: {
             /**#nocode+*/  // JsDoc Toolkit 2.4.0 hides some of the keys.
             /**
              * Classifies the source element as excludable if it does not
              * contain a {@code with} statement or the {@code eval} identifier
              * name. Adds the identifier of the function and its formal
              * parameters to the list of identifier names found.
              * @param {string} sIdentifier The identifier of the function.
              * @param {!Array.<string>} aFormalParameterList Formal parameters.
              * @param {!TSyntacticCodeUnit} oFunctionBody Function code.
              */
             'defun': function(
                 sIdentifier,
                 aFormalParameterList,
                 oFunctionBody) {
               fClassifyAsExcludable();
               fAddIdentifier(sIdentifier);
               aFormalParameterList.forEach(fAddIdentifier);
             },
             /**
              * Increments the count of the number of occurrences of the String
              * value that is equivalent to the sequence of terminal symbols
              * that constitute the encountered identifier name.
              * @param {!TSyntacticCodeUnit} oExpression The nonterminal
              *     MemberExpression.
              * @param {string} sIdentifierName The identifier name used as the
              *     property accessor.
              * @return {!Array} The encountered branch of an <abbr title=
              *     "abstract syntax tree">AST</abbr> with its nonterminal
              *     MemberExpression traversed.
              */
             'dot': function(oExpression, sIdentifierName) {
               fCountPrimaryExpression(
                   EPrimaryExpressionCategories.N_IDENTIFIER_NAMES,
                   EValuePrefixes.S_STRING + sIdentifierName);
               return ['dot', oWalker.walk(oExpression), sIdentifierName];
             },
             /**
              * Adds the optional identifier of the function and its formal
              * parameters to the list of identifier names found.
              * @param {?string} sIdentifier The optional identifier of the
              *     function.
              * @param {!Array.<string>} aFormalParameterList Formal parameters.
              * @param {!TSyntacticCodeUnit} oFunctionBody Function code.
              */
             'function': function(
                 sIdentifier,
                 aFormalParameterList,
                 oFunctionBody) {
               if ('string' === typeof sIdentifier) {
                 fAddIdentifier(sIdentifier);
               }
               aFormalParameterList.forEach(fAddIdentifier);
             },
             /**
              * Either increments the count of the number of occurrences of the
              * encountered null or Boolean value or classifies a source element
              * as containing the {@code eval} identifier name.
              * @param {string} sIdentifier The identifier encountered.
              */
             'name': function(sIdentifier) {
               if (-1 !== A_OTHER_SUBSTITUTABLE_LITERALS.indexOf(sIdentifier)) {
                 fCountPrimaryExpression(
                     EPrimaryExpressionCategories.N_NULL_AND_BOOLEAN_LITERALS,
                     EValuePrefixes.S_SYMBOLIC + sIdentifier);
               } else {
                 if ('eval' === sIdentifier) {
                   oSourceElementData.nCategory =
                       ESourceElementCategories.N_EVAL;
                 }
                 fAddIdentifier(sIdentifier);
               }
             },
             /**
              * Classifies the source element as excludable if it does not
              * contain a {@code with} statement or the {@code eval} identifier
              * name.
              * @param {TSyntacticCodeUnit} oExpression The expression whose
              *     value is to be returned.
              */
             'return': function(oExpression) {
               fClassifyAsExcludable();
             },
             /**
              * Increments the count of the number of occurrences of the
              * encountered String value.
              * @param {string} sStringValue The String value of the string
              *     literal encountered.
              */
             'string': function(sStringValue) {
               if (sStringValue.length > 0) {
                 fCountPrimaryExpression(
                     EPrimaryExpressionCategories.N_STRING_LITERALS,
                     EValuePrefixes.S_STRING + sStringValue);
               }
             },
             /**
              * Adds the identifier reserved for an exception to the list of
              * identifier names found.
              * @param {!TSyntacticCodeUnit} oTry A block of code in which an
              *     exception can occur.
              * @param {Array} aCatch The identifier reserved for an exception
              *     and a block of code to handle the exception.
              * @param {TSyntacticCodeUnit} oFinally An optional block of code
              *     to be evaluated regardless of whether an exception occurs.
              */
             'try': function(oTry, aCatch, oFinally) {
               if (Array.isArray(aCatch)) {
                 fAddIdentifier(aCatch[0]);
               }
             },
             /**
              * Classifies the source element as excludable if it does not
              * contain a {@code with} statement or the {@code eval} identifier
              * name. Adds the identifier of each declared variable to the list
              * of identifier names found.
              * @param {!Array.<!Array>} aVariableDeclarationList Variable
              *     declarations.
              */
             'var': function(aVariableDeclarationList) {
               fClassifyAsExcludable();
               aVariableDeclarationList.forEach(fAddVariable);
             },
             /**
              * Classifies a source element as containing the {@code with}
              * statement.
              * @param {!TSyntacticCodeUnit} oExpression An expression whose
              *     value is to be converted to a value of type Object and
              *     become the binding object of a new object environment
              *     record of a new lexical environment in which the statement
              *     is to be executed.
              * @param {!TSyntacticCodeUnit} oStatement The statement to be
              *     executed in the augmented lexical environment.
              * @return {!Array} An empty array to stop the traversal.
              */
             'with': function(oExpression, oStatement) {
               oSourceElementData.nCategory = ESourceElementCategories.N_WITH;
               return [];
             }
             /**#nocode-*/  // JsDoc Toolkit 2.4.0 hides some of the keys.
           },
           /**
            * A collection of functions used while looking for nested functions.
            * @namespace
            * @type {!Object.<string, function(...[*])>}
            */
           oExamineFunctions: {
             /**#nocode+*/  // JsDoc Toolkit 2.4.0 hides some of the keys.
             /**
              * Orders an examination of a nested function declaration.
              * @this {!TSyntacticCodeUnit} An array-like object representing
              *     the branch of an <abbr title="abstract syntax tree"
              *     >AST</abbr> representing the syntactic code unit along with
              *     its scope.
              * @return {!Array} An empty array to stop the traversal.
              */
             'defun': function() {
               fExamineSyntacticCodeUnit(this);
               return [];
             },
             /**
              * Orders an examination of a nested function expression.
              * @this {!TSyntacticCodeUnit} An array-like object representing
              *     the branch of an <abbr title="abstract syntax tree"
              *     >AST</abbr> representing the syntactic code unit along with
              *     its scope.
              * @return {!Array} An empty array to stop the traversal.
              */
             'function': function() {
               fExamineSyntacticCodeUnit(this);
               return [];
             }
             /**#nocode-*/  // JsDoc Toolkit 2.4.0 hides some of the keys.
           }
         },
         /**
          * Records containing data about source elements.
          * @type {Array.<TSourceElementsData>}
          */
         aSourceElementsData = [],
         /**
          * The index (in the source text order) of the source element
          * immediately following a <a href="http://es5.github.com/#x14.1"
          * >Directive Prologue</a>.
          * @type {number}
          */
         nAfterDirectivePrologue = 0,
         /**
          * The index (in the source text order) of the source element that is
          * currently being considered.
          * @type {number}
          */
         nPosition,
         /**
          * The index (in the source text order) of the source element that is
          * the last element of the range of source elements that is currently
          * being considered.
          * @type {(undefined|number)}
          */
         nTo,
         /**
          * Initiates the traversal of a source element.
          * @param {!TWalker} oWalker An instance of an object that allows the
          *     traversal of an abstract syntax tree.
          * @param {!TSyntacticCodeUnit} oSourceElement A source element from
          *     which the traversal should commence.
          * @return {function(): !TSyntacticCodeUnit} A function that is able to
          *     initiate the traversal from a given source element.
          */
         cContext = function(oWalker, oSourceElement) {
           /**
            * @return {!TSyntacticCodeUnit} A function that is able to
            *     initiate the traversal from a given source element.
            */
           var fLambda = function() {
             return oWalker.walk(oSourceElement);
           };

           return fLambda;
         },
         /**
          * Classifies the source element as excludable if it does not
          * contain a {@code with} statement or the {@code eval} identifier
          * name.
          */
         fClassifyAsExcludable = function() {
           if (oSourceElementData.nCategory ===
               ESourceElementCategories.N_OTHER) {
             oSourceElementData.nCategory =
                 ESourceElementCategories.N_EXCLUDABLE;
           }
         },
         /**
          * Adds an identifier to the list of identifier names found.
          * @param {string} sIdentifier The identifier to be added.
          */
         fAddIdentifier = function(sIdentifier) {
           if (-1 === oSourceElementData.aIdentifiers.indexOf(sIdentifier)) {
             oSourceElementData.aIdentifiers.push(sIdentifier);
           }
         },
         /**
          * Adds the identifier of a variable to the list of identifier names
          * found.
          * @param {!Array} aVariableDeclaration A variable declaration.
          */
         fAddVariable = function(aVariableDeclaration) {
           fAddIdentifier(/** @type {string} */ aVariableDeclaration[0]);
         },
         /**
          * Increments the count of the number of occurrences of the prefixed
          * String representation attributed to the primary expression.
          * @param {number} nCategory The category of the primary expression.
          * @param {string} sName The prefixed String representation attributed
          *     to the primary expression.
          */
         fCountPrimaryExpression = function(nCategory, sName) {
           if (!oSourceElementData.aCount[nCategory].hasOwnProperty(sName)) {
             oSourceElementData.aCount[nCategory][sName] = 0;
             if (-1 === oSourceElementData.aPrimitiveValues.indexOf(sName)) {
               oSourceElementData.aPrimitiveValues.push(sName);
             }
           }
           oSourceElementData.aCount[nCategory][sName] += 1;
         },
         /**
          * Consolidates all worthwhile primitive values in a range of source
          *     elements.
          * @param {number} nFrom The index (in the source text order) of the
          *     source element that is the first element of the range.
          * @param {number} nTo The index (in the source text order) of the
          *     source element that is the last element of the range.
          * @param {boolean} bEnclose Indicates whether the range should be
          *     enclosed within a function call with no argument values to a
          *     function with an empty parameter list if any primitive values
          *     are consolidated.
          * @see TPrimitiveValue#nSaving
          */
         fExamineSourceElements = function(nFrom, nTo, bEnclose) {
           var _,
               /**
                * The index of the last mangled name.
                * @type {number}
                */
               nIndex = oScope.cname,
               /**
                * The index of the source element that is currently being
                * considered.
                * @type {number}
                */
               nPosition,
               /**
                * A collection of functions used during the consolidation of
                * primitive values and identifier names used as property
                * accessors.
                * @namespace
                * @type {!Object.<string, function(...[*])>}
                */
               oWalkersTransformers = {
                 /**
                  * If the String value that is equivalent to the sequence of
                  * terminal symbols that constitute the encountered identifier
                  * name is worthwhile, a syntactic conversion from the dot
                  * notation to the bracket notation ensues with that sequence
                  * being substituted by an identifier name to which the value
                  * is assigned.
                  * Applies to property accessors that use the dot notation.
                  * @param {!TSyntacticCodeUnit} oExpression The nonterminal
                  *     MemberExpression.
                  * @param {string} sIdentifierName The identifier name used as
                  *     the property accessor.
                  * @return {!Array} A syntactic code unit that is equivalent to
                  *     the one encountered.
                  * @see TPrimitiveValue#nSaving
                  */
                 'dot': function(oExpression, sIdentifierName) {
                   /**
                    * The prefixed String value that is equivalent to the
                    * sequence of terminal symbols that constitute the
                    * encountered identifier name.
                    * @type {string}
                    */
                   var sPrefixed = EValuePrefixes.S_STRING + sIdentifierName;

                   return oSolutionBest.oPrimitiveValues.hasOwnProperty(
                       sPrefixed) &&
                       oSolutionBest.oPrimitiveValues[sPrefixed].nSaving > 0 ?
                       ['sub',
                        oWalker.walk(oExpression),
                        ['name',
                         oSolutionBest.oPrimitiveValues[sPrefixed].sName]] :
                       ['dot', oWalker.walk(oExpression), sIdentifierName];
                 },
                 /**
                  * If the encountered identifier is a null or Boolean literal
                  * and its value is worthwhile, the identifier is substituted
                  * by an identifier name to which that value is assigned.
                  * Applies to identifier names.
                  * @param {string} sIdentifier The identifier encountered.
                  * @return {!Array} A syntactic code unit that is equivalent to
                  *     the one encountered.
                  * @see TPrimitiveValue#nSaving
                  */
                 'name': function(sIdentifier) {
                   /**
                    * The prefixed representation String of the identifier.
                    * @type {string}
                    */
                   var sPrefixed = EValuePrefixes.S_SYMBOLIC + sIdentifier;

                   return [
                     'name',
                     oSolutionBest.oPrimitiveValues.hasOwnProperty(sPrefixed) &&
                     oSolutionBest.oPrimitiveValues[sPrefixed].nSaving > 0 ?
                     oSolutionBest.oPrimitiveValues[sPrefixed].sName :
                     sIdentifier
                   ];
                 },
                 /**
                  * If the encountered String value is worthwhile, it is
                  * substituted by an identifier name to which that value is
                  * assigned.
                  * Applies to String values.
                  * @param {string} sStringValue The String value of the string
                  *     literal encountered.
                  * @return {!Array} A syntactic code unit that is equivalent to
                  *     the one encountered.
                  * @see TPrimitiveValue#nSaving
                  */
                 'string': function(sStringValue) {
                   /**
                    * The prefixed representation String of the primitive value
                    * of the literal.
                    * @type {string}
                    */
                   var sPrefixed =
                       EValuePrefixes.S_STRING + sStringValue;

                   return oSolutionBest.oPrimitiveValues.hasOwnProperty(
                       sPrefixed) &&
                       oSolutionBest.oPrimitiveValues[sPrefixed].nSaving > 0 ?
                       ['name',
                        oSolutionBest.oPrimitiveValues[sPrefixed].sName] :
                       ['string', sStringValue];
                 }
               },
               /**
                * Such data on what to consolidate within the range of source
                * elements that is currently being considered that lead to the
                * greatest known reduction of the number of the terminal symbols
                * in comparison to the original source text.
                * @type {!TSolution}
                */
               oSolutionBest = new TSolution(),
               /**
                * Data representing an ongoing attempt to find a better
                * reduction of the number of the terminal symbols in comparison
                * to the original source text than the best one that is
                * currently known.
                * @type {!TSolution}
                * @see oSolutionBest
                */
               oSolutionCandidate = new TSolution(),
               /**
                * A record consisting of data about the range of source elements
                * that is currently being examined.
                * @type {!TSourceElementsData}
                */
               oSourceElementsData = new TSourceElementsData(),
               /**
                * Variable declarations for each primitive value that is to be
                * consolidated within the elements.
                * @type {!Array.<!Array>}
                */
               aVariableDeclarations = [],
               /**
                * Augments a list with a prefixed representation String.
                * @param {!Array.<string>} aList A list that is to be augmented.
                * @return {function(string)} A function that augments a list
                *     with a prefixed representation String.
                */
               cAugmentList = function(aList) {
                 /**
                  * @param {string} sPrefixed Prefixed representation String of
                  *     a primitive value that could be consolidated within the
                  *     elements.
                  */
                 var fLambda = function(sPrefixed) {
                   if (-1 === aList.indexOf(sPrefixed)) {
                     aList.push(sPrefixed);
                   }
                 };

                 return fLambda;
               },
               /**
                * Adds the number of occurrences of a primitive value of a given
                * category that could be consolidated in the source element with
                * a given index to the count of occurrences of that primitive
                * value within the range of source elements that is currently
                * being considered.
                * @param {number} nPosition The index (in the source text order)
                *     of a source element.
                * @param {number} nCategory The category of the primary
                *     expression from which the primitive value is derived.
                * @return {function(string)} A function that performs the
                *     addition.
                * @see cAddOccurrencesInCategory
                */
               cAddOccurrences = function(nPosition, nCategory) {
                 /**
                  * @param {string} sPrefixed The prefixed representation String
                  *     of a primitive value.
                  */
                 var fLambda = function(sPrefixed) {
                   if (!oSourceElementsData.aCount[nCategory].hasOwnProperty(
                           sPrefixed)) {
                     oSourceElementsData.aCount[nCategory][sPrefixed] = 0;
                   }
                   oSourceElementsData.aCount[nCategory][sPrefixed] +=
                       aSourceElementsData[nPosition].aCount[nCategory][
                           sPrefixed];
                 };

                 return fLambda;
               },
               /**
                * Adds the number of occurrences of each primitive value of a
                * given category that could be consolidated in the source
                * element with a given index to the count of occurrences of that
                * primitive values within the range of source elements that is
                * currently being considered.
                * @param {number} nPosition The index (in the source text order)
                *     of a source element.
                * @return {function(number)} A function that performs the
                *     addition.
                * @see fAddOccurrences
                */
               cAddOccurrencesInCategory = function(nPosition) {
                 /**
                  * @param {number} nCategory The category of the primary
                  *     expression from which the primitive value is derived.
                  */
                 var fLambda = function(nCategory) {
                   Object.keys(
                       aSourceElementsData[nPosition].aCount[nCategory]
                   ).forEach(cAddOccurrences(nPosition, nCategory));
                 };

                 return fLambda;
               },
               /**
                * Adds the number of occurrences of each primitive value that
                * could be consolidated in the source element with a given index
                * to the count of occurrences of that primitive values within
                * the range of source elements that is currently being
                * considered.
                * @param {number} nPosition The index (in the source text order)
                *     of a source element.
                */
               fAddOccurrences = function(nPosition) {
                 Object.keys(aSourceElementsData[nPosition].aCount).forEach(
                     cAddOccurrencesInCategory(nPosition));
               },
               /**
                * Creates a variable declaration for a primitive value if that
                * primitive value is to be consolidated within the elements.
                * @param {string} sPrefixed Prefixed representation String of a
                *     primitive value that could be consolidated within the
                *     elements.
                * @see aVariableDeclarations
                */
               cAugmentVariableDeclarations = function(sPrefixed) {
                 if (oSolutionBest.oPrimitiveValues[sPrefixed].nSaving > 0) {
                   aVariableDeclarations.push([
                     oSolutionBest.oPrimitiveValues[sPrefixed].sName,
                     [0 === sPrefixed.indexOf(EValuePrefixes.S_SYMBOLIC) ?
                      'name' : 'string',
                      sPrefixed.substring(EValuePrefixes.S_SYMBOLIC.length)]
                   ]);
                 }
               },
               /**
                * Sorts primitive values with regard to the difference in the
                * number of terminal symbols between the original source text
                * and the one with those primitive values consolidated.
                * @param {string} sPrefixed0 The prefixed representation String
                *     of the first of the two primitive values that are being
                *     compared.
                * @param {string} sPrefixed1 The prefixed representation String
                *     of the second of the two primitive values that are being
                *     compared.
                * @return {number}
                *     <dl>
                *         <dt>-1</dt>
                *         <dd>if the first primitive value must be placed before
                *              the other one,</dd>
                *         <dt>0</dt>
                *         <dd>if the first primitive value may be placed before
                *              the other one,</dd>
                *         <dt>1</dt>
                *         <dd>if the first primitive value must not be placed
                *              before the other one.</dd>
                *     </dl>
                * @see TSolution.oPrimitiveValues
                */
               cSortPrimitiveValues = function(sPrefixed0, sPrefixed1) {
                 /**
                  * The difference between:
                  * <ol>
                  * <li>the difference in the number of terminal symbols
                  *     between the original source text and the one with the
                  *     first primitive value consolidated, and</li>
                  * <li>the difference in the number of terminal symbols
                  *     between the original source text and the one with the
                  *     second primitive value consolidated.</li>
                  * </ol>
                  * @type {number}
                  */
                 var nDifference =
                     oSolutionCandidate.oPrimitiveValues[sPrefixed0].nSaving -
                     oSolutionCandidate.oPrimitiveValues[sPrefixed1].nSaving;

                 return nDifference > 0 ? -1 : nDifference < 0 ? 1 : 0;
               },
               /**
                * Assigns an identifier name to a primitive value and calculates
                * whether instances of that primitive value are worth
                * consolidating.
                * @param {string} sPrefixed The prefixed representation String
                *     of a primitive value that is being evaluated.
                */
               fEvaluatePrimitiveValue = function(sPrefixed) {
                 var _,
                     /**
                      * The index of the last mangled name.
                      * @type {number}
                      */
                     nIndex,
                     /**
                      * The representation String of the primitive value that is
                      * being evaluated.
                      * @type {string}
                      */
                     sName =
                         sPrefixed.substring(EValuePrefixes.S_SYMBOLIC.length),
                     /**
                      * The number of source characters taken up by the
                      * representation String of the primitive value that is
                      * being evaluated.
                      * @type {number}
                      */
                     nLengthOriginal = sName.length,
                     /**
                      * The number of source characters taken up by the
                      * identifier name that could substitute the primitive
                      * value that is being evaluated.
                      * substituted.
                      * @type {number}
                      */
                     nLengthSubstitution,
                     /**
                      * The number of source characters taken up by by the
                      * representation String of the primitive value that is
                      * being evaluated when it is represented by a string
                      * literal.
                      * @type {number}
                      */
                     nLengthString = oProcessor.make_string(sName).length;

                 oSolutionCandidate.oPrimitiveValues[sPrefixed] =
                     new TPrimitiveValue();
                 do {  // Find an identifier unused in this or any nested scope.
                   nIndex = oScope.cname;
                   oSolutionCandidate.oPrimitiveValues[sPrefixed].sName =
                       oScope.next_mangled();
                 } while (-1 !== oSourceElementsData.aIdentifiers.indexOf(
                     oSolutionCandidate.oPrimitiveValues[sPrefixed].sName));
                 nLengthSubstitution = oSolutionCandidate.oPrimitiveValues[
                     sPrefixed].sName.length;
                 if (0 === sPrefixed.indexOf(EValuePrefixes.S_SYMBOLIC)) {
                   // foo:null, or foo:null;
                   oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving -=
                       nLengthSubstitution + nLengthOriginal +
                       oWeights.N_VARIABLE_DECLARATION;
                   // null vs foo
                   oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving +=
                       oSourceElementsData.aCount[
                           EPrimaryExpressionCategories.
                               N_NULL_AND_BOOLEAN_LITERALS][sPrefixed] *
                       (nLengthOriginal - nLengthSubstitution);
                 } else {
                   // foo:'fromCharCode';
                   oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving -=
                       nLengthSubstitution + nLengthString +
                       oWeights.N_VARIABLE_DECLARATION;
                   // .fromCharCode vs [foo]
                   if (oSourceElementsData.aCount[
                           EPrimaryExpressionCategories.N_IDENTIFIER_NAMES
                       ].hasOwnProperty(sPrefixed)) {
                     oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving +=
                         oSourceElementsData.aCount[
                             EPrimaryExpressionCategories.N_IDENTIFIER_NAMES
                         ][sPrefixed] *
                         (nLengthOriginal - nLengthSubstitution -
                          oWeights.N_PROPERTY_ACCESSOR);
                   }
                   // 'fromCharCode' vs foo
                   if (oSourceElementsData.aCount[
                           EPrimaryExpressionCategories.N_STRING_LITERALS
                       ].hasOwnProperty(sPrefixed)) {
                     oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving +=
                         oSourceElementsData.aCount[
                             EPrimaryExpressionCategories.N_STRING_LITERALS
                         ][sPrefixed] *
                         (nLengthString - nLengthSubstitution);
                   }
                 }
                 if (oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving >
                     0) {
                   oSolutionCandidate.nSavings +=
                       oSolutionCandidate.oPrimitiveValues[sPrefixed].nSaving;
                 } else {
                   oScope.cname = nIndex; // Free the identifier name.
                 }
               },
               /**
                * Adds a variable declaration to an existing variable statement.
                * @param {!Array} aVariableDeclaration A variable declaration
                *     with an initialiser.
                */
               cAddVariableDeclaration = function(aVariableDeclaration) {
                 (/** @type {!Array} */ oSourceElements[nFrom][1]).unshift(
                     aVariableDeclaration);
               };

           if (nFrom > nTo) {
             return;
           }
           // If the range is a closure, reuse the closure.
           if (nFrom === nTo &&
               'stat' === oSourceElements[nFrom][0] &&
               'call' === oSourceElements[nFrom][1][0] &&
               'function' === oSourceElements[nFrom][1][1][0]) {
             fExamineSyntacticCodeUnit(oSourceElements[nFrom][1][1]);
             return;
           }
           // Create a list of all derived primitive values within the range.
           for (nPosition = nFrom; nPosition <= nTo; nPosition += 1) {
             aSourceElementsData[nPosition].aPrimitiveValues.forEach(
                 cAugmentList(oSourceElementsData.aPrimitiveValues));
           }
           if (0 === oSourceElementsData.aPrimitiveValues.length) {
             return;
           }
           for (nPosition = nFrom; nPosition <= nTo; nPosition += 1) {
             // Add the number of occurrences to the total count.
             fAddOccurrences(nPosition);
             // Add identifiers of this or any nested scope to the list.
             aSourceElementsData[nPosition].aIdentifiers.forEach(
                 cAugmentList(oSourceElementsData.aIdentifiers));
           }
           // Distribute identifier names among derived primitive values.
           do {  // If there was any progress, find a better distribution.
             oSolutionBest = oSolutionCandidate;
             if (Object.keys(oSolutionCandidate.oPrimitiveValues).length > 0) {
               // Sort primitive values descending by their worthwhileness.
               oSourceElementsData.aPrimitiveValues.sort(cSortPrimitiveValues);
             }
             oSolutionCandidate = new TSolution();
             oSourceElementsData.aPrimitiveValues.forEach(
                 fEvaluatePrimitiveValue);
             oScope.cname = nIndex;
           } while (oSolutionCandidate.nSavings > oSolutionBest.nSavings);
           // Take the necessity of adding a variable statement into account.
           if ('var' !== oSourceElements[nFrom][0]) {
             oSolutionBest.nSavings -= oWeights.N_VARIABLE_STATEMENT_AFFIXATION;
           }
           if (bEnclose) {
             // Take the necessity of forming a closure into account.
             oSolutionBest.nSavings -= oWeights.N_CLOSURE;
           }
           if (oSolutionBest.nSavings > 0) {
             // Create variable declarations suitable for UglifyJS.
             Object.keys(oSolutionBest.oPrimitiveValues).forEach(
                 cAugmentVariableDeclarations);
             // Rewrite expressions that contain worthwhile primitive values.
             for (nPosition = nFrom; nPosition <= nTo; nPosition += 1) {
               oWalker = oProcessor.ast_walker();
               oSourceElements[nPosition] =
                   oWalker.with_walkers(
                       oWalkersTransformers,
                       cContext(oWalker, oSourceElements[nPosition]));
             }
             if ('var' === oSourceElements[nFrom][0]) {  // Reuse the statement.
               (/** @type {!Array.<!Array>} */ aVariableDeclarations.reverse(
                   )).forEach(cAddVariableDeclaration);
             } else {  // Add a variable statement.
               Array.prototype.splice.call(
                   oSourceElements,
                   nFrom,
                   0,
                   ['var', aVariableDeclarations]);
               nTo += 1;
             }
             if (bEnclose) {
               // Add a closure.
               Array.prototype.splice.call(
                   oSourceElements,
                   nFrom,
                   0,
                   ['stat', ['call', ['function', null, [], []], []]]);
               // Copy source elements into the closure.
               for (nPosition = nTo + 1; nPosition > nFrom; nPosition -= 1) {
                 Array.prototype.unshift.call(
                     oSourceElements[nFrom][1][1][3],
                     oSourceElements[nPosition]);
               }
               // Remove source elements outside the closure.
               Array.prototype.splice.call(
                   oSourceElements,
                   nFrom + 1,
                   nTo - nFrom + 1);
             }
           }
           if (bEnclose) {
             // Restore the availability of identifier names.
             oScope.cname = nIndex;
           }
         };

     oSourceElements = (/** @type {!TSyntacticCodeUnit} */
         oSyntacticCodeUnit[bIsGlobal ? 1 : 3]);
     if (0 === oSourceElements.length) {
       return;
     }
     oScope = bIsGlobal ? oSyntacticCodeUnit.scope : oSourceElements.scope;
     // Skip a Directive Prologue.
     while (nAfterDirectivePrologue < oSourceElements.length &&
            'directive' === oSourceElements[nAfterDirectivePrologue][0]) {
       nAfterDirectivePrologue += 1;
       aSourceElementsData.push(null);
     }
     if (oSourceElements.length === nAfterDirectivePrologue) {
       return;
     }
     for (nPosition = nAfterDirectivePrologue;
          nPosition < oSourceElements.length;
          nPosition += 1) {
       oSourceElementData = new TSourceElementsData();
       oWalker = oProcessor.ast_walker();
       // Classify a source element.
       // Find its derived primitive values and count their occurrences.
       // Find all identifiers used (including nested scopes).
       oWalker.with_walkers(
           oWalkers.oSurveySourceElement,
           cContext(oWalker, oSourceElements[nPosition]));
       // Establish whether the scope is still wholly examinable.
       bIsWhollyExaminable = bIsWhollyExaminable &&
           ESourceElementCategories.N_WITH !== oSourceElementData.nCategory &&
           ESourceElementCategories.N_EVAL !== oSourceElementData.nCategory;
       aSourceElementsData.push(oSourceElementData);
     }
     if (bIsWhollyExaminable) {  // Examine the whole scope.
       fExamineSourceElements(
           nAfterDirectivePrologue,
           oSourceElements.length - 1,
           false);
     } else {  // Examine unexcluded ranges of source elements.
       for (nPosition = oSourceElements.length - 1;
            nPosition >= nAfterDirectivePrologue;
            nPosition -= 1) {
         oSourceElementData = (/** @type {!TSourceElementsData} */
             aSourceElementsData[nPosition]);
         if (ESourceElementCategories.N_OTHER ===
             oSourceElementData.nCategory) {
           if ('undefined' === typeof nTo) {
             nTo = nPosition;  // Indicate the end of a range.
           }
           // Examine the range if it immediately follows a Directive Prologue.
           if (nPosition === nAfterDirectivePrologue) {
             fExamineSourceElements(nPosition, nTo, true);
           }
         } else {
           if ('undefined' !== typeof nTo) {
             // Examine the range that immediately follows this source element.
             fExamineSourceElements(nPosition + 1, nTo, true);
             nTo = void 0;  // Obliterate the range.
           }
           // Examine nested functions.
           oWalker = oProcessor.ast_walker();
           oWalker.with_walkers(
               oWalkers.oExamineFunctions,
               cContext(oWalker, oSourceElements[nPosition]));
         }
       }
     }
   }(oAbstractSyntaxTree = oProcessor.ast_add_scope(oAbstractSyntaxTree)));
  return oAbstractSyntaxTree;
};
/*jshint sub:false */

/* Local Variables:      */
/* mode: js              */
/* coding: utf-8         */
/* indent-tabs-mode: nil */
/* tab-width: 2          */
/* End:                  */
/* vim: set ft=javascript fenc=utf-8 et ts=2 sts=2 sw=2: */
/* :mode=javascript:noTabs=true:tabSize=2:indentSize=2:deepIndent=true: */

});

require.define("/node_modules/derby/node_modules/racer/lib/queries/TransformBuilder.js",function(require,module,exports,__dirname,__filename,process){var QueryBuilder = require('./QueryBuilder')
  , MemoryQuery = require('./MemoryQuery')
  , setupQueryModelScope = require('./util').setupQueryModelScope
  , filterDomain = require('../computed/filter').filterDomain
  ;

module.exports = TransformBuilder;

function TransformBuilder (model, source) {
  QueryBuilder.call(this);
  this._model = model;
  this.from(source);
}

TransformBuilder.fromJSON = QueryBuilder._createFromJsonFn(TransformBuilder);

var proto = TransformBuilder.prototype = new QueryBuilder();

proto.filter = function (filterSpec) {
  var filterFn;
  if (typeof filterSpec === 'function') {
    this.filterFn = filterSpec;
  } else if (filterSpec.constructor == Object) {
    this.query(filterSpec);
  }
  return this;
};

var __sort__ = proto.sort;
proto.sort = function (sortSpec) {
  if (typeof sortSpec === 'function') {
    this._comparator = sortSpec;
    return this;
  }
  // else sortSpec === ['fieldA', 'asc', 'fieldB', 'desc', ...]
  return __sort__.call(this, sortSpec);
};

/**
 * Registers, executes, and sets up listeners for a model query, the first time
 * this is called. Subsequent calls just return the cached scoped model
 * representing the filter result.
 *
 * @return {Model} a scoped model scoped to a refList
 * @api public
 */
proto.get = function () {
  var scopedModel = this.scopedModel ||
                   (this.scopedModel = this._genScopedModel());
  return scopedModel.get();
};

proto.path = function () {
  var scopedModel = this.scopedModel ||
                   (this.scopedModel = this._genScopedModel());
  return scopedModel.path();
};

proto._genScopedModel = function () {
  // Lazy-assign default query type of 'find'
  if (!this.type) this.type = 'find';

  // syncRun is also called by the Query Model Scope on dependency changes
  var model = this._model
    , domain = model.get(this.ns)
    , filterFn = this.filterFn;
  if (filterFn) domain = filterDomain(domain, filterFn);

  // TODO Register the transform, so it can be cleaned up when we no longer
  // need it

  var queryJson = this.toJSON()
    , memoryQuery = this.memoryQuery = new MemoryQuery(queryJson)
    , result = memoryQuery.syncRun(domain)
    , comparator = this._comparator;
  if (comparator) result = result.sort(comparator);

  // TODO queryId here will not be unique once we introduct ad hoc filter
  // functions
  var queryId = QueryBuilder.hash(queryJson);
  return setupQueryModelScope(model, memoryQuery, queryId, result);
};

proto.filterTest = function (doc, ns) {
  if (ns !== this.ns) return false;
  var filterFn = this.filterFn;
  if (filterFn && ! filterFn(doc)) return false;
  return this.memoryQuery.filterTest(doc, ns);
};
});

require.define("/node_modules/derby/node_modules/racer/lib/queries/QueryBuilder.js",function(require,module,exports,__dirname,__filename,process){module.exports = QueryBuilder;

var reserved = {
    equals: 1
  , notEquals: 1
  , gt: 1
  , gte: 1
  , lt: 1
  , lte: 1
  , within: 1
  , contains: 1
};

var validQueryParams = {
    from: 1
  , byId: 1
  , where: 1
  , skip: 1
  , limit: 1
  , sort: 1
  , except: 1
  , only: 1
};

// QueryBuilder constructor
// @param {Object} params looks like:
//   {
//     from: 'someNamespace'
//   , where: {
//       name: 'Gnarls'
//     , gender: { notEquals: 'female' }
//     , age: { gt: 21, lte: 30 }
//     , tags: { contains: ['super', 'derby'] }
//     , shoe: { within: ['nike', 'adidas'] }
//     }
//   , sort: ['fieldA', 'asc', 'fieldB', 'desc']
//   , skip: 10
//   , limit: 5
//   }
function QueryBuilder (params) {
  this._json = {};

  if (params) this.query(params);
}

function keyMatch (obj, fn) {
  for (var k in obj) {
    if (fn(k)) return true;
  }
  return false;
}

function isReserved (key) { return key in reserved; }

var proto = QueryBuilder.prototype = {
    from: function (from) {
      this.ns = from;
      this._json.from = from;
      return this;
    }
  , byId: function (id) {
      this._json.byId = id;
      return this;
    }
  , where: function (param) {
      if (typeof param === 'string') {
        this._currField = param;
        return this;
      }

      if (param.constructor !== Object) {
        console.error(param);
        throw new Error("Invalid `where` param");
      }

      for (var fieldName in param) {
        this._currField = fieldName;
        var arg = param[fieldName]
        if (arg.constructor !== Object) {
          this.equals(arg);
        } else if (keyMatch(arg, isReserved)) {
          for (var comparator in arg) {
            this[comparator](arg[comparator]);
          }
        } else {
          this.equals(arg);
        }
      }
    }
  , toJSON: function () {
      var json = this._json;
      if (this.type && !json.type) json.type = this.type;
      return json;
    }

    /**
     * Entry-point for more coffee-script style query building.
     *
     * @param {Object} params representing additional query method calls
     * @return {QueryBuilder} this for chaining
     */
  , query: function (params) {
      for (var k in params) {
        if (! (k in validQueryParams)) { throw new Error("Un-identified operator '" + k + "'");
        }
        this[k](params[k]);
      }
      return this;
    }
};

QueryBuilder._createFromJsonFn = function (QueryBuilderKlass) {
  return function (json) {
    var q = new QueryBuilderKlass;
    for (var param in json) {
      switch (param) {
        case 'type':
          QueryBuilder.prototype[json[param]].call(q);
          break;
        case 'from':
        case 'byId':
        case 'sort':
        case 'skip':
        case 'limit':
          q[param](json[param]);
          break;
        case 'only':
        case 'except':
          q[param](json[param]);
          break;
        case 'equals':
        case 'notEquals':
        case 'gt':
        case 'gte':
        case 'lt':
        case 'lte':
        case 'within':
        case 'contains':
          var fields = json[param];
          for (var field in fields) {
            q.where(field)[param](fields[field]);
          }
          break;
        default:
          throw new Error("Un-identified Query json property '" + param + "'");
      }
    }
    return q;
  }
};

QueryBuilder.fromJSON = QueryBuilder._createFromJsonFn(QueryBuilder);

// We use ABBREVS for query hashing, so our hashes are more compressed.
var ABBREVS = {
        equals: '$eq'
      , notEquals: '$ne'
      , gt: '$gt'
      , gte: '$gte'
      , lt: '$lt'
      , lte: '$lte'
      , within: '$w'
      , contains: '$c'

      , byId: '$id'

      , only: '$o'
      , except: '$e'
      , sort: '$s'
      , asc: '^'
      , desc: 'v'
      , skip: '$sk'
      , limit: '$L'
    }
  , SEP = ':';

function noDots (path) {
  return path.replace(/\./g, '$DOT$');
}

// TODO Close ABBREVS with reverse ABBREVS?
QueryBuilder.hash = function (json) {
  var groups = []
    , nsHash
    , byIdHash
    , selectHash
    , sortHash
    , skipHash
    , limitHash
    , group
    , fields, field;

  for (var method in json) {
    var val = json[method];
    switch (method) {
      case 'from':
        nsHash = noDots(val);
        break;
      case 'byId':
        byIdHash = ABBREVS.byId + SEP + JSON.stringify(val);
        break;
      case 'only':
      case 'except':
        selectHash = ABBREVS[method];
        for (var i = 0, l = val.length; i < l; i++) {
          field = val[i];
          selectHash += SEP + noDots(field);
        }
        break;
      case 'sort':
        sortHash = ABBREVS.sort + SEP;
        for (var i = 0, l = val.length; i < l; i+=2) {
          field = val[i];
          sortHash += noDots(field) + SEP + ABBREVS[val[i+1]];
        }
        break;
      case 'skip':
        skipHash = ABBREVS.skip + SEP + val;
        break;
      case 'limit':
        limitHash = ABBREVS.limit + SEP + val;
        break;

      case 'where':
        break;
      case 'within':
      case 'contains':
        for (var k in val) {
          val[k] = val[k].sort();
        }
        // Intentionally fall-through without a break
      case 'equals':
      case 'notEquals':
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
        group = [ABBREVS[method]];
        fields = group[group.length] = [];
        groups.push(group);
        for (field in val) {
          fields.push([field, JSON.stringify(val[field])]);
        }
        break;
    }
  }

  var hash = nsHash;
  if (byIdHash)  hash += SEP + byIdHash;
  if (sortHash)   hash += SEP + sortHash;
  if (selectHash) hash += SEP + selectHash;
  if (skipHash)   hash += SEP + skipHash;
  if (limitHash)  hash += SEP + limitHash;

  for (var i = groups.length; i--; ) {
    group = groups[i];
    group[1] = group[1].sort(comparator);
  }

  groups = groups.sort( function (groupA, groupB) {
    var pathA = groupA[0]
      , pathB = groupB[0];
    if (pathA < pathB)   return -1;
    if (pathA === pathB) return 0;
    return 1;
  });

  for (i = 0, l = groups.length; i < l; i++) {
    group = groups[i];
    hash += SEP + SEP + group[0];
    fields = group[1];
    for (var j = 0, m = fields.length; j < m; j++) {
      var pair = fields[j]
        , field = pair[0]
        , val   = pair[1];
      hash += SEP + noDots(field) + SEP + val;
    }
  }

  return hash;
};

proto.hash = function hash () {
  return QueryBuilder.hash(this._json);
};

function comparator (pairA, pairB) {
  var methodA = pairA[0], methodB = pairB[0];
  if (methodA < methodB)   return -1;
  if (methodA === methodB) return 0;
  return 1;
}

proto.sort = function (params) {
  if (arguments.length > 1) {
    params = Array.prototype.slice.call(arguments);
  }
  this._json.sort = params;
  return this;
};

var methods = [
    'skip'
  , 'limit'
];

methods.forEach( function (method) {
  proto[method] = function (arg) {
    this._json[method] = arg;
    return this;
  }
});

methods = ['only', 'except'];

methods.forEach( function (method) {
  proto[method] = function (paths) {
    if (arguments.length > 1 || ! Array.isArray(arguments[0])) {
      paths = Array.prototype.slice.call(arguments);
    }
    var json = this._json
      , fields = json[method] || (json[method] = {});
    if (Array.isArray(paths)) {
      for (var i = paths.length; i--; ) {
        fields[paths[i]] = 1;
      }
    } else if (paths.constructor === Object) {
      merge(fields, paths);
    } else {
      console.error(paths);
      throw new Error('Un-supported paths format');
    }
    return this;
  }
});

methods = [
    'equals'
  , 'notEquals'
  , 'gt', 'gte', 'lt', 'lte'
  , 'within', 'contains'
];

methods.forEach( function (method) {
  // Each method `equals`, `notEquals`, etc. just populates a `json` property
  // that is a JSON representation of the query that can be passed around
  proto[method] = function (val) {
    var json = this._json
      , cond = json[method] || (json[method] = {});
    cond[this._currField] = val;
    return this;
  };
});

proto.one = function one () {
  this.type = 'findOne';
  this._json.type = 'findOne';
  return this;
};
});

require.define("/node_modules/derby/node_modules/racer/lib/queries/MemoryQuery.js",function(require,module,exports,__dirname,__filename,process){// TODO JSDoc
var filterUtils = require('../computed/filter')
  , filterFnFromQuery = filterUtils.filterFnFromQuery
  , filterDomain = filterUtils.filterDomain
  , sliceDomain = require('../computed/range').sliceDomain
  , sortUtils = require('../computed/sort')
  , sortDomain = sortUtils.sortDomain
  , deriveComparator = sortUtils.deriveComparator
  , projectDomain = require('../computed/project').projectDomain
  , util = require('../util')
  , Promise = util.Promise
  , merge = util.merge
  , objectExcept = require('../path').objectExcept
  ;

module.exports = MemoryQuery;

/**
 * MemoryQuery instances are used:
 * - On the server when DbMemory database adapter is used
 * - On QueryNodes stored inside a QueryHub to figure out which transactions
 *   trigger query result changes to publish to listeners.
 * - Inside the browser for filters
 *
 * @param {Object} json representing a query that is typically created via
 * convenient QueryBuilder instances. See QueryBuilder.js for more details.
 */
function MemoryQuery (json) {
  this.ns = json.from;
  this._json = json;
  var filteredJson = objectExcept(json, ['only', 'except', 'limit', 'skip', 'sort', 'type']);
  this._filter = filterFnFromQuery(filteredJson);
  for (var k in json) {
    if (k === 'type') {
      // find() or findOne()
      this[json[k]]();
    } else if (k in this) {
      this[k](json[k]);
    }
  }
}

MemoryQuery.prototype.toJSON = function toJSON () {
  return this._json;
};

/**
 * Specify that documents in the result set are stripped of all fields except
 * the ones specified in `paths`
 * @param {Object} paths to include. The Object maps String -> 1
 * @return {MemoryQuery} this for chaining
 * @api public
 */
MemoryQuery.prototype.only = function only (paths) {
  if (this._except) {
    throw new Error("You can't specify both query(...).except(...) and query(...).only(...)");
  }
  var only = this._only || (this._only = {id: 1});
  merge(only, paths);
  return this;
};

/**
 * Specify that documents in the result set are stripped of the fields
 * specified in `paths`. You aren't allowed to exclude the path "id"
 * @param {Object} paths to exclude. The Object maps String -> 1
 * @return {MemoryQuery} this for chaining
 * @api public
 */
MemoryQuery.prototype.except = function except (paths) {
  if (this._only) {
    throw new Error("You can't specify both query(...).except(...) and query(...).only(...)");
  }
  var except = this._except || (this._except = {});
  if ('id' in paths) {
    throw new Error('You cannot ignore `id`');
  }
  merge(except, paths);
  return this;
};

// Specify that the result set includes no more than `lim` results
// @param {Number} lim is the number of results to which to limit the result set
MemoryQuery.prototype.limit = function limit (lim) {
  this.isPaginated = true;
  this._limit = lim;
  return this;
};

// Specify that the result set should skip the first `howMany` results out of
// the entire set of results that match the equivlent query without a skip or
// limit.
MemoryQuery.prototype.skip = function skip (howMany) {
  this.isPaginated = true;
  this._skip = howMany;
  return this;
};

// e.g.,
// sort(['field1', 'asc', 'field2', 'desc', ...])
MemoryQuery.prototype.sort = function sort (params) {
  var sort = this._sort;
  if (sort && sort.length) {
    sort = this._sort = this._sort.concat(params);
  } else {
    sort = this._sort = params;
  }
  this._comparator = deriveComparator(sort);
  return this;
};

MemoryQuery.prototype.find = function find () {
  this.type = 'find';
  this._json.type = 'find';
  return this;
};

MemoryQuery.prototype.findOne = function findOne () {
  this.type = 'findOne';
  this._json.type = 'findOne';
  return this;
};

MemoryQuery.prototype.filterTest = function filterTest (doc, ns) {
  if (ns !== this._json.from) return false;
  return this._filter(doc);
};

MemoryQuery.prototype.run = function run (memoryAdapter, cb) {
  var promise = (new Promise).on(cb)
    , searchSpace = memoryAdapter._get(this._json.from)
    , matches = this.syncRun(searchSpace);

  promise.resolve(null, matches);

  return promise;
};

MemoryQuery.prototype.syncRun = function syncRun (searchSpace) {
  var matches = filterDomain(searchSpace, this._filter, this._json.from);

  // Query results should always be a list. sort co-erces the results into a
  // list even if comparator is not present.
  matches = sortDomain(matches, this._comparator);

  // Handle skip/limit for pagination
  var skip = this._skip
    , limit = this._limit;
  if (typeof limit !== 'undefined') {
    matches = sliceDomain(matches, skip, limit);
  }

  // Truncate to limit the work of the next field filtering step
  if (this.type === 'findOne') {
    matches = [matches[0]];
  }

  // Selectively return the documents with a subset of fields based on
  // `except` or `only`
  var only = this._only
    , except = this._except;
  if (only || except) {
    matches = projectDomain(matches, only || except, !!except);
  }

  if (this.type === 'findOne') return matches[0];
  return matches;
}
});

require.define("/node_modules/derby/node_modules/racer/lib/computed/filter.js",function(require,module,exports,__dirname,__filename,process){var lookup = require('../path').lookup
  , transaction = require('../transaction')
  , util = require('../util')
  , indexOf = util.indexOf
  , deepIndexOf = util.deepIndexOf
  , deepEqual = util.deepEqual
  , QueryBuilder = require('../queries/QueryBuilder')
  ;

module.exports = {
  filterFnFromQuery: filterFnFromQuery
, filterDomain: filterDomain
, deriveFilterFn: deriveFilterFn
};

/**
 * Creates a filter function based on a query represented as json.
 *
 * @param {Object} json representing a query that is typically created via
 * convenient QueryBuilder instances
 *
 * json looks like:
 * {
 *    from: 'collectionName'
 *  , byId: id
 *  , equals: {
 *      somePath: someVal
 *  , }
 *  , notEquals: {
 *      somePath: someVal
 *    }
 *  , sort: ['fieldA', 'asc', 'fieldB', 'desc']
 *  }
 *
 * @return {Function} a filter function
 * @api public
 */
function filterFnFromQuery (json) {
  // Stores a list of predicate functions that take a document and return a
  // Boolean. If all predicate functions return true, then the document passes
  // through the filter. If not, the document is blocked by the filter
  var predicates = []
    , pred;

  if (json) for (var method in json) {
    if (method === 'from') continue;
    pred = predicateBuilders[method](json[method]);
    if (Array.isArray(pred)) predicates = predicates.concat(pred);
    else predicates.push(pred);
  }

  return compileDocFilter(predicates);
}

var predicateBuilders = {};

predicateBuilders.byId = function byId (id) {
  return function (doc) { return doc.id === id; };
};

var fieldPredicates = {
    equals: function (fieldName, val, doc) {
      var currVal = lookup(fieldName, doc);
      if (typeof currVal === 'object') {
        return deepEqual(currVal, val);
      }
      return currVal === val;
    }
  , notEquals: function (fieldName, val, doc) {
      var currVal = lookup(fieldName, doc);
      if (typeof currVal === 'object') {
        return ! deepEqual(currVal, val);
      }
      return currVal !== val;
    }
  , gt: function (fieldName, val, doc) {
      return lookup(fieldName, doc) > val;
    }
  , gte: function (fieldName, val, doc) {
      return lookup(fieldName, doc) >= val;
    }
  , lt: function (fieldName, val, doc) {
      return lookup(fieldName, doc) < val;
    }
  , lte: function (fieldName, val, doc) {
      return lookup(fieldName, doc) <= val;
    }
  , within: function (fieldName, list, doc) {
      if (!list.length) return false;
      var x = lookup(fieldName, doc);
      if (x && x.constructor === Object) return ~deepIndexOf(list, x);
      return ~list.indexOf(x);
    }
  , contains: function (fieldName, list, doc) {
      var docList = lookup(fieldName, doc);
      if (typeof docList === 'undefined') {
        if (list.length) return false;
        return true; // contains nothing
      }
      for (var x, i = list.length; i--; ) {
        x = list[i];
        if (x.constructor === Object) {
          if (-1 === deepIndexOf(docList, x)) return false;
        } else {
          if (-1 === docList.indexOf(x)) return false;
        }
      }
      return true;
    }
};

for (var queryKey in fieldPredicates) {
  predicateBuilders[queryKey] = (function (fieldPred) {
    return function (params) {
      return createDocPredicates(params, fieldPred);
    };
  })(fieldPredicates[queryKey]);
}

function createDocPredicates (params, fieldPredicate) {
  var predicates = []
    , docPred;
  for (var fieldName in params) {
    docPred = fieldPredicate.bind(undefined, fieldName, params[fieldName]);
    predicates.push(docPred);
  }
  return predicates;
};

function compileDocFilter (predicates) {
  switch (predicates.length) {
    case 0: return evalToTrue;
    case 1: return predicates[0];
  }
  return function test (doc) {
    if (typeof doc === 'undefined') return false;
    for (var i = 0, l = predicates.length; i < l; i++) {
      if (! predicates[i](doc)) return false;
    }
    return true;
  };
}

/**
 * @api private
 */
function evalToTrue () { return true; }

/**
 * Returns the set of docs from searchSpace that pass filterFn.
 *
 * @param {Object|Array} searchSpace
 * @param {Function} filterFn
 * @param {String} ns
 * @return {Object|Array} the filtered values
 * @api public
 */
function filterDomain (searchSpace, filterFn) {
  if (Array.isArray(searchSpace)) {
    return searchSpace.filter(filterFn);
  }

  var filtered = {};
  for (var k in searchSpace) {
    var curr = searchSpace[k];
    if (filterFn(curr)) {
      filtered[k] = curr;
    }
  }
  return filtered;
}

/**
 * Derives the filter function, based on filterSpec and source.
 *
 * @param {Function|Object} filterSpec is a representation of the filter
 * @param {String} source is the path to the data that we want to filter
 * @param {Boolean} single specifies whether to filter down to a single
 * resulting Object.
 * @return {Function} filter function
 * @api private
 */
function deriveFilterFn (filterSpec, source, single) {
  if (typeof filterSpec === 'function') {
    var numArgs = filterSpec.length;
    if (numArgs === 1) return filterSpec;
    if (numArgs === 0) {
      var queryBuilder = new QueryBuilder({from: source});
      queryBuilder = filterSpec.call(queryBuilder);
      if (single) queryBuilder.on();
      var queryJson = queryBuilder.toJSON();
      var filter = filterFnFromQuery(queryJson);
      if (queryJson.sort) {
        // TODO
      }
    }
    throw new Error('filter spec must be either a function with 0 or 1 argument, or an Object');
  }
  // Otherwise, filterSpec is an Object representing query params
  filterSpec.from = source;
  var queryBuilder = new QueryBuilder(filterSpec);
  if (single) queryBuilder.one();
  return filterFnFromQuery(queryBuilder.toJSON());
}
});

require.define("/node_modules/derby/node_modules/racer/lib/computed/range.js",function(require,module,exports,__dirname,__filename,process){exports.sliceDomain = sliceDomain;

function sliceDomain (list, skip, limit) {
  if (typeof skip === 'undefined') skip = 0;
  return list.slice(skip, skip + limit);
}
});

require.define("/node_modules/derby/node_modules/racer/lib/computed/sort.js",function(require,module,exports,__dirname,__filename,process){var lookup = require('../path').lookup;

module.exports = {
  sortDomain: sortDomain
, deriveComparator: deriveComparator
};

function sortDomain (domain, comparator) {
  if (! Array.isArray(domain)) {
    var list = [];
    for (var k in domain) {
      list[list.length] = domain[k];
    }
    domain = list;
  }
  if (!comparator) return domain;
  return domain.sort(comparator);
}

// TODO Do the functions below need to belong here?

/**
 * Generates a comparator function that returns -1, 0, or 1
 * if a < b, a == b, or a > b respectively, according to the ordering criteria
 * defined by sortParams
 * , e.g., sortParams = ['field1', 'asc', 'field2', 'desc']
 */
function deriveComparator (sortList) {
  return function comparator (a, b, sortParams) {
    sortParams || (sortParams = sortList);
    var dir, path, factor, aVal, bVal
      , aIsIncomparable, bIsIncomparable;
    for (var i = 0, l = sortParams.length; i < l; i+=2) {
      var dir = sortParams[i+1];
      switch (dir) {
        case 'asc' : factor =  1; break;
        case 'desc': factor = -1; break;
        default: throw new Error('Must be "asc" or "desc"');
      }
      path = sortParams[i];
      aVal = lookup(path, a);
      bVal = lookup(path, b);

      // Handle undefined, null, or in-comparable aVal and/or bVal.
      aIsIncomparable = isIncomparable(aVal)
      bIsIncomparable = isIncomparable(bVal);

      // Incomparables always come last.
      if ( aIsIncomparable && !bIsIncomparable) return factor;
      // Incomparables always come last, even in reverse order.
      if (!aIsIncomparable &&  bIsIncomparable) return -factor;

      // Tie-break 2 incomparable fields by comparing more downstream ones
      if ( aIsIncomparable &&  bIsIncomparable) continue;

      // Handle comparable field values
      if      (aVal < bVal) return -factor;
      else if (aVal > bVal) return factor;

      // Otherwise, the field values for both docs so far are equivalent
    }
    return 0;
  };
}

function isIncomparable (x) {
  return (typeof x === 'undefined') || x === null;
}

});

require.define("/node_modules/derby/node_modules/racer/lib/computed/project.js",function(require,module,exports,__dirname,__filename,process){var path = require('../path')
  , objectWithOnly = path.objectWithOnly
  , objectExcept = path.objectExcept

exports.projectDomain = projectDomain;

function projectDomain (domain, fields, isExcept) {
  fields = Object.keys(fields);
  var projectObject = isExcept
                    ? objectExcept
                    : objectWithOnly;
  if (Array.isArray(domain)) {
    return domain.map( function (doc) {
      return projectObject(doc, fields);
    });
  }

  var out = {};
  for (var k in domain) {
    out[k] = projectObject(domain[k], fields);
  }
  return out;
}
});

require.define("/node_modules/derby/node_modules/racer/lib/queries/util.js",function(require,module,exports,__dirname,__filename,process){var QueryBuilder = require('./QueryBuilder')
  , MemoryQuery = require('./MemoryQuery')
  , indexOf = require('../util').indexOf
  , PRIVATE_COLLECTION = '_$queries';

module.exports = {
  resultPointerPath: resultPointerPath
, setupQueryModelScope: setupQueryModelScope
};


function resultPointerPath (queryId, queryType) {
  var pathSuffix = (queryType === 'findOne')
                 ? 'resultId'
                 : 'resultIds';
  return PRIVATE_COLLECTION + '.' + queryId + '.' + pathSuffix;
}

function resultRefPath (queryId, queryType) {
  var pathSuffix = (queryType === 'findOne')
                 ? 'result'
                 : 'results';
  return PRIVATE_COLLECTION + '.' + queryId + '.' + pathSuffix;
}

/**
 * Given a model, query, and the query's initial result(s), this function sets
 * up and returns a scoped model that is centered on a ref or refList that
 * embodies the query result(s) and updates those result(s) whenever a relevant
 * mutation should change the query result(s).
 *
 * @param {Model} model is the racer model
 * @param {MemoryQuery} memoryQuery or a TransformBuilder that has
 * MemoryQuery's syncRun interface
 * @param {[Object]|Object} initialResult is either an array of documents or a
 * single document that represents the initial result of the query over the
 * data currently loaded into the model.
 * @return {Model} a refList or ref scoped model that represents the query result(s)
 */
function setupQueryModelScope (model, memoryQuery, queryId, initialResult) {
  var queryType = memoryQuery.type
    , refPath = resultRefPath(queryId, queryType)
    , pointerPath = resultPointerPath(queryId, queryType)
    , ns = memoryQuery.ns
    , scopedModel;

  // Refs, assemble!
  switch (queryType) {
    case 'findOne':
      // TODO Test findOne single query result
      if (initialResult) {
        model.set(pointerPath, initialResult.id);
      }

      scopedModel = model.ref(refPath, ns, pointerPath);

      var listener = createMutatorListener(model, pointerPath, ns, scopedModel, memoryQuery);
      model.on('mutator', listener);
      break;

    case 'find':
    default:
      if (initialResult) {
        model.set(pointerPath, initialResult.map( function (doc) {
          return doc.id;
        }));
      }

      scopedModel = model.refList(refPath, ns, pointerPath);

      var listener = createMutatorListener(model, pointerPath, ns, scopedModel, memoryQuery);
      model.on('mutator', listener);
  }
  return scopedModel;
}

/**
 * Returns true if `prefix` is a prefix of `path`. Otherwise, returns false.
 * @param {String} prefix
 * @param {String} path
 * @return {Boolean}
 */
function isPrefixOf (prefix, path) {
  return path.substring(0, prefix.length) === prefix;
}

// TODO Re-factor createMutatorListener
/**
 * Creates a listener of the 'mutator' event, for find and findOne queries.
 * See the JSDocDoc of the function iniside the block to see what this listener
 * does.
 *
 * @param {Model} model is the racer model
 * @param {String} pointerPath is the path to the refList key
 * @param {String} ns is the query namespace that points to the set of data we
 * wish to query
 * @param {Model} scopedModel is the scoped model that is scoped to the query
 * results
 * @param {Object} queryTuple is [ns, {queryMotif: queryArgs}, queryId]
 * @return {Function} a function to be used as a listener to the "mutator"
 * event emitted by model
 */
function createMutatorListener (model, pointerPath, ns, scopedModel, memoryQuery) {
  /**
   * This function will listen to the "mutator" event emitted by the model. The
   * purpose of listening for "mutator" here is to respond to changes to the
   * set of documents that the relevant query queries over to derive its search
   * results. Hence, the mutations it listens for are mutations on its search
   * domain, where that domain can be an Object of documents or an Array of documents.
   *
   * @param {String} method name
   * @param {Arguments} _arguments are the arguments for a given "mutator" event listener.
   * The arguments have the signature [[path, restOfMutationArgs...], out, isLocal, pass]
   */

  return function (method, _arguments) {
    var path = _arguments[0][0];

    // Ignore any irrelevant paths. Because any mutation on any object causes
    // model to fire a "mutator" event, we will want to ignore most of these
    // mutator events because our listener is only concerned about mutations
    // under ns, i.e., under our search domain.
    if (! isPrefixOf(ns, path)) return;

    // From here on:  path = ns + suffix

    var currResult = scopedModel.get()

    // The documents this query searches over, either as an Array or Object of
    // documents. This set of documents reflects that the mutation has already
    // taken place.
      , searchSpace = model.get(ns);

    var callbacks;
    switch (memoryQuery.type) {
      case 'find':
        // All of these callbacks are semantically relative to our search
        // space. Hence, onAddDoc means a listener for the event when a
        // document is added to the search space to query.
        callbacks = {
          onRemoveNs: function () {
            model.set(pointerPath, []);
          }

          // TODO Deal with either array of docs or tree of docs
        , onOverwriteNs: function (docs, each) {
            model.set(pointerPath, []);
            each(docs, function (doc) {
              if (memoryQuery.filterTest(doc, ns)) {
                callbacks.onAddDoc(doc);
              }
            });
          }

        , onAddDoc: function (newDoc, oldDoc) {
            if (!oldDoc) {
              // If the new doc belongs in our query results...
              if (memoryQuery.filterTest(newDoc, ns)) {
                insertDocAsPointer(memoryQuery._comparator, model, pointerPath, currResult, newDoc);
              }

            // Otherwise, we are over-writing oldDoc with newDoc
            } else {
              callbacks.onUpdateDocProperty(newDoc);
            }
          }

        , onRmDoc: function (oldDoc) {
            // If the doc is no longer in our data, but our results have a reference to
            // it, then remove the reference to the doc.
            var pos = model.get(pointerPath).indexOf(oldDoc.id);
            if (~pos) model.remove(pointerPath, pos, 1);
          }

        , onUpdateDocProperty: function (doc) {
            var id = doc.id
              , pos = model.get(pointerPath).indexOf(id);
            // If the updated doc belongs in our query results...
            if (memoryQuery.filterTest(doc, ns)) {
              // ...and it is already recorded in our query result.
              if (~pos) {
                // Then, figure out if we need to re-order our results
                var resortedResults = currResult.sort(memoryQuery._comparator)
                  , newPos = indexOf(resortedResults, id, equivId);
                if (pos === newPos) return;
                return model.move(pointerPath, pos, newPos, 1);
              }

              // ...or it is not recorded in our query result
              return insertDocAsPointer(memoryQuery._comparator, model, pointerPath, currResult, doc);
            }

            // Otherwise, if the doc does not belong in our query results, but
            // it did belong to our query results prior to mutation...
            if (~pos) model.remove(pointerPath, pos, 1);
          }
        };
        break;
      case 'findOne':
        var equivFindQuery = new MemoryQuery(Object.create(memoryQuery.toJSON(), {
              type: { value: 'find' }
            }))

          , docsAdded = [currResult]

        callbacks = {
          onRemoveNs: function () {
            model.set(pointerPath, null);
          }

          // In this case, docs is the same as searchSpace.
        , onOverwriteNs: function (docs) {
            var results = equivFindQuery.syncRun(docs);
            if (results.length) {
              model.set(pointerPath, results[0]);
            } else {
              model.set(pointerPath, null);
            }
          }

        , onAddDoc: function (newDoc, oldDoc) {
            docsAdded.push(newDoc);
          }

        , onRmDoc: function (oldDoc) {
            if (oldDoc.id === (currResult && currResult.id)) {
              var results = equivFindQuery.syncRun(searchSpace);
              if (!results.length) return;
              model.set(pointerPath, results[0].id);
            }
          }

        , onUpdateDocProperty: function (doc) {
            if (! memoryQuery.filterTest(doc, ns)) {
              if (currResult.id !== doc.id) return;
              var results = equivFindQuery.syncRun(searchSpace);
              if (results.length) {
                return model.set(pointerPath, results[0].id);
              }
              return model.set(pointerPath, null);
            }
            var comparator = memoryQuery._comparator
              , comparison = comparator(doc, currResult);
            if (comparison < 0) model.set(pointerPath, doc.id);
          }

        , done: function () {
            if (docsAdded.length > 1) {
              docsAdded = docsAdded.sort(memoryQuery._comparator);
              model.set(pointerPath, docsAdded[0].id);
            }
          }
        };
        break;

      default:
        throw new TypeError();
    }

    var isSearchOverArray = Array.isArray(searchSpace);
    var handleMutation = (isSearchOverArray)
                       ? handleDocArrayMutation
                       : handleDocTreeMutation;

    handleMutation(model, method, _arguments, ns, searchSpace, callbacks);
  };
}

/**
 * Fires callbacks by analyzing how model[method](_arguments...) has affected
 * a query searching over the Array of documents pointed to by ns.
 * @param {Model} model
 * @param {String} method
 * @param {Arguments} _arguments
 * @param {String} ns
 * @param {[Object]} docArray is the post-mutation array of documents to which ns points
 * @param {Object} callbacks
 */
function handleDocArrayMutation (model, method, _arguments, ns, docArray, callbacks) {
  var Model = model.constructor
    , args = _arguments[0]
    , path = args[0]
    , out = _arguments[1]
    , done = callbacks.done;

  var handled = handleNsMutation(model, method, path, args, out, ns, callbacks, function (docs, cb) {
    for (var i = docs.length; i--; ) cb(docs[i]);
  });

  if (handled) return done && done();

  handled = handleDocMutation(method, path, args, out, ns, callbacks);

  if (handled) return done && done();

  // Handle mutation on a path inside a document that is an immediate child of the namespace
  var suffix = path.substring(ns.length + 1)
    , separatorPos = suffix.indexOf('.')
    , index = parseInt(suffix.substring(0, ~separatorPos ? separatorPos : suffix.length), 10)
    , doc = docArray && docArray[index];
  if (doc) callbacks.onUpdateDocProperty(doc);
  done && done();
}

function handleDocTreeMutation (model, method, _arguments, ns, docTree, callbacks) {
  var Model = model.constructor
    , args = _arguments[0]
    , path = args[0]
    , out = _arguments[1]
    , done = callbacks.done;

  var handled = handleNsMutation(model, method, path, args, out, ns, callbacks, function (docs, cb) {
    for (var k in docs) cb(docs[k]);
  });

  if (handled) return done && done();

  handled = handleDocMutation(method, path, args, out, ns, callbacks);

  if (handled) return done && done();


  // Handle mutation on a path inside a document that is an immediate child of the namespace
  var suffix = path.substring(ns.length + 1)
    , separatorPos = suffix.indexOf('.')
    , id = suffix.substring(0, ~separatorPos ? separatorPos : suffix.length)
    , doc = docTree && docTree[id];
  if (doc) callbacks.onUpdateDocProperty(doc);
  done && done();
}

/**
 * Handle mutation directly on the path to a document that is an immediate
 * child of the namespace.
 */
function handleDocMutation (method, path, args, out, ns, callbacks) {
  // Or directly on the path to a document that is an immediate child of the namespace
  if (path.substring(ns.length + 1).indexOf('.') !== -1) return false;

  // The mutation can:
  switch (method) {
    // (1) remove the document
    case 'del':
      callbacks.onRmDoc(out);
      break;

    // (2) add or over-write the document with a new version of the document
    case 'set':
    case 'setNull':
      callbacks.onAddDoc(args[1], out);
      break;

    default:
      throw new Error('Uncaught edge case');
  }
  return true;
}

/**
 * Handle occurrence when the mutation occured directly on the namespace
 */
function handleNsMutation (model, method, path, args, out, ns, callbacks, iterator) {
  var Model = model.constructor;

  if (path !== ns) return false;
  switch (method) {
    case 'del': callbacks.onRemoveNs(); break;

    case 'set':
    case 'setNull':
      callbacks.onOverwriteNs(args[1], iterator);
      break;

    case 'push':
    case 'insert':
    case 'unshift':
      var docsToAdd = args[Model.arrayMutator[method].insertArgs]
        , onAddDoc = callbacks.onAddDoc;
      if (Array.isArray(docsToAdd)) for (var i = docsToAdd.length; i--; ) {
        onAddDoc(docsToAdd[i]);
      } else {
        onAddDoc(docsToAdd);
      }
      break;

    case 'pop':
    case 'shift':
    case 'remove':
      var docsToRm = out
        , onRmDoc = callbacks.onRmDoc;
      for (var i = docsToRm.length; i--; ) {
        onRmDoc(docsToRm[i]);
      }
      break;

    case 'move': // TODO is this the right thing for move?
      var movedIds = out
        , onUpdateDocProperty = callbacks.onUpdateDocProperty
        , docs = model.get(path);
        ;
      for (var i = movedIds.length; i--; ) {
        var id = movedIds[i], doc;
        // TODO Ugh, this is messy
        if (Array.isArray(docs)) {
          doc = docs[indexOf(docs, id, equivId)];
        } else {
          doc = docs[id];
        }
        onUpdateDocProperty(doc);
      }
      break;

    default:
      throw new Error('Uncaught edge case');
  }
  return true;
}

/**
 * @param {Function} comparator is the sort comparator function of the query
 * @param {Model} model is the racer model
 * @param {String} pointerPath is the path where the list of pointers (i.e.,
 * document ids) to documents resides
 * @param {[Object]} currResults is the array of documents representing the
 * results as cached prior to the mutation.
 * @param {Object} doc is the document we want to insert into our query results
 */
function insertDocAsPointer (comparator, model, pointerPath, currResults, doc) {
  if (!comparator) {
    return model.insert(pointerPath, currResults.length, doc.id);
  }
  for (var k = currResults.length; k--; ) {
    var currRes = currResults[k]
      , comparison = comparator(doc, currRes);
    if (comparison >= 0) {
      return model.insert(pointerPath, k+1, doc.id);
    }
  }
  return model.insert(pointerPath, 0, doc.id);
}

function equivId (id, doc) {
  return doc.id === id;
}
});

require.define("/node_modules/derby/node_modules/racer/lib/pubSub/index.js",function(require,module,exports,__dirname,__filename,process){var mixinModel = require('./pubSub.Model')
  , mixinStore = __dirname + '/pubSub.Store';

exports = module.exports = function (racer) {
  racer.mixin(mixinModel, mixinStore);
};

exports.useWith = { server: true, browser: true };
exports.decorate = 'racer';
});

require.define("/node_modules/derby/node_modules/racer/lib/pubSub/pubSub.Model.js",function(require,module,exports,__dirname,__filename,process){var transaction = require('../transaction')
  , path = require('../path')
  , expandPath = path.expand
  , splitPath = path.split
  , QueryBuilder = require('../queries/QueryBuilder')
  , noop = require('../util').noop
  ;

module.exports = {
  type: 'Model'

, events: {
    init: function (model) {
      // `_pathSubs` remembers path subscriptions.
      // This memory is useful when the client may have been
      // disconnected from the server for quite some time and needs to re-send
      // its subscriptions upon re-connection in order for the server (1) to
      // figure out what data the client needs to re-sync its snapshot and (2)
      // to re-subscribe to the data on behalf of the client. The paths and
      // queries get cached in Model#subscribe.
      model._pathSubs  = {}; // path -> Boolean
    }

  , bundle: function (model, addToBundle) {
      addToBundle('_loadSubs', model._pathSubs, model._querySubs());
    }

  , socket: function (model, socket) {
      var memory = model._memory;

      // The "addDoc" event is fired whenever a remote mutation results in a
      // new or existing document in the cloud to become a member of one of the
      // result sets corresponding to a query that this model is currently subscribed.
      socket.on('addDoc', function (payload, num) {
        var data = payload.data
          , doc = data.doc
          , ns  = data.ns
          , ver = data.ver
          , txn = data.txn
          , collection = memory.get(ns);

        // If the doc is already in the model, don't add it
        if (collection && collection[doc.id]) {
          // But apply the transaction that resulted in the document that is
          // added to the query result set.
          return model._addRemoteTxn(txn, num);
        }

        var pathToDoc = ns + '.' + doc.id
          , txn = transaction.create({
                ver: ver
              , id: null
              , method: 'set'
              , args: [pathToDoc, doc]
            });
        model._addRemoteTxn(txn, num);
        model.emit('addDoc', pathToDoc, doc);
      });

      // The "rmDoc" event is fired wheneber a remote mutation results in an
      // existing document in the cloud ceasing to become a member of one of
      // the result sets corresponding to a query that this model is currently
      // subscribed.
      socket.on('rmDoc', function (payload, num) {
        var hash = payload.channel // TODO Remove
          , data = payload.data
          , doc  = data.doc
          , id   = data.id
          , ns   = data.ns
          , ver  = data.ver

            // TODO Maybe just [clientId, queryId]
          , queryTuple = data.q; // TODO Add q to data

        // Don't remove the doc if any other queries match the doc
        var querySubs = model._querySubs();
        for (var i = querySubs.length; i--; ) {
          var currQueryTuple = querySubs[i];

          var memoryQuery = model.registeredMemoryQuery(currQueryTuple);

          // If "rmDoc" was triggered by the same query, we expect it not to
          // match the query, so ignore it.
          if (QueryBuilder.hash(memoryQuery.toJSON()) === hash.substring(3, hash.length)) continue;

          // If the doc belongs in an existing subscribed query's result set,
          // then don't remove it, but instead apply a "null" transaction to
          // make sure the transaction counter `num` is acknowledged, so other
          // remote transactions with a higher counter can be applied.
          if (memoryQuery.filterTest(doc, ns)) {
            return model._addRemoteTxn(null, num);
          }
        }

        var pathToDoc = ns + '.' + id
          , txn = transaction.create({
                ver: ver
              , id: null
              , method: 'del'
              , args: [pathToDoc]
            })
          , oldDoc = model.get(pathToDoc);
        model._addRemoteTxn(txn, num);
        model.emit('rmDoc', pathToDoc, oldDoc);
      });
    }
  }

, proto: {
    _loadSubs: function (pathSubs, querySubList) {
      this._pathSubs = pathSubs;

      var querySubs = this._querySubs();
      for (var i = querySubs.length; i--; ) {
        var queryTuple = querySubs[i];
        this.registerQuery(queryTuple, 'subs');
      }
    }

  , _querySubs: function () {
      return this._queryRegistry.lookupWithTag('subs');
    }

  , subscribe: function (/* targets..., callback */) {
      var arglen = arguments.length
        , lastArg = arguments[arglen-1]
        , callback = (typeof lastArg === 'function') ? lastArg : noop
        , targets = Array.prototype.slice.call(arguments, 0, callback ? arglen-1 : arglen)

        , pathSubs = this._pathSubs
        , querySubs = this._querySubs();
      this._compileTargets(targets, {
        eachQueryTarget: function (queryTuple, targets) { /* this === model */
          this.registerQuery(queryTuple, 'subs');
        }
      , eachPathTarget: function (path, targets) { /* this === model */
          if (path in pathSubs) return;
          pathSubs[path] = true;
        }
      , done: function (targets, modelScopes) { /* this === model */
          if (! targets.length) {
            return callback.apply(this, [null].concat(modelScopes));
          }
          var self = this;
          this._addSub(targets, function (err, data) {
            if (err) return callback(err);
            self._addData(data);
            self.emit('addSubData', data);
            callback.apply(self, [null].concat(modelScopes));
          });
        }
      });
    }

  , unsubscribe: function (/* targets..., callback */) {
      var arglen = arguments.length
        , lastArg = arguments[arglen-1]
        , callback = (typeof lastArg === 'function') ? lastArg : noop
        , targets = Array.prototype.slice.call(arguments, 0, callback ? arglen-1 : arglen)

        , pathSubs = this._pathSubs
        , querySubs = this._querySubs();

      this._compileTargets(targets, {
        eachQueryTarget: function (queryJson) { /* this === model */
          var hash = QueryBuilder.hash(queryJson);
          if (! (hash in querySubs)) return;
          this.unregisterQuery(hash, querySubs);
        }
      , eachPathTarget: function (path, targets) { /* this === model */
          if (! (path in pathSubs)) return;
          delete pathSubs[path];
        }
      , done: function (targets) { /* this === model */
          if (! targets.length) return callback();
          this._removeSub(targets, callback);
        }
      });
    }

  , _addSub: function (targets, cb) {
      if (! this.connected) return cb('disconnected');
      this.socket.emit('addSub', targets, cb);
    }

  , _removeSub: function (targets, cb) {
      if (! this.connected) return cb('disconnected');
      this.socket.emit('removeSub', targets, cb);
    }

  , _subs: function () {
      var subs = Object.keys(this._pathSubs)
        , querySubs = this._querySubs();
      for (var i = querySubs.length; i--; ) {
        var queryTuple = querySubs[i];
        subs.push(queryTuple);
      }
      return subs;
    }
  }

, server: {
    _addSub: function (targets, cb) {
      var store = this.store;
      this._clientIdPromise.on( function (err, clientId) {
        if (err) return cb(err);
        // Subscribe while the model still only resides on the server.
        // The model is unsubscribed before sending to the browser.
        var mockSocket = { clientId: clientId };
        store.subscribe(mockSocket, targets, cb);
      });
    }

  , _removeSub: function (targets, cb) {
      var store = this.store;
      this._clientIdPromises.on( function (err, clientId) {
        if (err) return cb(err);
        var mockSocket = { clientId: clientId };
        store.unsubscribe(mockSocket, targets, cb);
      });
    }
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/computed/index.js",function(require,module,exports,__dirname,__filename,process){var filterMixin = require('./filter.Model');

exports = module.exports = plugin;
exports.decorate = 'racer';
exports.useWith = { server: true, browser: true };

function plugin (racer) {
  racer.mixin(filterMixin);
}
});

require.define("/node_modules/derby/node_modules/racer/lib/computed/filter.Model.js",function(require,module,exports,__dirname,__filename,process){var TransformBuilder = require('../queries/TransformBuilder');

module.exports = {
  type: 'Model'
, proto: {
    /**
     * @param {String|Model} source
     * @param {Object} filterSpec
     */
    filter: function (source, filterSpec) {
      var builder = new TransformBuilder(this._root, source.path ? source.path() : source);
      if (filterSpec) builder.filter(filterSpec);
      return builder;
    }
  , sort: function (source, sortParams) {
      var builder = new TransformBuilder(this._root, source);
      builder.sort(sortParams);
      return builder;
    }
  }
};

var mixinProto = module.exports.proto;

for (var k in mixinProto) {
  scopeFriendly(mixinProto, k);
}

function scopeFriendly (object, method) {
  var old = object[method];
  object[method] = function (source, params) {
    var at = this._at;
    if (at) {
      if (typeof source === 'string') {
        source = at + '.' + source;
      } else {
        params = source;
        source = at;
      }
    }
    return old.call(this, source, params);
  }
}

});

require.define("/node_modules/derby/node_modules/racer/lib/queries/index.js",function(require,module,exports,__dirname,__filename,process){var modelMixin = require('./query.Model')
  , storeMixin = __dirname + '/query.Store';

exports = module.exports = plugin;

exports.useWith = { server: true, browser: true };
exports.decorate = 'racer';

function plugin (racer) {
  racer.mixin(modelMixin, storeMixin);
};
});

require.define("/node_modules/derby/node_modules/racer/lib/queries/query.Model.js",function(require,module,exports,__dirname,__filename,process){var EventEmitter = require('events').EventEmitter
  , QueryBuilder = require('./QueryBuilder')
  , QueryRegistry = require('./QueryRegistry')
  , QueryMotifRegistry = require('./QueryMotifRegistry')
  , path = require('../path')
  , splitPath = path.split
  , expandPath = path.expand
  , queryUtils = require('./util')
  , setupQueryModelScope = queryUtils.setupQueryModelScope
  ;

module.exports = {
  type: 'Model'
, events: {
    init: function (model) {
      var store = model.store
      if (store) {
        // Maps query motif -> callback
        model._queryMotifRegistry = store._queryMotifRegistry;
      } else {
        // Stores any query motifs registered via store.query.expose. The query
        // motifs declared via Store are copied over to all child Model
        // instances created via Store#createModel
        model._queryMotifRegistry = new QueryMotifRegistry;
      }

      // The query registry stores any queries associated with the model via
      // Model#fetch and Model#subscribe
      model._queryRegistry = new QueryRegistry;
    }

    // TODO Re-write this
  , bundle: function (model) {
      var queryMotifRegistry = model._queryMotifRegistry
        , queryMotifBundle = queryMotifRegistry.toJSON();
      model._onLoad.push(['_loadQueryMotifs', queryMotifBundle]);
    }
  }
, proto: {

    /**
     * @param {Array} queryTuple
     * @return {Object} json representation of the query
     * @api protected
     */
    queryJSON: function (queryTuple) {
      return this._queryMotifRegistry.queryJSON(queryTuple);
    }

    /**
     * Called when loading the model bundle. Loads queries defined by store.query.expose
     *
     * @param {Object} queryMotifBundle is the bundled form of a
     * QueryMotifRegistry, that was packaged up by the server Model and sent
     * down with the initial page response.
     * @api private
     */
  , _loadQueryMotifs: function (queryMotifBundle) {
      this._queryMotifRegistry = QueryMotifRegistry.fromJSON(queryMotifBundle);
    }

    /**
     * Registers queries to which the model is subscribed.
     *
     * @param {Array} queryTuple
     * @param {String} tag to label the query
     * @return {Boolean} true if registered; false if already registered
     * @api protected
     */
  , registerQuery: function (queryTuple, tag) {
      var queryRegistry = this._queryRegistry
        , queryId = queryRegistry.add(queryTuple) ||
                    queryRegistry.queryId(queryTuple)
        , tagged = tag && queryRegistry.tag(queryId, tag);
      return tagged || queryId;
    }

    /**
     * If no tag is provided, removes queries that we do not care to keep around anymore.
     * If a tag is provided, we only untag the query.
     *
     * @param {Array} queryTuple of the form [motifName, queryArgs...]
     * @param {Object} index mapping query hash -> Boolean
     * @return {Boolean}
     * @api protected
     */
  , unregisterQuery: function (queryTuple, tag) {
      var queryRegistry = this._queryRegistry;
      if (tag) {
        var queryId = queryRegistry.queryId(queryTuple);
        return queryRegistry.untag(queryId, tag);
      }
      return queryRegistry.remove(queryTuple);
    }

    /**
     * Locates a registered query.
     *
     * @param {String} motifName
     * @return {MemoryQuery|undefined} the registered MemoryQuery matching the queryRepresentation
     * @api protected
     */
  , registeredMemoryQuery: function (queryTuple) {
      return this._queryRegistry.memoryQuery(queryTuple, this._queryMotifRegistry);
    }

  , registeredQueryId: function (queryTuple) {
      return this._queryRegistry.queryId(queryTuple);
    }

    /**
     * Convenience method for generating [motifName, queryArgs...] tuples to
     * pass to Model#subscribe and Model#fetch.
     *
     * Example:
     *
     *     var query = model.fromQueryMotif('todos', 'forUser', 'someUserId');
     *     model.subscribe(query, function (err, todos) {
     *       console.log(todos.get());
     *     });
     *
     * @param {String} motifName
     * @param @optional {Object} queryArgument1
     * @param @optional {Object} ...
     * @param @optional {Object} queryArgumentX
     * @return {Array} a tuple of [null, motifName, queryArguments...]
     * @api public
     */
  , fromQueryMotif: function (/* motifName, queryArgs... */) {
      return [null].concat(Array.prototype.slice.call(arguments, 0));
    }

    /**
     * Convenience method for generating [ns, [motifName, queryArgs...],
     * [motifName, queryArgs...]] tuples to pass to Model#subscribe and
     * Model#fetch via a fluent, chainable interface.
     *
     * Example:
     *
     *     var query = model.query('todos').forUser('1');
     *     model.subscribe(query, function (err, todos) {
     *       console.log(todos.get());
     *     });
     *
     * @param {String} ns
     * @return {Object} a query tuple builder
     * @api public
     */
  , query: function (ns) {
      return this._queryMotifRegistry.queryTupleBuilder(ns);
    }

    /**
     * fetch(targets..., callback)
     * Fetches targets which represent a set of paths, path patterns, and/or
     * queries.
     *
     * @param {String|Array} targets[0] representing a path, path pattern, or query
     * @optional @param {String|Array} targets[1] representing a path, path pattern,
     *                                 or query
     * @optional @param {String|Array} ...
     * @optional @param {String|Array} targets[k] representing a path, path pattern,
     *                                 or query
     * @param {Function} callback
     * @api public
     */
  , fetch: function () {
      var arglen = arguments.length
        , lastArg = arguments[arglen-1]
        , callback = (typeof lastArg === 'function') ? lastArg : noop
        , targets = Array.prototype.slice.call(arguments, 0, callback ? arglen-1 : arglen);

      this._compileTargets(targets, {
        done: function (targets, scopedModels) { /* this === model */
          var self = this;
          self._waitOrFetchData(targets, function (err, data) {
            self._addData(data);
            callback.apply(null, [err].concat(scopedModels));
          });
        }
      });
    }

  , _addData: function (data) {
      var memory = this._memory
        , data = data.data;
      for (var i = data.length; i--; ) {
        var triplet = data[i]
          , path = triplet[0]
          , value = triplet[1]
          , ver = triplet[2];
        memory.set(path, value, ver);
      }
    }

    /**
     * Fetches the path and/or query targets and passes the result(s) to the callback.
     *
     * @param {Array} targets are an Array of paths and/or queries
     * @param {Function} callback(err, data, ver) where data is an array of
     * pairs of the form [path, dataAtPath]
     * @api protected
     */
  , _waitOrFetchData: function (targets, callback) {
      if (!this.connected) return callback('disconnected');
      this.socket.emit('fetch', targets, callback);
    }

    /**
     * @param {Array} targets have members who are either Strings representing
     * paths or path patterns OR Arrays representing query tuples of the form
     * [motifName, queryArgs...]
     * @param {Object} opts
     * @api private
     */
  , _compileTargets: function (targets, opts) {
      var done = opts.done /* done(targets) or done(targets, scopes) */
        , compileScopedModels = (done.length === 2)
        , parser = new EventEmitter
        , expandedTargets = []
        , model = this;

      var eachPathTarget = opts.eachPathTarget;
      parser.on('path', function (path) {
        eachPathTarget && eachPathTarget.call(model, path);
        // TODO push unexpanded target or expanded path?
        expandedTargets.push(path);
      });

      var eachQueryTarget = opts.eachQueryTarget;
      parser.on('query', function (queryTuple) {
        eachQueryTarget && eachQueryTarget.call(model, queryTuple);
        expandedTargets.push(queryTuple);
      });

      if (compileScopedModels) {
        // Compile the list of model scopes representative of the fetched
        // results to pass back to opts.done
        var scopedModels = [];
        parser.on('pattern', function (pattern) {
          // TODO This does not always calc pathUpToGlob
          var pathUpToGlob = splitPath(pattern)[0]
            , scopedModel = model.at(pathUpToGlob);
          scopedModels.push(scopedModel);
        });
        parser.on('query', function (queryTuple) {
          var memoryQuery = model.registeredMemoryQuery(queryTuple)
            , queryId = model.registeredQueryId(queryTuple)
            , scopedModel = setupQueryModelScope(model, memoryQuery, queryId);
          scopedModels.push(scopedModel);
        });
        parser.on('done', function () {
          done.call(model, expandedTargets, scopedModels);
        });
      } else {
        parser.on('done', function () {
          done.call(model, expandedTargets);
        });
      }

      parseTargets(parser, targets);
    }
  }

, server: {
    _waitOrFetchData: function (targets, cb) {
      var store = this.store;
      this._clientIdPromise.on( function (err, clientId) {
        if (err) return cb(err);
        store.fetch(clientId, targets, cb);
      });
    }
  }
};

/**
 * Parses targets into full set of targets. In particular, patterns need to be
 * expanded into paths. As it's parsing, it emits events:
 *
 * - "pattern" for every target that is a path pattern
 * - "path" for every path that belongs to a set of paths derived from a
 *   pattern target
 * - "query" for every target that is a query tuple
 *
 * @param {EventEmitter} parser
 * @param {Array} targets is an array of strings (representing paths and/or
 * patterns) and/or query tuples (i.e., arrays of the form [motifName,
 * queryArgs...]
 */
function parseTargets (parser, targets) {
  for (var i = 0, l = targets.length; i < l; i++) {
    var target = targets[i];

    if (Array.isArray(target)) { /* If target is a query tuple */
      parser.emit('query', target);
    } else if (target.tuple) {
      parser.emit('query', target.tuple);
    } else { /* Else target is a path or model scope */
      if (target._at) target = target._at;
      parser.emit('pattern', target);
      var paths = expandPath(target);
      for (var k = paths.length; k--; ) {
        parser.emit('path', paths[k]);
      }
    }
  }
  parser.emit('done');
}
});

require.define("/node_modules/derby/node_modules/racer/lib/queries/QueryRegistry.js",function(require,module,exports,__dirname,__filename,process){// TODO Update queryTuple comments to include queryId as queryTuple[0]

var deepEqual = require('../util').deepEqual
  , objectExcept = require('../path').objectExcept
  , MemoryQuery = require('./MemoryQuery');

module.exports = QueryRegistry;

/**
 * QueryRegistry is used by Model to keep track of queries and their metadata.
 */
function QueryRegistry () {
  // Maps queryId ->
  //        id: queryId
  //        tuple: [ns, {<queryMotif>: queryArgs, ...}, queryId]
  //        query: <# MemoryQuery>
  //        tags: [tags...]
  //
  // Note that the `query` property is lazily created via QueryRegistry#memoryQuery
  this._queries = {};

  // Maps ns -> [queryIds...]
  this._queryIdsByNs = {};

  // Maps tag -> [queryIds...]
  // This is used for quick lookup of queries by tag
  this._queryIdsByTag = {};

  this._nextId = 1;
  var self = this;
  this._nextQueryId = function () {
    return (self._nextId++).toString();
  }
}

/**
 * Creates a QueryRegistry instance from json that has been generated from
 * QueryBuilder#toJSON
 *
 * @param {Object} json
 * @param {Object} queryMotifRegistry contains all registered query motifs
 * @return {QueryRegistry}
 * @api public
 */
QueryRegistry.fromJSON = function (json, queryMotifRegistry) {
  var registry = new QueryRegistry
    , queryIdsByNs = registry._queryIdsByNs
    , queryIdsByTag = registry._queryIdsByTag
    , maxQueryId = 0;

  registry._queries = json;

  for (var queryId in json) {
    var curr = json[queryId]
      , queryTuple = curr.tuple
      , ns = queryTuple[0];

    // Re-construct queryIdsByNs index
    var queryIds = queryIdsByNs[ns] || (queryIdsByNs[ns] = []);
    queryIds.push(queryId);

    // Re-construct queryIdsByTag index
    var tags = curr.tags;
    for (var i = tags.length; i--; ) {
      var tag = tags[i]
        , taggedQueryIds = queryIdsByTag[tag] ||
                          (queryIdsByTag[tag] = []);
      if (-1 === taggedQueryIds.indexOf(queryId)) {
        taggedQueryIds.push(queryId);
      }
    }

    // Keep track of a max queryId, so we can assign the _nextQueryId upon the
    // next call to QueryRegistry#add
    maxQueryId = Math.max(maxQueryId, parseInt(queryId, 10));
  }
  registry._nextId = ++maxQueryId;
  return registry;
};

QueryRegistry.prototype = {
  toJSON: function () {
    var queries = this._queries
      , json = {};
    for (var queryId in queries) {
      // Ignore the MemoryQuery instance
      json[queryId] = objectExcept(queries[queryId], 'query');
    }
    return json;
  }

  /**
   * Adds a query to the registry.
   *
   * @param {Array} queryTuple is [ns, [queryMotif, queryArgs...], ...]
   * @return {String|null} the query id if add succeeds. null if add fails.
   * @api public
   */
, add: function (queryTuple) {
    var queryId = this.queryId(queryTuple);
    if (queryId) return null;

    queryId = queryTuple[queryTuple.length] = this._nextQueryId();

    this._queries[queryId] = {
      id: queryId
    , tuple: queryTuple
    , tags: []
    };

    var ns = queryTuple[0]
      , queryIdsByNs = this._queryIdsByNs
      , queryIds = queryIdsByNs[ns] || (queryIdsByNs[ns] = []);
    queryIds.push(queryId);

    return queryId;
  }

  /**
   * Removes a query from the registry.
   *
   * @param {Array} queryTuple
   * @return {Boolean} true if remove succeeds. false if remove fails.
   * @api public
   */
, remove: function (queryTuple) {
    // TODO Return proper Boolean value
    var queries = this._queries
      , queryId = this.queryId(queryTuple)
      , meta = queries[queryId];

    // Clean up tags
    var tags = meta.tags
      , queryIdsByTag = this._queryIdsByTag;
    for (var i = tags.length; i--; ) {
      var tag = tags[i]
        , queryIds = queryIdsByTag[tag];
      queryIds.splice(queryIds.indexOf(queryId), 1);
      if (! queryIds.length) delete queryIdsByTag[tag];
    }

    // Clean up queryIdsByNs index
    var ns = queryTuple[0]
      , queryIdsByNs = this._queryIdsByNs
      , queryIds = queryIdsByNs[ns]
      , queryId = queryTuple[queryTuple.length - 1];
    queryIds.splice(queryIds.indexOf(queryId));
    if (! queryIds.length) delete queryIdsByNs[ns];

    // Clean up queries
    delete queries[queryId];
  }

  /**
   * Looks up a query in the registry.
   *
   * @param {Array} queryTuple of the form [queryMotif, queryArgs...]
   * @api public
   */
, lookup: function (queryTuple) {
    var queryId = this.queryId(queryTuple);
    return this._queries[queryId];
  }

  /**
   * Returns the queryId of the queryTuple
   *
   * @param {Array} queryTuple
   */
, queryId: function (queryTuple) {
    var last = queryTuple[queryTuple.length - 1];
    if (typeof last === 'string') return last;

    var ns = queryTuple[0]
      , queryIds = this._queryIdsByNs[ns]
      , queries = this._queries;
    if (!queryIds) return null;
    for (var i = queryIds.length; i--; ) {
      var queryId = queryIds[i]
        , tuple = queries[queryId].tuple;
      // Rm the queryId at the end
      tuple = tuple.slice(0, tuple.length-1);
      if (deepEqual(tuple, queryTuple)) {
        return queryId;
      }
    }
    return null;
  }

  /**
   * @param {Array} queryTuple
   * @param {QueryMotifRegistry} queryMotifRegistry
   * @return {MemoryQuery}
   * @api public
   */
, memoryQuery: function (queryTuple, queryMotifRegistry) {
    var meta = this.lookup(queryTuple)
      , memoryQuery = meta.query;
    if (memoryQuery) return memoryQuery;

    var queryJson = queryMotifRegistry.queryJSON(queryTuple);
    if (! queryJson.type) queryJson.type = 'find';
    return meta.query = new MemoryQuery(queryJson);
  }

  /**
   * Tags a query registered in the registry as queryId. The QueryRegistry can
   * then look up query tuples by tag via Query#lookupWithTag.
   *
   * @param {String} queryId
   * @param {String} tag
   * @return {Boolean}
   * @api public
   */
, tag: function (queryId, tag) {
    var queryIdsByTag = this._queryIdsByTag
      , queryIds = queryIdsByTag[tag] ||
                  (queryIdsByTag[tag] = []);
    if (-1 === queryIds.indexOf(queryId)) {
      queryIds.push(queryId);
      return true;
    }
    return false;
  }

  /**
   * Untags a query registered in the registry as queryId. This will change
   * the query tuple results returned by Query#lookupWithTag.
   *
   * @param {String} queryId
   * @param {String} tag
   * @return {Boolean}
   * @api public
   */
, untag: function (queryId, tag) {
    var queryIdsByTag = this._queryIdsByTag;
    if (! (tag in queryIdsByTag)) return false;
    var queryIds = queryIdsByTag[tag]
      , pos = queryIds.indexOf(queryId);
    if (pos === -1) return false;
    queryIds.splice(pos, 1);
    if (! queryIds.length) delete queryIdsByTag[tag];
    return true;
  }

  /**
   * Returns all registered query tuples that have been tagged with the given
   * tag.
   *
   * @param {String} tag
   * @return {Array} array of query tuples
   * @api public
   */
, lookupWithTag: function (tag) {
    var queryIdsByTag = this._queryIdsByTag
      , queryIds = queryIdsByTag[tag]
      , queries = this._queries
      , found = [];
    if (queryIds) {
      for (var i = 0, l = queryIds.length; i < l; i++) {
        var currId = queryIds[i];
        found.push(queries[currId].tuple);
      }
    }
    return found;
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/queries/QueryMotifRegistry.js",function(require,module,exports,__dirname,__filename,process){var QueryBuilder = require('./QueryBuilder')
  , bundleUtils = require('../bundle/util')
  , bundledFunction = bundleUtils.bundledFunction
  , unbundledFunction = bundleUtils.unbundledFunction
  ;

module.exports = QueryMotifRegistry;

/**
 * Instantiates a `QueryMotifRegistry`. The instance is used by Model and Store
 * to add query motifs and to generate QueryBuilder instances with the
 * registered query motifs.
 */
function QueryMotifRegistry () {
  // Contains the query motifs declared without a ns.
  // An example this._noNs might look like:
  //     this._noNs = {
  //       motifNameK: callbackK
  //     , motifNameL: callbackL
  //     };
  // This would have been generated via:
  //     this.add('motifNameK', callbackK);
  //     this.add('motifNameL', callbackL);
  this._noNs = {};

  // Contains the query motifs declared with an ns.
  // An example this._byNs might look like:
  //     this._byNs = {
  //       nsA: {
  //         motifNameX: callbackX
  //       , motifNameY: callbackY
  //       }
  //     , nsB: {
  //         motifNameZ: callbackZ
  //       }
  //     };
  // This would have been generated via:
  //     this.add('nsA', 'motifNameX', callbackX);
  //     this.add('nsA', 'motifNameY', callbackY);
  //     this.add('nsB', 'motifNameZ', callbackZ);
  this._byNs = {};

  // An index of factory methods that generate query representations of the form:
  //
  //     { tuple: [ns, {motifName: queryArgs}]}
  //
  // This generated query representation prototypically inherits from
  // this._tupleFactories[ns] in order to compose queries from > 1 query
  // motifs in a chained manner.
  //
  // An example this._tupleFactories might look like:
  //
  //     this._tupleFactories = {
  //       nsA: {
  //         motifNameX: factoryX
  //       }
  //     }
  this._tupleFactories = {};
}

/**
 * Creates a QueryMotifRegistry instance from json that has been generated from
 * QueryMotifRegistry#toJSON
 *
 * @param {Object} json
 * @return {QueryMotifRegistry}
 * @api public
 */
QueryMotifRegistry.fromJSON = function (json) {
  var registry = new QueryMotifRegistry
    , byNs = registry._byNs
    , noNs = registry._noNs = json['*'];

  _register(registry, noNs);

  delete json['*'];
  for (var ns in json) {
    var callbacksByName = json[ns];
    _register(registry, callbacksByName, ns);
  }
  return registry;
};

function _register (registry, callbacksByName, ns) {
  for (var motifName in callbacksByName) {
    var callbackStr = callbacksByName[motifName]
      , callback = unbundledFunction(callbackStr);
    if (ns) registry.add(ns, motifName, callback);
    else    registry.add(motifName, callback);
  }
}

QueryMotifRegistry.prototype ={
  /**
   * Registers a query motif.
   *
   * @optional @param {String} ns is the namespace
   * @param {String} motifName is the name of the nquery motif
   * @param {Function} callback
   * @api public
   */
  add: function (ns, motifName, callback) {
    if (arguments.length === 2) {
      callback = motifName;
      motifName = ns
      ns = null;
    }
    var callbacksByName;
    if (ns) {
      var byNs = this._byNs;
      callbacksByName = byNs[ns] || (byNs[ns] = Object.create(this._noNs));
    } else {
      callbacksByName = this._noNs;
    }
    if (callbacksByName.hasOwnProperty(motifName)) {
      throw new Error('There is already a query motif "' + motifName + '"');
    }
    callbacksByName[motifName] = callback;

    var tupleFactories = this._tupleFactories;
    tupleFactories = tupleFactories[ns] || (tupleFactories[ns] = {});

    tupleFactories[motifName] = function addToTuple () {
      var args = Array.prototype.slice.call(arguments);
      this.tuple[1][motifName] = args;
      return this;
    };
  }

  /**
   * Unregisters a query motif.
   *
   * @optional @param {String} ns is the namespace
   * @param {String} motifName is the name of the query motif
   * @api public
   */
, remove: function (ns, motifName) {
    if (arguments.length === 1) {
      motifName = ns
      ns = null;
    }
    var callbacksByName
      , tupleFactories = this._tupleFactories;
    if (ns) {
      var byNs = this._byNs;
      callbacksByName = byNs[ns];
      if (!callbacksByName) return;
      tupleFactories = tupleFactories[ns];
    } else {
      callbacksByName = this.noNs;
    }
    if (callbacksByName.hasOwnProperty(motifName)) {
      delete callbacksByName[motifName];
      if (ns && ! Object.keys(callbacksByName).length) {
        delete byNs[ns];
      }
      delete tupleFactories[motifName];
      if (! Object.keys(tupleFactories).length) {
        delete this._tupleFactories[ns];
      }
    }
  }

  /**
   * Returns an object for composing queries in a chained manner where the
   * chainable methods are named after query motifs registered with a ns.
   *
   * @param {String} ns
   * @return {Object}
   */
, queryTupleBuilder: function (ns) {
    var tupleFactories = this._tupleFactories[ns];
    return Object.create(tupleFactories, {
      tuple: { value: [ns, {}] }
    });
  }

  /**
   * Returns a json representation of the query, based on queryTuple and which
   * query motifs happen to be registered at the moment via past calls to
   * QueryMotifRegistry#add.
   *
   * @param {Array} queryTuple is [ns, {motifName: queryArgs}, queryId]
   * @return {Object}
   * @api public
   */
, queryJSON: function (queryTuple) {
    var ns = queryTuple[0]
      , queryComponents = queryTuple[1]
      , callbacksByName = this._byNs[ns]
      , queryBuilder = new QueryBuilder({from: ns});

    for (var motifName in queryComponents) {
      var callback = callbacksByName
                   ? callbacksByName[motifName]
                   : this._noNs[motifName];
      if (! callback) return null;
      var queryArgs = queryComponents[motifName];
      callback.apply(queryBuilder, queryArgs);
    }
    return queryBuilder.toJSON();
  }

  /**
   * Returns a JSON representation of the registry.
   *
   * @return {Object} JSON representation of `this`
   * @api public
   */
, toJSON: function () {
    var json = {}
      , noNs = this._noNs
      , byNs = this._byNs;

    // Copy over query motifs not specific to a namespace
    var curr = json['*'] = {};
    for (var k in noNs) {
      curr[k] = noNs[k].toString();
    }

    // Copy over query motifs specific to a namespace
    for (var ns in byNs) {
      curr = json[ns] = {};
      var callbacks = byNs[ns];
      for (k in callbacks) {
        var cb = callbacks[k];
        curr[k] = bundledFunction(cb);
      }
    }

    return json;
  }
}
});

require.define("/node_modules/derby/node_modules/racer/lib/txns/index.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var exports, mixinModel, mixinStore;

mixinModel = require('./txns.Model');

mixinStore = __dirname + '/txns.Store';

exports = module.exports = function(racer) {
  return racer.mixin(mixinModel, mixinStore);
};

exports.useWith = {
  server: true,
  browser: true
};

exports.decorate = 'racer';
});

require.define("/node_modules/derby/node_modules/racer/lib/txns/txns.Model.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var Memory, Promise, RESEND_INTERVAL, SEND_TIMEOUT, Serializer, arrayMutator, isPrivate, mergeTxn, specCreate, transaction,
  __slice = [].slice;

Memory = require('../Memory');

Promise = require('../util/Promise');

Serializer = require('../Serializer');

transaction = require('../transaction');

isPrivate = require('../path').isPrivate;

specCreate = require('../util/speculative').create;

mergeTxn = require('./diff').mergeTxn;

arrayMutator = null;

module.exports = {
  type: 'Model',
  "static": {
    SEND_TIMEOUT: SEND_TIMEOUT = 10000,
    RESEND_INTERVAL: RESEND_INTERVAL = 2000
  },
  events: {
    mixin: function(Model) {
      return arrayMutator = Model.arrayMutator, Model;
    },
    init: function(model) {
      var after, before, bundlePromises, memory, specCache, txnQueue, txns;
      if (bundlePromises = model._bundlePromises) {
        bundlePromises.push(model._txnsPromise = new Promise);
      }
      model._specCache = specCache = {
        invalidate: function() {
          delete this.data;
          return delete this.lastTxnId;
        }
      };
      model._count.txn = 0;
      model._txns = txns = {};
      model._txnQueue = txnQueue = [];
      model._removeTxn = function(txnId) {
        var i;
        delete txns[txnId];
        if (~(i = txnQueue.indexOf(txnId))) {
          txnQueue.splice(i, 1);
          specCache.invalidate();
        }
      };
      memory = model._memory;
      before = new Memory;
      after = new Memory;
      return model._onTxn = function(txn) {
        var isLocal, txnQ, ver;
        if (txn == null) {
          return;
        }
        if (txnQ = txns[transaction.getId(txn)]) {
          txn.callback = txnQ.callback;
          txn.emitted = txnQ.emitted;
        }
        isLocal = 'callback' in txn;
        ver = transaction.getVer(txn);
        if (ver > memory.version || ver === -1) {
          model._applyTxn(txn, isLocal);
        }
      };
    },
    bundle: function(model) {
      model._txnsPromise.on(function(err) {
        var clientId, store;
        if (err) {
          throw err;
        }
        clientId = model._clientId;
        if (store = model.store) {
          store._unregisterLocalModel(clientId);
        } else {
          console.warn("ALREADY UNREGISTERED SERVER MODEL");
          console.trace();
        }
        return store._startTxnBuffer(clientId);
      });
      model._specModel();
      if (model._txnQueue.length) {
        model.__removeTxn__ || (model.__removeTxn__ = model._removeTxn);
        model._removeTxn = function(txnId) {
          var len;
          model.__removeTxn__(txnId);
          len = model._txnQueue.length;
          model._specModel();
          if (len) {
            return;
          }
          return process.nextTick(function() {
            return model._txnsPromise.resolve();
          });
        };
        return;
      }
      return model._txnsPromise.resolve();
    },
    socket: function(model, socket) {
      var addRemoteTxn, commit, memory, onTxn, removeTxn, resend, resendInterval, setupResendInterval, teardownResendInterval, txnApplier, txnQueue, txns;
      memory = model._memory, txns = model._txns, txnQueue = model._txnQueue, removeTxn = model._removeTxn, onTxn = model._onTxn;
      socket.on('snapshotUpdate:replace', function(data, num) {
        var toReplay, txn, txnId, _i, _len;
        toReplay = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {
            txnId = txnQueue[_i];
            _results.push(txns[txnId]);
          }
          return _results;
        })();
        txnQueue.length = 0;
        model._txns = txns = {};
        model._specCache.invalidate();
        txnApplier.clearPending();
        if (num != null) {
          txnApplier.setIndex(num + 1);
        }
        memory.eraseNonPrivate();
        model._addData(data);
        model.emit('reInit');
        for (_i = 0, _len = toReplay.length; _i < _len; _i++) {
          txn = toReplay[_i];
          model[transaction.getMethod(txn)].apply(model, transaction.getArgs(txn));
        }
      });
      socket.on('snapshotUpdate:newTxns', function(newTxns, num) {
        var id, txn, _i, _j, _len, _len1;
        for (_i = 0, _len = newTxns.length; _i < _len; _i++) {
          txn = newTxns[_i];
          onTxn(txn);
        }
        txnApplier.clearPending();
        if (num != null) {
          txnApplier.setIndex(num + 1);
        }
        for (_j = 0, _len1 = txnQueue.length; _j < _len1; _j++) {
          id = txnQueue[_j];
          commit(txns[id]);
        }
      });
      txnApplier = new Serializer({
        withEach: onTxn,
        onTimeout: function() {
          if (!model.connected) {
            return;
          }
          return socket.emit('fetchCurrSnapshot', memory.version + 1, model._startId, model._subs());
        }
      });
      resendInterval = null;
      resend = function() {
        var id, now, txn, _i, _len;
        now = +(new Date);
        model._specModel();
        for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {
          id = txnQueue[_i];
          txn = txns[id];
          if (!txn || txn.timeout > now) {
            return;
          }
          commit(txn);
        }
      };
      setupResendInterval = function() {
        return resendInterval || (resendInterval = setInterval(resend, RESEND_INTERVAL));
      };
      teardownResendInterval = function() {
        if (resendInterval) {
          clearInterval(resendInterval);
        }
        return resendInterval = null;
      };
      if (model.connected) {
        setupResendInterval();
      } else {
        model.once('connect', function() {
          return setupResendInterval();
        });
      }
      socket.on('disconnect', function() {
        return teardownResendInterval();
      });
      model._addRemoteTxn = addRemoteTxn = function(txn, num) {
        if (num != null) {
          return txnApplier.add(txn, num);
        } else {
          return onTxn(txn);
        }
      };
      socket.on('txn', addRemoteTxn);
      socket.on('txnOk', function(txnId, ver, num) {
        var txn;
        if (!(txn = txns[txnId])) {
          return;
        }
        transaction.setVer(txn, ver);
        return addRemoteTxn(txn, num);
      });
      socket.on('txnErr', function(err, txnId) {
        var callback, callbackArgs, txn;
        txn = txns[txnId];
        if (txn && (callback = txn.callback)) {
          if (transaction.isCompound(txn)) {
            callbackArgs = transaction.ops(txn);
          } else {
            callbackArgs = transaction.copyArgs(txn);
          }
          callbackArgs.unshift(err);
          callback.apply(null, callbackArgs);
        }
        return removeTxn(txnId);
      });
      return model._commit = commit = function(txn) {
        if (txn.isPrivate) {
          return;
        }
        txn.timeout = +(new Date) + SEND_TIMEOUT;
        if (!model.connected) {
          return;
        }
        return socket.emit('txn', txn, model._startId);
      };
    }
  },
  server: {
    _commit: function(txn) {
      var _this = this;
      if (txn.isPrivate) {
        return;
      }
      return this.store._commit(txn, function(err, txn) {
        if (err) {
          console.error("The following error occured for " + txn);
          console.error(err);
          return _this._removeTxn(transaction.getId(txn));
        }
        return _this._onTxn(txn);
      });
    }
  },
  proto: {
    force: function() {
      return Object.create(this, {
        _force: {
          value: true
        }
      });
    },
    _commit: function() {},
    _asyncCommit: function(txn, callback) {
      var id;
      if (!this.connected) {
        return callback('disconnected');
      }
      txn.callback = callback;
      id = transaction.getId(txn);
      this._txns[id] = txn;
      return this._commit(txn);
    },
    _nextTxnId: function() {
      return this._clientId + '.' + this._count.txn++;
    },
    _queueTxn: function(txn, callback) {
      var id;
      txn.callback = callback;
      id = transaction.getId(txn);
      this._txns[id] = txn;
      return this._txnQueue.push(id);
    },
    _getVersion: function() {
      if (this._force) {
        return null;
      } else {
        return this._memory.version;
      }
    },
    _addOpAsTxn: function(method, args, callback) {
      var arr, id, out, path, txn, ver;
      this.emit('beforeTxn', method, args);
      if ((path = args[0]) == null) {
        return;
      }
      ver = this._getVersion();
      id = this._nextTxnId();
      txn = transaction.create({
        ver: ver,
        id: id,
        method: method,
        args: args
      });
      txn.isPrivate = isPrivate(path);
      txn.emitted = args.cancelEmit;
      if (method === 'pop') {
        txn.push((arr = this.get(path) || null) && (arr.length - 1));
      } else if (method === 'unshift') {
        txn.push((this.get(path) || null) && 0);
      }
      this._queueTxn(txn, callback);
      out = this._specModel().$out;
      if (method === 'push') {
        txn.push(out - args.length + 1);
      }
      this._commit(txn);
      args = args.slice();
      if (!txn.emitted) {
        this.emit(method, args, out, true, this._pass);
        txn.emitted = true;
      }
      return out;
    },
    _applyTxn: function(txn, isLocal) {
      var callback, data, doEmit, isCompound, op, ops, out, txnId, ver, _i, _len;
      if (txnId = transaction.getId(txn)) {
        this._removeTxn(txnId);
      }
      data = this._memory._data;
      doEmit = !txn.emitted;
      ver = Math.floor(transaction.getVer(txn));
      if (isCompound = transaction.isCompound(txn)) {
        ops = transaction.ops(txn);
        for (_i = 0, _len = ops.length; _i < _len; _i++) {
          op = ops[_i];
          this._applyMutation(transaction.op, op, ver, data, doEmit, isLocal);
        }
      } else {
        out = this._applyMutation(transaction, txn, ver, data, doEmit, isLocal);
      }
      if (callback = txn.callback) {
        if (isCompound) {
          callback.apply(null, [null].concat(__slice.call(transaction.ops(txn))));
        } else {
          callback.apply(null, [null].concat(__slice.call(transaction.getArgs(txn)), [out]));
        }
      }
      return out;
    },
    _applyMutation: function(extractor, txn, ver, data, doEmit, isLocal) {
      var args, method, out, patch, _i, _len, _ref;
      out = extractor.applyTxn(txn, data, this._memory, ver);
      if (doEmit) {
        if (patch = txn.patch) {
          for (_i = 0, _len = patch.length; _i < _len; _i++) {
            _ref = patch[_i], method = _ref.method, args = _ref.args;
            this.emit(method, args, null, isLocal, this._pass);
          }
        } else {
          method = transaction.getMethod(txn);
          args = transaction.getArgs(txn);
          this.emit(method, args, out, isLocal, this._pass);
          txn.emitted = true;
        }
      }
      return out;
    },
    _specModel: function() {
      var cache, data, i, lastTxnId, len, op, ops, out, replayFrom, txn, txnQueue, txns, _i, _len;
      txns = this._txns;
      txnQueue = this._txnQueue;
      while ((txn = txns[txnQueue[0]]) && txn.isPrivate) {
        out = this._applyTxn(txn, true);
      }
      if (!(len = txnQueue.length)) {
        data = this._memory._data;
        data.$out = out;
        return data;
      }
      cache = this._specCache;
      if (lastTxnId = cache.lastTxnId) {
        if (cache.lastTxnId === txnQueue[len - 1]) {
          return cache.data;
        }
        data = cache.data;
        replayFrom = 1 + txnQueue.indexOf(cache.lastTxnId);
      } else {
        replayFrom = 0;
      }
      if (!data) {
        data = cache.data = specCreate(this._memory._data);
      }
      i = replayFrom;
      while (i < len) {
        txn = txns[txnQueue[i++]];
        if (transaction.isCompound(txn)) {
          ops = transaction.ops(txn);
          for (_i = 0, _len = ops.length; _i < _len; _i++) {
            op = ops[_i];
            this._applyMutation(transaction.op, op, null, data);
          }
        } else {
          out = this._applyMutation(transaction, txn, null, data);
        }
      }
      cache.data = data;
      cache.lastTxnId = transaction.getId(txn);
      data.$out = out;
      return data;
    },
    branch: function() {}
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/Serializer.js",function(require,module,exports,__dirname,__filename,process){/**
 * Given a stream of out of order messages and an index, Serializer figures out
 * what messages to handle immediately and what messages to buffer and defer
 * handling until later, if the incoming message has to wait first for another
 * message.
 */

var DEFAULT_EXPIRY = 1000; // milliseconds

// TODO Respect Single Responsibility -- place waiter code elsewhere
module.exports = Serializer;

function Serializer (options) {
  this.withEach = options.withEach;
  var onTimeout = this.onTimeout = options.onTimeout
    , expiry = this.expiry = options.expiry;

  if (onTimeout && ! expiry) {
    this.expiry = DEFAULT_EXPIRY;
  }

  // Maps future indexes -> messages
  this._pending = {};

  var init = options.init;
  // Corresponds to ver in Store and txnNum in Model
  this._index = (init != null)
              ? init
              : 1;
}

Serializer.prototype = {
  _setWaiter: function () {
    if (!this.onTimeout || this._waiter) return;
    var self = this;
    this._waiter  = setTimeout( function () {
      self.onTimeout();
      self._clearWaiter();
    }, this.expiry);
  }

, _clearWaiter: function () {
    if (! this.onTimeout) return;
    if (this._waiter) {
      clearTimeout(this._waiter);
      delete this._waiter;
    }
  }

, add: function (msg, msgIndex, arg) {
    // Cache this message to be applied later if it is not the next index
    if (msgIndex > this._index) {
      this._pending[msgIndex] = msg;
      this._setWaiter();
      return true;
    }

    // Ignore this message if it is older than the current index
    if (msgIndex < this._index) return false;

    // Otherwise apply it immediately
    this.withEach(msg, this._index++, arg);
    this._clearWaiter();

    // And apply any messages that were waiting for txn
    var pending = this._pending;
    while (msg = pending[this._index]) {
      this.withEach(msg, this._index, arg);
      delete pending[this._index++];
    }
    return true;
  }

, setIndex: function (index) {
    this._index = index;
  }

, clearPending: function () {
    var index = this._index
      , pending = this._pending;
    for (var i in pending) {
      if (i < index) delete pending[i];
    }
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/txns/diff.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var deepCopy, diffArrays, eventRegExp, lookup, transaction, txnEffect, _ref;

diffArrays = require('../diffMatchPatch').diffArrays;

_ref = require('../path'), eventRegExp = _ref.eventRegExp, lookup = _ref.lookup;

deepCopy = require('../util').deepCopy;

transaction = require('../transaction');

module.exports = {
  txnEffect: txnEffect = function(txn, method, args) {
    var ins, num, rem;
    switch (method) {
      case 'push':
        ins = transaction.getMeta(txn);
        num = args.length - 1;
        break;
      case 'unshift':
        ins = 0;
        num = args.length - 1;
        break;
      case 'insert':
        ins = args[1];
        num = args.length - 2;
        break;
      case 'pop':
        rem = transaction.getMeta(txn);
        num = 1;
        break;
      case 'shift':
        rem = 0;
        num = 1;
        break;
      case 'remove':
        rem = args[1];
        num = args[2];
        break;
      case 'move':
        ins = args[1];
        rem = args[2];
        num = 1;
    }
    return [ins, rem, num];
  },
  mergeTxn: function(txn, txns, txnQueue, arrayMutator, memory, before, after) {
    var afterData, args, argsQ, arr, arrPath, arraySubPath, beforeData, diff, i, id, ins, isArrayMutator, item, match, method, methodQ, num, op, parent, parentPath, patch, patchConcat, path, pathQ, prop, rem, remainder, resetPaths, root, txnQ, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref1, _ref2, _results;
    path = transaction.getPath(txn);
    method = transaction.getMethod(txn);
    args = transaction.getArgs(txn);
    if (isArrayMutator = arrayMutator[method]) {
      _ref1 = txnEffect(txn, method, args), ins = _ref1[0], rem = _ref1[1], num = _ref1[2];
      arraySubPath = eventRegExp("(" + path + ".(\\d+)).*");
    }
    beforeData = before._data;
    afterData = after._data;
    resetPaths = [];
    patchConcat = [];
    for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {
      id = txnQueue[_i];
      txnQ = txns[id];
      if (txnQ.callback) {
        continue;
      }
      pathQ = transaction.getPath(txnQ);
      if (!transaction.pathConflict(path, pathQ)) {
        continue;
      }
      methodQ = transaction.getMethod(txnQ);
      if (isArrayMutator || arrayMutator[methodQ]) {
        if (!arrPath) {
          if (isArrayMutator) {
            arrPath = path;
          } else {
            arraySubPath = eventRegExp("(" + pathQ + ".\\d+).*");
            if ((match = arraySubPath.exec(path)) && (typeof memory.get(match[1]) === 'object')) {
              continue;
            }
            arrPath = pathQ;
          }
          arr = memory.get(arrPath);
          before.set(arrPath, arr && arr.slice(), 1, beforeData);
          after.set(arrPath, arr && arr.slice(), 1, afterData);
          after[method].apply(after, args.concat(1, afterData));
        }
        argsQ = deepCopy(transaction.getArgs(txnQ));
        if (arraySubPath && (match = arraySubPath.exec(pathQ))) {
          parentPath = match[1];
          i = +match[2];
          if (i >= ins) {
            i += num;
          }
          if (i >= rem) {
            i -= num;
          }
          if (typeof before.get(parentPath) === 'object') {
            resetPaths.push(["" + path + "." + i, match[3]]);
            patchConcat.push({
              method: methodQ,
              args: argsQ
            });
            continue;
          }
        }
        before[methodQ].apply(before, argsQ.concat(1, beforeData));
        after[methodQ].apply(after, argsQ.concat(1, afterData));
      } else {
        txnQ.emitted = false;
      }
    }
    if (arrPath) {
      txn.patch = patch = [];
      diff = diffArrays(before.get(arrPath), after.get(arrPath));
      for (_j = 0, _len1 = diff.length; _j < _len1; _j++) {
        op = diff[_j];
        method = op[0];
        op[0] = arrPath;
        patch.push({
          method: method,
          args: op
        });
      }
      for (_k = 0, _len2 = resetPaths.length; _k < _len2; _k++) {
        _ref2 = resetPaths[_k], root = _ref2[0], remainder = _ref2[1];
        i = remainder.indexOf('.');
        prop = ~i ? remainder.substr(0, i) : remainder;
        if ((parent = after.get(root)) && (prop in parent)) {
          patch.push({
            method: 'set',
            args: ["" + root + "." + remainder, lookup(remainder, parent)]
          });
        } else {
          patch.push({
            method: 'del',
            args: ["" + root + "." + prop]
          });
        }
      }
      _results = [];
      for (_l = 0, _len3 = patchConcat.length; _l < _len3; _l++) {
        item = patchConcat[_l];
        _results.push(patch.push(item));
      }
      return _results;
    }
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/diffMatchPatch.js",function(require,module,exports,__dirname,__filename,process){// Generated by CoffeeScript 1.3.1
var addInsertOrRemove, diffArrays, moveLookAhead,
  __slice = [].slice;

module.exports = {
  diffArrays: function(before, after) {
    var current, inserts, items, moves, op, out, removes, _i, _j, _k, _len, _len1, _len2;
    out = [];
    current = before.slice();
    diffArrays(before, after, removes = [], moves = [], inserts = []);
    while (removes.length || moves.length || inserts.length) {
      out = out.concat(removes, moves, inserts);
      for (_i = 0, _len = removes.length; _i < _len; _i++) {
        op = removes[_i];
        current.splice(op[1], op[2]);
      }
      for (_j = 0, _len1 = moves.length; _j < _len1; _j++) {
        op = moves[_j];
        items = current.splice(op[1], op[3]);
        current.splice.apply(current, [op[2], 0].concat(__slice.call(items)));
      }
      for (_k = 0, _len2 = inserts.length; _k < _len2; _k++) {
        op = inserts[_k];
        current.splice.apply(current, [op[1], 0].concat(__slice.call(op.slice(2))));
      }
      diffArrays(current, after, removes = [], moves = [], inserts = []);
    }
    return out;
  }
};

diffArrays = function(before, after, removes, moves, inserts) {
  var a, afterLen, b, dir, end, from, fromBackward, fromForward, i, index, indexAfter, indexBefore, insert, itemAfter, itemBefore, j, move, moveFrom, num, numBackward, numForward, numInsert, numRemove, offset, op, otherItem, remove, skipA, skipB, to, toBackward, toForward, _i, _j, _k, _l, _len, _len1, _len2, _len3;
  afterLen = after.length;
  a = b = -1;
  skipA = {};
  skipB = {};
  while (a < afterLen) {
    while (skipA[++a]) {
      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);
      insert = remove = null;
    }
    while (skipB[++b]) {
      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);
      insert = remove = null;
    }
    itemAfter = after[a];
    itemBefore = before[b];
    if (itemAfter === itemBefore) {
      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);
      insert = remove = null;
      continue;
    }
    indexAfter = before.indexOf(itemAfter, b);
    while (skipB[indexAfter]) {
      indexAfter = before.indexOf(itemAfter, indexAfter + 1);
    }
    if (a < afterLen && indexAfter === -1) {
      if (insert == null) {
        insert = a;
        numInsert = 0;
      }
      numInsert++;
      b--;
      continue;
    }
    indexBefore = after.indexOf(itemBefore, a);
    while (skipA[indexBefore]) {
      indexBefore = after.indexOf(itemBefore, indexBefore + 1);
    }
    if (indexBefore === -1) {
      if (remove == null) {
        remove = b;
        numRemove = 0;
      }
      numRemove++;
      a--;
      continue;
    }
    addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);
    insert = remove = null;
    fromBackward = indexAfter;
    toBackward = a;
    numBackward = moveLookAhead(before, after, skipA, skipB, afterLen, fromBackward, toBackward, itemBefore);
    fromForward = b;
    toForward = indexBefore;
    otherItem = numBackward === -1 ? NaN : itemAfter;
    numForward = moveLookAhead(before, after, skipA, skipB, afterLen, fromForward, toForward, otherItem);
    dir = numBackward === -1 ? dir = true : numForward === -1 ? dir = false : numForward < numBackward;
    if (dir) {
      from = fromForward;
      to = toForward;
      num = numForward;
      a--;
    } else {
      from = fromBackward;
      to = toBackward;
      num = numBackward;
      b--;
    }
    moves.push(['move', from, to, num]);
    end = from + num;
    while (from < end) {
      skipB[from++] = true;
      skipA[to++] = true;
    }
  }
  offset = 0;
  for (_i = 0, _len = removes.length; _i < _len; _i++) {
    op = removes[_i];
    index = op[1] += offset;
    num = op[2];
    offset -= num;
    for (_j = 0, _len1 = moves.length; _j < _len1; _j++) {
      move = moves[_j];
      if (index < move[1]) {
        move[1] -= num;
      }
    }
  }
  i = inserts.length;
  while (op = inserts[--i]) {
    num = op.length - 2;
    index = op[1];
    for (_k = 0, _len2 = moves.length; _k < _len2; _k++) {
      move = moves[_k];
      if (index <= move[2]) {
        move[2] -= num;
      }
    }
  }
  for (i = _l = 0, _len3 = moves.length; _l < _len3; i = ++_l) {
    op = moves[i];
    from = op[1];
    to = op[2];
    num = op[3];
    j = i;
    while (move = moves[++j]) {
      moveFrom = move[1];
      if (to < moveFrom && from < moveFrom) {
        continue;
      }
      move[1] = from < moveFrom ? moveFrom - num : moveFrom + num;
    }
  }
};

moveLookAhead = function(before, after, skipA, skipB, afterLen, b, a, otherItem) {
  var item, num;
  num = 1;
  if (skipB[b] || skipA[a]) {
    return -1;
  }
  while ((item = before[++b]) === after[++a] && a < afterLen) {
    if (item === otherItem || skipB[b] || skipA[a]) {
      return num;
    }
    num++;
  }
  return num;
};

addInsertOrRemove = function(inserts, removes, after, insert, numInsert, remove, numRemove) {
  if (insert != null) {
    inserts.push(['insert', insert].concat(__slice.call(after.slice(insert, insert + numInsert))));
  }
  if (remove != null) {
    removes.push(['remove', remove, numRemove]);
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/reconnect/index.js",function(require,module,exports,__dirname,__filename,process){var mixinModel = require('./reconnect.Model');

exports = module.exports = plugin;
exports.useWith = {server: true, browser: true};
exports.decorate = 'racer';

function plugin (racer) {
  racer.mixin(mixinModel);
};
});

require.define("/node_modules/derby/node_modules/racer/lib/reconnect/reconnect.Model.js",function(require,module,exports,__dirname,__filename,process){module.exports = {
  type: 'Model'

, events: {
    socket: function (model, socket) {
      var memory = model._memory;
      // When the store asks the browser model to re-sync with the store, then
      // the model should send the store its subscriptions and handle the
      // receipt of instructions to get the model state back in sync with the
      // store state (e.g., in the form of applying missed transaction, or in
      // the form of diffing to a received store state)
      socket.on('resyncWithStore', function (fn) {
        var subs = model._subs();
        fn(model._subs(), memory.version, model._startId);
      });
    }
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/racer.browser.js",function(require,module,exports,__dirname,__filename,process){/** WARNING
 * All racer modules for the browser should be included in racer.coffee and not
 * in this file.
 */

// Static isReady and model variables are used, so that the ready function can
// be called anonymously. This assumes that only one instance of Racer is
// running, which should be the case in the browser.
var IS_READY,
    model;

IS_READY = model = null;

exports = module.exports = plugin;
exports.useWith = { server: false, browser: true };
exports.decorate = 'racer';

function plugin (racer) {
  racer.init = function (tuple, socket) {
    var clientId = tuple[0]
      , memory   = tuple[1]
      , count    = tuple[2]
      , onLoad   = tuple[3]
      , startId  = tuple[4]
      , ioUri    = tuple[5];

    model = new this.protected.Model;
    model._clientId = clientId;
    model._startId  = startId;
    model._memory.init(memory);
    model._count = count;

    for (var i = 0, l = onLoad.length; i < l; i++) {
      var item = onLoad[i]
        , method = item.shift();
      model[method].apply(model, item);
    }

    racer.emit('init', model);

    // TODO If socket is passed into racer, make sure to add clientId query param
    model._setSocket(socket || io.connect(ioUri + '?clientId=' + clientId), {
      'reconnection delay': 100
    , 'max reconnection attempts': 20
    , query: 'clientId=' + clientId
    });

    IS_READY = true;
    racer.emit('ready', model);
    return racer;
  };

  racer.ready = function (onready) {
    return function () {
      if (IS_READY) return onready(model);
      racer.on('ready', onready);
    };
  }
}
});

require.define("/node_modules/derby/lib/component.js",function(require,module,exports,__dirname,__filename,process){var EventEmitter = require('events').EventEmitter
  , path = require('path')
  , merge = require('racer').util.merge
  , View = require('./View')
  , arraySlice = Array.prototype.slice

module.exports = componentPlugin;

function componentPlugin(derby) {
  derby._libraries = [];
  derby._libraries.map = {};
  derby.createLibrary = createLibrary;
}
componentPlugin.decorate = 'derby';


var componentProto = Object.create(EventEmitter.prototype);

componentProto.emitCancellable = function() {
  var cancelled = false
    , args = arraySlice.call(arguments)

  function cancel() {
    cancelled = true;
  }

  args.push(cancel);
  emit.apply(this, args);
  return cancelled;
};


function createLibrary(config, options) {
  if (!config || !config.filename) {
    throw new Error ('Configuration argument with a filename is required');
  }
  if (!options) options = {};
  var root = path.dirname(config.filename)
    , ns = options.ns || config.ns || path.basename(root)
    , scripts = config.scripts || {}
    , view = new View
    , constructors = {}
    , library = {
        ns: ns
      , root: root
      , view: view
      , constructors: constructors
      , styles: config.styles
      }
    , Component, proto;

  view._selfNs = 'lib';

  for (scriptName in scripts) {
    Component = function(model) {
      this.model = model;
    }
    Component.name = scriptName;
    proto = Component.prototype = Object.create(componentProto);
    merge(proto, scripts[scriptName]);
    proto.type = ns + ':' + scriptName;
    proto.view = view;
    // Note that component names are all lowercased
    constructors[scriptName.toLowerCase()] = Component;
  }

  this._libraries.push(library);
  this._libraries.map[ns] = library;
}
});

require.define("/node_modules/derby/lib/View.js",function(require,module,exports,__dirname,__filename,process){var htmlUtil = require('html-util')
  , parseHtml = htmlUtil.parse
  , trimLeading = htmlUtil.trimLeading
  , unescapeEntities = htmlUtil.unescapeEntities
  , escapeHtml = htmlUtil.escapeHtml
  , escapeAttribute = htmlUtil.escapeAttribute
  , isVoid = htmlUtil.isVoid
  , conditionalComment = htmlUtil.conditionalComment
  , lookup = require('racer/lib/path').lookup
  , markup = require('./markup')
  , viewPath = require('./viewPath')
  , wrapRemainder = viewPath.wrapRemainder
  , ctxPath = viewPath.ctxPath
  , extractPlaceholder = viewPath.extractPlaceholder
  , dataValue = viewPath.dataValue
  , pathFnArgs = viewPath.pathFnArgs
  , isBound = viewPath.isBound

module.exports = View;

function empty() {
  return '';
}

function notFound(name, ns) {
  if (ns) name = ns + ':' + name;
  throw new Error("Can't find view: " + name);
}

var defaultCtx = {
  $depth: 0
, $aliases: {}
, $paths: []
, $indices: []
};

var defaultGetFns = {
  equal: function(a, b) {
    return a === b;
  }
, not: function(value) {
    return !value;
  }
, join: function(items, property, separator) {
    var list, i;
    if (!items) return;
    if (property) {
      list = [];
      for (i = items.length; i--;) {
        list[i] = items[i][property];
      }
    } else {
      list = items;
    }
    return list.join(separator || ', ');
  }
};

var defaultSetFns = {
  equal: function(value, a) {
    return value ? [a] : [];
  }
, not: function(value) {
    return [!value];
  }
};

function View(libraries, appExports) {
  this._libraries = libraries || [];
  this._appExports = appExports;
  this._inline = '';
  this.clear();
  this.getFns = Object.create(defaultGetFns);
  this.setFns = Object.create(defaultSetFns);
}
View.prototype = {
  defaultViews: {
    doctype: function() {
      return '<!DOCTYPE html>';
    }
  , root: empty
  , charset: function() {
      return '<meta charset=utf-8>';
    }
  , title$s: empty
  , head: empty
  , header: empty
  , body: empty
  , footer: empty
  , scripts: empty
  , tail: empty
  }

, _selfNs: 'app'

  // All automatically created ids start with a dollar sign
  // TODO: change this since it messes up query selectors unless escaped
, _uniqueId: uniqueId

, clear: clear
, make: make
, _makeAll: makeAll
, _makeComponents: makeComponents
, _findItem: findItem
, _find: find
, get: get
, fn: fn
, render: render
, _afterRender: function(ns, ctx) {
  afterRender(this.dom, this._appExports, ns, ctx);
}

, inline: empty

, escapeHtml: escapeHtml
, escapeAttribute: escapeAttribute
}

function clear() {
  this._views = Object.create(this.defaultViews);
  this._made = {};
  this._renders = {};
  this._idCount = 0;
}

function uniqueId() {
  return '$' + (this._idCount++).toString(36);
}

function make(name, template, options, templatePath, macroAttrs) {
  var view = this
    , onBind, renderer, render, matchTitle, ns, isString;
  // Cache any templates that are made so that they can be
  // re-parsed with different items bound when using macros
  this._made[name] = [template, options, templatePath];

  if (templatePath && (render = this._renders[templatePath])) {
    this._views[name] = render;
    return
  }

  name = name.toLowerCase();
  matchTitle = /(?:^|\:)title(\$s)?$/.exec(name);
  if (matchTitle) {
    isString = !!matchTitle[1];
    if (isString) {
      onBind = function(events, name) {
        var macro = false;
        return bindEvents(events, macro, name, render, ['$_doc', 'prop', 'title']);
      };
    } else {
      this.make(name + '$s', template, options, templatePath);
    }
  }

  renderer = function(ctx, model, triggerPath, triggerId) {
    renderer = parse(view, name, template, isString, onBind, macroAttrs);
    return renderer(ctx, model, triggerPath, triggerId);
  }
  render = function(ctx, model, triggerPath, triggerId) {
    return renderer(ctx, model, triggerPath, triggerId);
  }

  render.nonvoid = options && 'nonvoid' in options;

  this._views[name] = render;
  if (templatePath) this._renders[templatePath] = render;
}

function makeAll(templates, instances) {
  var name, instance, options, templatePath;
  if (!instances) return;
  this.clear();
  for (name in instances) {
    instance = instances[name];
    templatePath = instance[0];
    options = instance[1];
    this.make(name, templates[templatePath], options, templatePath);
  }
}

function makeComponents(components) {
  var librariesMap = this._libraries.map
    , name, component, view;
  for (name in components) {
    component = components[name];
    view = librariesMap[name].view;
    view._makeAll(component.templates, component.instances);
  }
}

function findItem(name, ns, prop) {
  var items = this[prop]
    , item, i, segments, testNs;
  if (ns) {
    ns = ns.toLowerCase();
    item = items[ns + ':' + name];
    if (item) return item;

    segments = ns.split(':');
    for (i = segments.length; i-- > 1;) {
      testNs = segments.slice(0, i).join(':');
      item = items[testNs + ':' + name];
      if (item) return item;
    }
  }
  return items[name];
}

function find(name, ns, macroAttrs) {
  var hash, hashedName, out, item, template, options, templatePath;
  if (macroAttrs && (hash = boundHash(macroAttrs))) {
    hash = '$b(' + hash + ')';
    hashedName = name + hash;
    out = this._findItem(hashedName, ns, '_views');
    if (out) return out;

    item = this._findItem(name, ns, '_made') || notFound(name, ns);
    template = item[0];
    options = item[1];
    templatePath = item[2] + hash;
    this.make(hashedName, template, options, templatePath, macroAttrs);
    return this._find(hashedName, ns);
  }
  return this._findItem(name, ns, '_views') || notFound(name, ns);
}

function get(name, ns, ctx) {
  if (typeof ns === 'object') {
    ctx = ns;
    ns = '';
  }
  ctx = ctx ? extend(ctx, defaultCtx) : Object.create(defaultCtx);
  ctx.$fnCtx = [this._appExports];
  return this._find(name, ns)(ctx);
}

function fn(name, fn) {
  var get, set;
  if (typeof fn === 'object') {
    get = fn.get;
    set = fn.set;
  } else {
    get = fn;
  }
  this.getFns[name] = get;
  if (set) this.setFns[name] = set;
}

function afterRender(dom, app, ns, ctx) {
  dom._emitUpdate();
  app.emit('render', ctx);
  if (ns) app.emit('render:' + ns, ctx);
}

function render(model, ns, ctx, silent) {
  if (typeof ns === 'object') {
    silent = ctx;
    ctx = ns;
    ns = '';
  }
  this.model = model;
  var dom = this.dom
    , app = this._appExports
    , lastRender = this._lastRender

  dom._preventUpdates = true;

  if (lastRender) {
    app.emit('replace', lastRender.ctx);
    if (lastRender.ns) app.emit('replace:' + lastRender.ns, lastRender.ctx);
  }
  this._lastRender = {
    ns: ns
  , ctx: ctx
  };

  this._idCount = 0;
  dom.clear();
  model.__pathMap.clear();
  model.__events.clear();
  model.__blockPaths = {};
  model.del('_$component');

  var title = this.get('title$s', ns, ctx)
    , rootHtml = this.get('root', ns, ctx)
    , bodyHtml = this.get('header', ns, ctx) +
        this.get('body', ns, ctx) +
        this.get('footer', ns, ctx);

  dom._preventUpdates = false;

  if (silent) return;

  var doc = document
    , documentElement = doc.documentElement
    , attrs = documentElement.attributes
    , i, attr, fakeRoot, body;

  // Remove all current attributes on the documentElement and replace
  // them with the attributes in the rendered rootHtml
  for (i = attrs.length; i--;) {
    attr = attrs[i];
    documentElement.removeAttribute(attr.name);
  }
  // Using the DOM to get the attributes on an <html> tag would require
  // some sort of iframe hack until DOMParser has better browser support.
  // String parsing the html should be simpler and more efficient
  parseHtml(rootHtml, {
    start: function(tag, tagName, attrs) {
      if (tagName !== 'html') return;
      for (var attr in attrs) {
        documentElement.setAttribute(attr, attrs[attr]);
      }
    }
  });

  fakeRoot = doc.createElement('html');
  fakeRoot.innerHTML = bodyHtml;
  body = fakeRoot.getElementsByTagName('body')[0];
  documentElement.replaceChild(body, doc.body);
  doc.title = title;

  afterRender(dom, app, ns, ctx);
}


function boundHash(macroAttrs) {
  var keys = []
    , key, value;
  for (key in macroAttrs) {
    value = macroAttrs[key];
    if (value && value.$bound) {
      keys.push(key);
    }
  }
  return keys.sort().join(',');
}

function extend(parent, obj) {
  var out = Object.create(parent)
    , key;
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return out;
  }
  for (key in obj) {
    out[key] = obj[key];
  }
  return out;
}

function modelListener(params, triggerId, blockPaths, pathId, partial, ctx) {
  var listener = typeof params === 'function'
    ? params(triggerId, blockPaths, pathId)
    : params;
  listener.partial = partial;
  listener.ctx = ctx.$stringCtx || ctx;
  return listener;
}

function bindEvents(events, macro, name, partial, params) {
  if (~name.indexOf('(')) {
    var args = pathFnArgs(name);
    if (!args.length) return;
    events.push(function(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId) {
      var listener = modelListener(params, triggerId, blockPaths, null, partial, ctx)
        , path, pathId, i;
      listener.getValue = function(model, triggerPath) {
        patchCtx(ctx, triggerPath);
        return dataValue(view, ctx, model, name, macro);
      }
      for (i = args.length; i--;) {
        path = ctxPath(ctx, args[i], macro);
        pathId = pathMap.id(path + '*');

        modelEvents.ids[path] = listener[0];
        modelEvents.bind(pathId, listener);
      }
    });
    return;
  }

  var match = /(\.*)(.*)/.exec(name)
    , prefix = match[1] || ''
    , relativeName = match[2] || ''
    , segments = relativeName.split('.')
    , bindName, i;
  for (i = segments.length; i; i--) {
    bindName = prefix + segments.slice(0, i).join('.');
    (function(bindName) {
      events.push(function(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId) {
        var path = ctxPath(ctx, name, macro)
          , listener, pathId;
        if (!path) return;
        pathId = pathMap.id(path);
        listener = modelListener(params, triggerId, blockPaths, pathId, partial, ctx);
        if (name !== bindName) {
          path = ctxPath(ctx, bindName, macro);
          pathId = pathMap.id(path);
          listener.getValue = function(model, triggerPath) {
            patchCtx(ctx, triggerPath);
            return dataValue(view, ctx, model, name, macro);
          };
        }

        modelEvents.ids[path] = listener[0];
        modelEvents.bind(pathId, listener);
      });
    })(bindName);
  }
}

function bindEventsById(events, macro, name, partial, attrs, method, prop, isBlock) {
  function params(triggerId, blockPaths, pathId) {
    var id = attrs._id || attrs.id;
    if (isBlock && pathId) blockPaths[id] = pathId;
    return [id, method, prop];
  }
  bindEvents(events, macro, name, partial, params);
}

function bindEventsByIdString(events, macro, name, partial, attrs, method, prop) {
  function params(triggerId) {
    var id = triggerId || attrs._id || attrs.id;
    return [id, method, prop];
  }
  bindEvents(events, macro, name, partial, params);
}

function addId(view, attrs) {
  if (attrs.id == null) {
    attrs.id = function() {
      return attrs._id = view._uniqueId();
    };
  }
}

function pushValue(html, i, value, isAttr, isId) {
  if (typeof value === 'function') {
    var fn = isId ? function(ctx, model) {
      var id = value(ctx, model);
      html.ids[id] = i + 1;
      return id;
    } : value;
    i = html.push(fn, '') - 1;
  } else {
    if (isId) html.ids[value] = i + 1;
    html[i] += isAttr ? escapeAttribute(value) : value;
  }
  return i;
}

function reduceStack(stack) {
  var html = ['']
    , i = 0
    , attrs, bool, item, key, value, j, len;

  html.ids = {};

  for (j = 0, len = stack.length; j < len; j++) {
    item = stack[j];
    switch (item[0]) {
      case 'start':
        html[i] += '<' + item[1];
        attrs = item[2];
        // Make sure that the id attribute is rendered first
        if ('id' in attrs) {
          html[i] += ' id=';
          i = pushValue(html, i, attrs.id, true, true);
        }
        for (key in attrs) {
          if (key === 'id') continue;
          value = attrs[key];
          if (value != null) {
            if (bool = value.bool) {
              i = pushValue(html, i, bool);
              continue;
            }
            html[i] += ' ' + key + '=';
            i = pushValue(html, i, value, true);
          } else {
            html[i] += ' ' + key;
          }
        }
        html[i] += '>';
        break;
      case 'text':
        i = pushValue(html, i, item[1]);
        break;
      case 'end':
        html[i] += '</' + item[1] + '>';
        break;
      case 'marker':
        html[i] += '<!--' + item[1];
        i = pushValue(html, i, item[2].id, false, !item[1]);
        html[i] += '-->';
    }
  }
  return html;
}

function patchCtx(ctx, triggerPath) {
  var path = ctx.$paths[0];
  if (!(triggerPath && path)) return;

  var segments = path.split('.')
    , triggerSegments = triggerPath.replace(/\*$/, '').split('.')
    , indices = ctx.$indices.slice()
    , index = indices.length
    , i, len, segment, triggerSegment, n;
  for (i = 0, len = segments.length; i < len; i++) {
    segment = segments[i];
    triggerSegment = triggerSegments[i];
    // `(n = +triggerSegment) === n` will be false only if segment is NaN
    if (segment === '$#' && (n = +triggerSegment) === n) {
      indices[--index] = n;
    } else if (segment !== triggerSegment) {
      break;
    }
  }
  ctx.$indices = indices;
  ctx.$index = indices[0];
}

function renderer(view, items, events, onRender) {
  return function(ctx, model, triggerPath, triggerId) {
    patchCtx(ctx, triggerPath);

    if (!model) model = view.model;  // Needed, since model parameter is optional
    var pathMap = model.__pathMap
      , modelEvents = model.__events
      , blockPaths = model.__blockPaths
      , idIndices = items.ids
      , dom = view.dom
      , html = []
      , mutated = []
      , onMutator, i, len, item, event, pathIds, id, index;

    if (onRender) ctx = onRender(ctx);

    onMutator = model.on('mutator', function(method, triggerPath) {
      mutated.push(triggerPath)
    });

    for (i = 0, len = items.length; i < len; i++) {
      item = items[i];
      html[i] = (typeof item === 'function') ? item(ctx, model) || '' : item;
    }

    model.removeListener('mutator', onMutator)
    pathIds = modelEvents.ids = {}

    for (i = 0; event = events[i++];) {
      event(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId);
    }

    // This detects when an already rendered bound value was later updated
    // while rendering the rest of the template. This can happen when performing
    // component initialization code.
    // TODO: This requires creating a whole bunch of extra objects every time
    // things are rendered. Should probably be refactored in a less hacky manner.
    for (i = 0, len = mutated.length; i < len; i++) {
      (id = pathIds[mutated[i]]) &&
      (index = idIndices[id]) &&
      (html[index] = items[index](ctx, model) || '')
    }

    return html.join('');
  }
}

function createComponent(view, model, ns, name, scope, ctx, macroCtx, macroAttrs) {
  var library = view._libraries.map[ns]
    , Component = library && library.constructors[name]
  
  if (!Component) return false;

  var dom = view.dom
    , scoped = model.at(scope)
    , prefix = scope + '.'
    , component = new Component(scoped)
    , parentFnCtx = model.__fnCtx || ctx.$fnCtx
    , fnCtx, i, key, path, value, instanceName, parent;

  ctx.$fnCtx = model.__fnCtx = parentFnCtx.concat(component);

  for (key in macroCtx) {
    value = macroCtx[key];
    if (path = value && value.$matchName) {
      path = ctxPath(ctx, path);
      model.ref(prefix + key, path, null, true);
      continue;
    }
    if (typeof value === 'function') value = value(ctx, model);
    model.set(prefix + key, value);
  }

  instanceName = scoped.get('name');

  if (component.init) component.init(scoped);

  parent = true;
  for (i = parentFnCtx.length; fnCtx = parentFnCtx[--i];) {
    if (parent) {
      parent = false;
      fnCtx.emit('init:child', component);
    }
    fnCtx.emit('init:descendant', component);
    if (instanceName) {
      fnCtx.emit('init:' + instanceName, component);
    }
  }

  if (view.isServer) return true;

  dom.nextUpdate(function() {
    var parent = true;
    for (i = parentFnCtx.length; fnCtx = parentFnCtx[--i];) {
      if (parent) {
        parent = false;
        fnCtx.emit('create:child', component);
      }
      fnCtx.emit('create:descendant', component);
      if (instanceName) {
        fnCtx.emit('create:' + instanceName, component);
      }
    }
  });

  if (!component.create) return true;

  dom.nextUpdate(function() {
    // TODO: This is kinda a hack because the component is getting created
    // twice client side. Investigate
    if (!scoped.get()) return;

    var componentDom = component.dom = dom.componentDom(ctx);
    component.create(scoped, componentDom);
  });

  return true;
}

function extendCtx(ctx, value, name, alias, index, isArray, macro) {
  var path = ctxPath(ctx, name, macro, true)
    , aliases;
  ctx = extend(ctx, value);
  ctx['this'] = value;
  if (alias) {
    aliases = ctx.$aliases = Object.create(ctx.$aliases);
    aliases[alias] = [ctx.$depth, ctx.$indices.length];
  }
  if (path) ctx.$paths = [path].concat(ctx.$paths);
  if (name) ctx.$depth++;
  if (index != null) {
    ctx.$indices = [index].concat(ctx.$indices);
    ctx.$index = index;
    isArray = true;
  }
  if (isArray && ctx.$paths[0]) {
    ctx.$paths[0] += '.$#';
  }
  return ctx;
}

function partialValue(view, ctx, model, name, value, listener, macro) {
  if (listener) return value;
  return name ? dataValue(view, ctx, model, name, macro) : true;
}

function partialFn(view, name, type, alias, render, macroCtx, macro, macroAttrs) {
  function conditionalRender(ctx, model, triggerPath, value, index, condition) {
    if (condition) {
      var renderCtx = extendCtx(ctx, value, name, alias, index, false, macro);
      return render(renderCtx, model, triggerPath);
    }
    return '';
  }

  function withFn(ctx, model, triggerPath, triggerId, value, index, listener) {
    value = partialValue(view, ctx, model, name, value, listener, macro);
    return conditionalRender(ctx, model, triggerPath, value, index, true);
  }

  if (type === 'partial') {
    return function(ctx, model, triggerPath, triggerId, value, index, listener) {
      var renderMacroCtx = Object.create(macroCtx)
        , parentMacroCtx = ctx.$macroCtx
        , renderCtx, key, val, scope, out, hasScope;

      for (key in macroCtx) {
        val = macroCtx[key];
        if (val && val.$macroName) {
          val = renderMacroCtx[key] = parentMacroCtx[val.$macroName];
        }
        if (val && val.$matchName) {
          val = renderMacroCtx[key] = Object.create(val)
          val.$matchName = ctxPath(ctx, val.$matchName)
        }
      }
      if (alias) {
        scope = '_$component.' + model.id();
        renderCtx = extendCtx(ctx, null, scope, alias, null, false, macro);
        renderCtx.$startIndex = ctx.$indices.length;
        hasScope = createComponent(view, model, name[0], name[1], scope, renderCtx, renderMacroCtx, macroAttrs);
      } else {
        renderCtx = Object.create(ctx);
      }
      renderCtx.$macroCtx = renderMacroCtx;

      out = render(renderCtx, model, triggerPath);
      if (hasScope) model.__fnCtx = model.__fnCtx.slice(0, -1);
      return out;
    }
  }

  if (type === 'with' || type === 'else') {
    return withFn;
  }

  if (type === 'if' || type === 'else if') {
    return function(ctx, model, triggerPath, triggerId, value, index, listener) {
      value = partialValue(view, ctx, model, name, value, listener, macro);
      var condition = !!(Array.isArray(value) ? value.length : value);
      return conditionalRender(ctx, model, triggerPath, value, index, condition);
    }
  }

  if (type === 'unless') {
    return function(ctx, model, triggerPath, triggerId, value, index, listener) {
      value = partialValue(view, ctx, model, name, value, listener, macro);
      var condition = !(Array.isArray(value) ? value.length : value);
      return conditionalRender(ctx, model, triggerPath, value, index, condition);
    }
  }

  if (type === 'each') {
    return function(ctx, model, triggerPath, triggerId, value, index, listener) {
      var indices, isArray, item, out, renderCtx, i, len;
      value = partialValue(view, ctx, model, name, value, listener, macro);
      isArray = Array.isArray(value);

      if (listener && !isArray) {
        return withFn(ctx, model, triggerPath, triggerId, value, index, true);
      }

      if (!isArray) return '';

      ctx = extendCtx(ctx, null, name, alias, null, true, macro);

      out = '';
      indices = ctx.$indices;
      for (i = 0, len = value.length; i < len; i++) {
        item = value[i];
        renderCtx = extend(ctx, item);
        renderCtx['this'] = item;
        renderCtx.$indices = [i].concat(indices);
        renderCtx.$index = i;
        out += render(renderCtx, model, triggerPath);
      }
      return out;
    }
  }

  throw new Error('Unknown block type: ' + type);
}

var objectToString = Object.prototype.toString;

function textFn(view, name, escape, macro) {
  return function(ctx, model) {
    var value = dataValue(view, ctx, model, name, macro)
      , text = typeof value === 'string' ? value
          : value == null ? ''
          : value.toString === objectToString ? JSON.stringify(value)
          : value.toString();

    // TODO: DRY. This is duplicating logic in dataValue()
    if (macro) {
      value = lookup(name.toLowerCase(), ctx.$macroCtx);
      if (typeof value === 'function' && value.unescaped) {
        return text;
      }
    }
    return escape ? escape(text) : text;
  }
}

function sectionFn(view, queue) {
  var render = renderer(view, reduceStack(queue.stack), queue.events)
    , block = queue.block
    , type = block.type
    , out = partialFn(view, block.name, type, block.alias, render, null, block.macro)
  out.type = type;
  return out;
}

function blockFn(view, sections) {
  var len = sections.length;
  if (!len) return;
  if (len === 1) {
    return sectionFn(view, sections[0]);

  } else {
    var fns = []
      , i, out;
    for (i = 0; i < len; i++) {
      fns.push(sectionFn(view, sections[i]));
    }
    out = function(ctx, model, triggerPath, triggerId, value, index, listener) {
      var out, fn;
      for (i = 0; i < len; i++) {
        fn = fns[i];
        out = fn(ctx, model, triggerPath, triggerId, value, index, listener);
        if (out) return out;
      }
      return '';
    }
    out.type = 'multi';
    return out;
  }
}

function parseMarkup(type, attr, tagName, events, attrs, value) {
  var parser = markup[type][attr]
    , anyOut, anyParser, elOut, elParser, out;
  if (!parser) return;
  if (anyParser = parser['*']) {
    anyOut = anyParser(events, attrs, value);
  }
  if (elParser = parser[tagName]) {
    elOut = elParser(events, attrs, value);
  }
  out = anyOut ? extend(anyOut, elOut) : elOut;
  if (out && out.del) delete attrs[attr];
  return out;
}

function pushText(stack, text) {
  if (text) stack.push(['text', text]);
}

function pushVarFn(view, stack, fn, name, escapeFn, macro) {
  if (fn) {
    pushText(stack, fn);
  } else {
    pushText(stack, textFn(view, name, escapeFn, macro));
  }
}

function isPartial(view, partial) {
  var arr = partial.split(':')
    , partialNs = arr[0];
  return arr.length >= 2 &&
    (partialNs === view._selfNs || !!view._libraries.map[partialNs]);
}

function isPartialSection(tagName) {
  return tagName.charAt(0) === '@';
}

function partialSectionName(tagName) {
  return isPartialSection(tagName) ? tagName.slice(1) : null;
}

function splitPartial(view, partial, ns) {
  var i = partial.indexOf(':')
    , partialNs = partial.slice(0, i)
    , partialName = partial.slice(i + 1)
    , partialView;
  if (partialNs !== view._selfNs) {
    partialView = view._libraries.map[partialNs].view;
    partialView._uniqueId = function() {
      return view._uniqueId();
    };
    partialView.model = view.model;
    partialView.dom = view.dom;
  } else {
    partialView = view;
  }
  return [partialNs, partialName, partialView];
}

function findComponent(view, partial, ns) {
  var arr = splitPartial(view, partial, ns)
    , partialName = arr[1]
    , view = arr[2];
  return view._find(partialName, ns);
}

function isVoidComponent(view, partial, ns) {
  return !findComponent(view, partial, ns).nonvoid;
}

function pushVar(view, ns, stack, events, macroAttrs, remainder, match, fn) {
  var name = match.name
    , partial = match.partial
    , macro = match.macro
    , escapeFn = match.escaped && escapeHtml
    , attr, attrs, boundOut, last, tagName, wrap, render, isBlock;

  if (partial) {
    var arr = splitPartial(view, partial, ns)
      , partialNs = arr[0]
      , partialName = arr[1]
      , alias = partialNs === view._selfNs ? '' : 'self'
    render = arr[2]._find(partialName, ns, macroAttrs);
    fn = partialFn(view, arr, 'partial', alias, render, match.macroCtx, null, macroAttrs);
  }

  else if (isBound(macroAttrs, match)) {
    last = lastItem(stack);
    wrap = match.pre ||
      !last ||
      (last[0] !== 'start') ||
      isVoid(tagName = last[1]) ||
      wrapRemainder(tagName, remainder);

    if (wrap) {
      stack.push(['marker', '', attrs = {}]);
    } else {
      attrs = last[2];
      for (attr in attrs) {
        parseMarkup('boundParent', attr, tagName, events, attrs, match);
      }
      boundOut = parseMarkup('boundParent', '*', tagName, events, attrs, match);
      if (boundOut) {
        bindEventsById(events, macro, name, null, attrs, boundOut.method, boundOut.property);
      }
    }
    addId(view, attrs);

    if (!boundOut) {
      isBlock = !!match.type;
      bindEventsById(events, macro, name, fn, attrs, 'html', !fn && escapeFn, isBlock);
    }
  }

  pushVarFn(view, stack, fn, name, escapeFn, macro);
  if (wrap) {
    stack.push([
      'marker'
    , '$'
    , { id: function() { return attrs._id } }
    ]);
  }
}

function pushVarString(view, ns, stack, events, macroAttrs, remainder, match, fn) {
  var name = match.name
    , escapeFn = !match.escaped && unescapeEntities;
  function bindOnce(ctx) {
    ctx.$onBind(events, name);
    bindOnce = empty;
  }
  if (isBound(macroAttrs, match)) {
    events.push(function(ctx) {
      bindOnce(ctx);
    });
  }
  pushVarFn(view, stack, fn, name, escapeFn, match.macro);
}

function parseMatchError(text, message) {
  throw new Error(message + '\n\n' + text + '\n');
}

function onBlock(start, end, block, queues, callbacks) {
  var lastQueue, queue;
  if (end) {
    lastQueue = queues.pop();
    queue = lastItem(queues);
    queue.sections.push(lastQueue);
  } else {
    queue = lastItem(queues);
  }

  if (start) {
    queue = {
      stack: []
    , events: []
    , block: block
    , sections: []
    , macroAttrs: queue.macroAttrs
    };
    queues.push(queue);
    callbacks.onStart(queue);
  } else {
    if (end) {
      callbacks.onStart(queue);
      callbacks.onEnd(queue.sections);
      queue.sections = [];
    } else {
      callbacks.onContent(block);
    }
  }
}

function parseMatch(text, match, queues, callbacks) {
  var hash = match.hash
    , type = match.type
    , name = match.name
    , block = lastItem(queues).block
    , blockType = block && block.type
    , startBlock, endBlock;

  if (type === 'if' || type === 'unless' || type === 'each' || type === 'with') {
    if (hash === '#') {
      startBlock = true;
    } else if (hash === '/') {
      endBlock = true;
    } else {
      parseMatchError(text, type + ' blocks must begin with a #');
    }

  } else if (type === 'else' || type === 'else if') {
    if (hash) {
      parseMatchError(text, type + ' blocks may not start with ' + hash);
    }
    if (blockType !== 'if' && blockType !== 'else if' &&
        blockType !== 'unless' && blockType !== 'each') {
      parseMatchError(text, type + ' may only follow `if`, `else if`, `unless`, or `each`');
    }
    startBlock = true;
    endBlock = true;

  } else if (hash === '/') {
    endBlock = true;

  } else if (hash === '#') {
    parseMatchError(text, '# must be followed by `if`, `unless`, `each`, or `with`');
  }

  if (endBlock && !block) {
    parseMatchError(text, 'Unmatched template end tag');
  }

  onBlock(startBlock, endBlock, match, queues, callbacks);
}

function parseAttr(view, viewName, events, macroAttrs, tagName, attrs, attr) {
  var value = attrs[attr];
  if (typeof value === 'function') return;

  var attrOut = parseMarkup('attr', attr, tagName, events, attrs, value) || {}
    , boundOut, macro, match, name, render, method, property;
  if (attrOut.addId) addId(view, attrs);

  if (match = extractPlaceholder(value)) {
    name = match.name;
    macro = match.macro;

    if (match.pre || match.post) {
      // Attributes must be a single string, so create a string partial
      addId(view, attrs);
      render = parse(view, viewName, value, true, function(events, name) {
        bindEventsByIdString(events, macro, name, render, attrs, 'attr', attr);
      }, macroAttrs);

      attrs[attr] = attr === 'id' ? function(ctx, model) {
        return attrs._id = escapeAttribute(render(ctx, model));
      } : function(ctx, model) {
        return escapeAttribute(render(ctx, model));
      }
      return;
    }

    if (isBound(macroAttrs, match)) {
      boundOut = parseMarkup('bound', attr, tagName, events, attrs, match) || {};
      addId(view, attrs);
      method = boundOut.method || 'attr';
      property = boundOut.property || attr;
      bindEventsById(events, macro, name, null, attrs, method, property);
    }

    if (!attrOut.del) {
      macro = match.macro;
      attrs[attr] = attrOut.bool ? {
        bool: function(ctx, model) {
          return (dataValue(view, ctx, model, name, macro)) ? ' ' + attr : '';
        }
      } : textFn(view, name, escapeAttribute, macro);
    }
  }
}

function parsePartialAttr(view, viewName, events, attrs, attr) {
  var value = attrs[attr]
    , match, firstChar, lastAttrs, matchName;
  if (attr === 'content') {
    throw new Error('components may not have an attribute named "content"');
  }

  if (!value) return;

  if (match = extractPlaceholder(value)) {
    if (match.pre || match.post) {
      throw new Error('unimplemented: blocks in component attributes');
    }

    matchName = match.name;
    attrs[attr] = match.macro ? {
        $macroName: matchName
      } : {
        $matchName: matchName
      , $bound: match.bound
      }

  } else if (value === 'true') {
    attrs[attr] = true;
  } else if (value === 'false') {
    attrs[attr] = false;
  } else if (value === 'null') {
    attrs[attr] = null;
  } else if (!isNaN(value)) {
    attrs[attr] = +value;
  } else if (/^[{[]/.test(value)) {
    try {
      attrs[attr] = JSON.parse(value)
    } catch (err) {}
  }
}

function lastItem(arr) {
  return arr[arr.length - 1];
};

function parse(view, viewName, template, isString, onBind, macroAttrs) {
  var queues, stack, events, onRender, push;

  queues = [{
    stack: stack = []
  , events: events = []
  , sections: []
  , macroAttrs: macroAttrs
  }];

  function onStart(queue) {
    stack = queue.stack;
    events = queue.events;
    macroAttrs = queue.macroAttrs;
  }

  if (isString) {
    push = pushVarString;
    onRender = function(ctx) {
      if (ctx.$stringCtx) return ctx;
      ctx = Object.create(ctx);
      ctx.$onBind = onBind;
      ctx.$stringCtx = ctx;
      return ctx;
    }
  } else {
    push = pushVar;
  }

  var index = viewName.lastIndexOf(':')
    , ns = ~index ? viewName.slice(0, index) : ''
    , minifyContent = true;

  function parseStart(tag, tagName, attrs) {
    var attr, block, out, parser
    if ('x-no-minify' in attrs) {
      delete attrs['x-no-minify'];
      minifyContent = false;
    } else {
      minifyContent = true;
    }

    if (isPartial(view, tagName)) {
      block = {
        partial: tagName
      , macroCtx: attrs
      };
      onBlock(true, false, block, queues, {onStart: onStart});
      lastItem(queues).macroAttrs = macroAttrs = attrs;

      for (attr in attrs) {
        parsePartialAttr(view, viewName, events, attrs, attr);
      }

      if (isVoidComponent(view, tagName, ns)) {
        onBlock(false, true, null, queues, {
          onStart: onStart
        , onEnd: function(queues) {
            push(view, ns, stack, events, attrs, '', block);
          }
        })
      }
      return;
    }

    if (isPartialSection(tagName)) {
      block = {
        partial: tagName
      , macroCtx: lastItem(queues).block.macroCtx
      };
      onBlock(true, false, block, queues, {onStart: onStart});
      return;
    }

    if (parser = markup.element[tagName]) {
      out = parser(events, attrs);
      if (out != null ? out.addId : void 0) {
        addId(view, attrs);
      }
    }

    for (attr in attrs) {
      parseAttr(view, viewName, events, macroAttrs, tagName, attrs, attr);
    }
    stack.push(['start', tagName, attrs]);
  }

  function parseText(text, isRawText, remainder) {
    var match = extractPlaceholder(text)
      , post, pre;
    if (!match || isRawText) {
      if (minifyContent) {
        text = isString ? unescapeEntities(trimLeading(text)) : trimLeading(text);
      }
      pushText(stack, text);
      return;
    }

    pre = match.pre;
    post = match.post;
    if (isString) pre = unescapeEntities(pre);
    pushText(stack, pre);
    remainder = post || remainder;

    parseMatch(text, match, queues, {
      onStart: onStart
    , onEnd: function(sections) {
        var fn = blockFn(view, sections);
        push(view, ns, stack, events, macroAttrs, remainder, sections[0].block, fn);
      }
    , onContent: function(match) {
        push(view, ns, stack, events, macroAttrs, remainder, match);
      }
    });

    if (post) return parseText(post);
  }

  function parseEnd(tag, tagName) {
    var sectionName = partialSectionName(tagName)
      , endsPartial = isPartial(view, tagName)
      , ctxName = sectionName || endsPartial && 'content'
      , attrs = macroAttrs
    if (endsPartial && isVoidComponent(view, tagName, ns)) {
      throw new Error('End tag "' + tag + '" is not allowed for void component')
    }
    if (ctxName) {
      onBlock(false, true, null, queues, {
        onStart: onStart
      , onEnd: function(queues) {
          var queue = queues[0]
            , block = queue.block
            , fn = renderer(view, reduceStack(queue.stack), queue.events)
          fn.unescaped = true;
          block.macroCtx[ctxName] = fn;
          if (sectionName) return;
          push(view, ns, stack, events, attrs, '', block);
        }
      })
      return;
    }
    stack.push(['end', tagName]);
  }

  if (isString) {
    parseText(template);
  } else {
    parseHtml(template, {
      start: parseStart
    , text: parseText
    , end: parseEnd
    , comment: function(tag) {
        if (conditionalComment(tag)) pushText(stack, tag);
      }
    , other: function(tag) {
        pushText(stack, tag);
      }
    });
  }
  return renderer(view, reduceStack(stack), events, onRender);
}
});

require.define("/node_modules/derby/node_modules/html-util/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./lib/index.js"}});

require.define("/node_modules/derby/node_modules/html-util/lib/index.js",function(require,module,exports,__dirname,__filename,process){var entityCode = require('./entityCode')
  , parse = require('./parse')

module.exports = {
  parse: parse
, escapeHtml: escapeHtml
, escapeAttribute: escapeAttribute
, unescapeEntities: unescapeEntities
, isVoid: isVoid
, conditionalComment: conditionalComment
, trimLeading: trimLeading
, trimTag: trimTag
, minify: minify
}

function escapeHtml(value) {
  if (value == null) return ''

  return value
    .toString()
    .replace(/&(?!\s)|</g, function(match) {
      return match === '&' ? '&amp;' : '&lt;'
    })
}

function escapeAttribute(value) {
  if (value == null || value === '') return '""'

  value = value
    .toString()
    .replace(/&(?!\s)|"/g, function(match) {
      return match === '&' ? '&amp;' : '&quot;'
    })
  return /[ =<>']/.test(value) ? '"' + value + '"' : value
}

// Based on:
// http://code.google.com/p/jslibs/wiki/JavascriptTips#Escape_and_unescape_HTML_entities
function unescapeEntities(html) {
  return html.replace(/&([^;]+);/g, function(match, entity) {
    var charCode = entity.charAt(0) === '#'
          ? entity.charAt(1) === 'x'
            ? entity.slice(2, 17)
            : entity.slice(1)
          : entityCode[entity]
    return String.fromCharCode(charCode)
  })
}

var voidElement = {
  area: 1
, base: 1
, br: 1
, col: 1
, command: 1
, embed: 1
, hr: 1
, img: 1
, input: 1
, keygen: 1
, link: 1
, meta: 1
, param: 1
, source: 1
, track: 1
, wbr: 1
}
function isVoid(name) {
  return name in voidElement
}

// Assume any HTML comment that starts with `<!--[` or ends with `]-->`
// is a conditional comment. This can also be used to keep comments in
// minified HTML, such as `<!--[ Copyright John Doe, MIT Licensed ]-->`
function conditionalComment(tag) {
  return /(?:^<!--\[)|(?:\]-->$)/.test(tag)
}

// Remove leading whitespace and newlines from a string. Note that trailing
// whitespace is not removed in case whitespace is desired between lines
function trimLeading(text) {
  return text ? text.replace(/\n\s*/g, '') : ''
}

// Within a tag, remove leading whitespace. Keep a linebreak, since this
// could be the separator between attributes
function trimTag(tag) {
  return tag.replace(/(?:\n\s*)+/g, '\n')
}

// Remove linebreaks, leading space, and comments. Maintain a linebreak between
// HTML tag attributes and maintain conditional comments.
function minify(html) {
  var minified = ''
    , minifyContent = true

  parse(html, {
    start: function(tag, tagName, attrs) {
      minifyContent = !('x-no-minify' in attrs)
      minified += trimTag(tag)
    }
  , end: function(tag) {
      minified += trimTag(tag)
    }
  , text: function(text) {
      minified += minifyContent ? trimLeading(text) : text
    }
  , comment: function(tag) {
      if (conditionalComment(tag)) minified += tag
    }
  , other: function(tag) {
      minified += tag
    }
  })
  return minified
}
});

require.define("/node_modules/derby/node_modules/html-util/lib/entityCode.js",function(require,module,exports,__dirname,__filename,process){module.exports = {
  quot: 0x0022
, amp: 0x0026
, apos: 0x0027
, lpar: 0x0028
, rpar: 0x0029
, lt: 0x003C
, gt: 0x003E
, nbsp: 0x00A0
, iexcl: 0x00A1
, cent: 0x00A2
, pound: 0x00A3
, curren: 0x00A4
, yen: 0x00A5
, brvbar: 0x00A6
, sect: 0x00A7
, uml: 0x00A8
, copy: 0x00A9
, ordf: 0x00AA
, laquo: 0x00AB
, not: 0x00AC
, shy: 0x00AD
, reg: 0x00AE
, macr: 0x00AF
, deg: 0x00B0
, plusmn: 0x00B1
, sup2: 0x00B2
, sup3: 0x00B3
, acute: 0x00B4
, micro: 0x00B5
, para: 0x00B6
, middot: 0x00B7
, cedil: 0x00B8
, sup1: 0x00B9
, ordm: 0x00BA
, raquo: 0x00BB
, frac14: 0x00BC
, frac12: 0x00BD
, frac34: 0x00BE
, iquest: 0x00BF
, Agrave: 0x00C0
, Aacute: 0x00C1
, Acirc: 0x00C2
, Atilde: 0x00C3
, Auml: 0x00C4
, Aring: 0x00C5
, AElig: 0x00C6
, Ccedil: 0x00C7
, Egrave: 0x00C8
, Eacute: 0x00C9
, Ecirc: 0x00CA
, Euml: 0x00CB
, Igrave: 0x00CC
, Iacute: 0x00CD
, Icirc: 0x00CE
, Iuml: 0x00CF
, ETH: 0x00D0
, Ntilde: 0x00D1
, Ograve: 0x00D2
, Oacute: 0x00D3
, Ocirc: 0x00D4
, Otilde: 0x00D5
, Ouml: 0x00D6
, times: 0x00D7
, Oslash: 0x00D8
, Ugrave: 0x00D9
, Uacute: 0x00DA
, Ucirc: 0x00DB
, Uuml: 0x00DC
, Yacute: 0x00DD
, THORN: 0x00DE
, szlig: 0x00DF
, agrave: 0x00E0
, aacute: 0x00E1
, acirc: 0x00E2
, atilde: 0x00E3
, auml: 0x00E4
, aring: 0x00E5
, aelig: 0x00E6
, ccedil: 0x00E7
, egrave: 0x00E8
, eacute: 0x00E9
, ecirc: 0x00EA
, euml: 0x00EB
, igrave: 0x00EC
, iacute: 0x00ED
, icirc: 0x00EE
, iuml: 0x00EF
, eth: 0x00F0
, ntilde: 0x00F1
, ograve: 0x00F2
, oacute: 0x00F3
, ocirc: 0x00F4
, otilde: 0x00F5
, ouml: 0x00F6
, divide: 0x00F7
, oslash: 0x00F8
, ugrave: 0x00F9
, uacute: 0x00FA
, ucirc: 0x00FB
, uuml: 0x00FC
, yacute: 0x00FD
, thorn: 0x00FE
, yuml: 0x00FF
, OElig: 0x0152
, oelig: 0x0153
, Scaron: 0x0160
, scaron: 0x0161
, Yuml: 0x0178
, fnof: 0x0192
, circ: 0x02C6
, tilde: 0x02DC
, Alpha: 0x0391
, Beta: 0x0392
, Gamma: 0x0393
, Delta: 0x0394
, Epsilon: 0x0395
, Zeta: 0x0396
, Eta: 0x0397
, Theta: 0x0398
, Iota: 0x0399
, Kappa: 0x039A
, Lambda: 0x039B
, Mu: 0x039C
, Nu: 0x039D
, Xi: 0x039E
, Omicron: 0x039F
, Pi: 0x03A0
, Rho: 0x03A1
, Sigma: 0x03A3
, Tau: 0x03A4
, Upsilon: 0x03A5
, Phi: 0x03A6
, Chi: 0x03A7
, Psi: 0x03A8
, Omega: 0x03A9
, alpha: 0x03B1
, beta: 0x03B2
, gamma: 0x03B3
, delta: 0x03B4
, epsilon: 0x03B5
, zeta: 0x03B6
, eta: 0x03B7
, theta: 0x03B8
, iota: 0x03B9
, kappa: 0x03BA
, lambda: 0x03BB
, mu: 0x03BC
, nu: 0x03BD
, xi: 0x03BE
, omicron: 0x03BF
, pi: 0x03C0
, rho: 0x03C1
, sigmaf: 0x03C2
, sigma: 0x03C3
, tau: 0x03C4
, upsilon: 0x03C5
, phi: 0x03C6
, chi: 0x03C7
, psi: 0x03C8
, omega: 0x03C9
, thetasym: 0x03D1
, upsih: 0x03D2
, piv: 0x03D6
, ensp: 0x2002
, emsp: 0x2003
, thinsp: 0x2009
, zwnj: 0x200C
, zwj: 0x200D
, lrm: 0x200E
, rlm: 0x200F
, ndash: 0x2013
, mdash: 0x2014
, lsquo: 0x2018
, rsquo: 0x2019
, sbquo: 0x201A
, ldquo: 0x201C
, rdquo: 0x201D
, bdquo: 0x201E
, dagger: 0x2020
, Dagger: 0x2021
, bull: 0x2022
, hellip: 0x2026
, permil: 0x2030
, prime: 0x2032
, Prime: 0x2033
, lsaquo: 0x2039
, rsaquo: 0x203A
, oline: 0x203E
, frasl: 0x2044
, euro: 0x20AC
, image: 0x2111
, weierp: 0x2118
, real: 0x211C
, trade: 0x2122
, alefsym: 0x2135
, larr: 0x2190
, uarr: 0x2191
, rarr: 0x2192
, darr: 0x2193
, harr: 0x2194
, crarr: 0x21B5
, lArr: 0x21D0
, uArr: 0x21D1
, rArr: 0x21D2
, dArr: 0x21D3
, hArr: 0x21D4
, forall: 0x2200
, part: 0x2202
, exist: 0x2203
, empty: 0x2205
, nabla: 0x2207
, isin: 0x2208
, notin: 0x2209
, ni: 0x220B
, prod: 0x220F
, sum: 0x2211
, minus: 0x2212
, lowast: 0x2217
, radic: 0x221A
, prop: 0x221D
, infin: 0x221E
, ang: 0x2220
, and: 0x2227
, or: 0x2228
, cap: 0x2229
, cup: 0x222A
, int: 0x222B
, there4: 0x2234
, sim: 0x223C
, cong: 0x2245
, asymp: 0x2248
, ne: 0x2260
, equiv: 0x2261
, le: 0x2264
, ge: 0x2265
, sub: 0x2282
, sup: 0x2283
, nsub: 0x2284
, sube: 0x2286
, supe: 0x2287
, oplus: 0x2295
, otimes: 0x2297
, perp: 0x22A5
, sdot: 0x22C5
, lceil: 0x2308
, rceil: 0x2309
, lfloor: 0x230A
, rfloor: 0x230B
, lang: 0x2329
, rang: 0x232A
, loz: 0x25CA
, spades: 0x2660
, clubs: 0x2663
, hearts: 0x2665
, diams: 0x2666
}
});

require.define("/node_modules/derby/node_modules/html-util/lib/parse.js",function(require,module,exports,__dirname,__filename,process){var startTag = /^<([^\s=\/!>]+)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+)?)?)*)\s*(\/?)\s*>/
  , endTag = /^<\/([^\s=\/!>]+)[^>]*>/
  , comment = /^<!--([\s\S]*?)-->/
  , commentInside = /<!--[\s\S]*?-->/
  , other = /^<([\s\S]*?)>/
  , attr = /([^\s=]+)(?:\s*(=)\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+))?)?/g
  , rawTagsDefault = /^(style|script)$/i

function empty() {}

function matchEndDefault(tagName) {
  return new RegExp('</' + tagName, 'i')
}

function onStartTag(html, match, handler) {
  var attrs = {}
    , tag = match[0]
    , tagName = match[1]
    , remainder = match[2]
  html = html.slice(tag.length)

  remainder.replace(attr, function(match, name, equals, attr0, attr1, attr2) {
    attrs[name.toLowerCase()] = attr0 || attr1 || attr2 || (equals ? '' : null)
  })
  handler(tag, tagName.toLowerCase(), attrs, html)

  return html
}

function onTag(html, match, handler) {
  var tag = match[0]
    , data = match[1]
  html = html.slice(tag.length)

  handler(tag, data, html)

  return html
}

function onText(html, index, isRawText, handler) {
  var text
  if (~index) {
    text = html.slice(0, index)
    html = html.slice(index)
  } else {
    text = html
    html = ''
  }

  if (text) handler(text, isRawText, html)

  return html
}

function rawEnd(html, ending, offset) {
  offset || (offset = 0)
  var index = html.search(ending)
    , commentMatch = html.match(commentInside)
    , commentEnd
  // Make sure that the ending condition isn't inside of an HTML comment
  if (commentMatch && commentMatch.index < index) {
    commentEnd = commentMatch.index + commentMatch[0].length
    offset += commentEnd
    html = html.slice(commentEnd)
    return rawEnd(html, ending, offset)
  }
  return index + offset
}

module.exports = function(html, options) {
  if (options == null) options = {}

  if (!html) return

  var startHandler = options.start || empty
    , endHandler = options.end || empty
    , textHandler = options.text || empty
    , commentHandler = options.comment || empty
    , otherHandler = options.other || empty
    , matchEnd = options.matchEnd || matchEndDefault
    , errorHandler = options.error
    , rawTags = options.rawTags || rawTagsDefault
    , index, last, match, tagName, err

  while (html) {
    if (html === last) {
      err = new Error('HTML parse error: ' + html)
      if (errorHandler) {
        errorHandler(err)
      } else {
        throw err
      }
    }
    last = html

    if (html[0] === '<') {
      if (match = html.match(startTag)) {
        html = onStartTag(html, match, startHandler)

        tagName = match[1]
        if (rawTags.test(tagName)) {
          index = rawEnd(html, matchEnd(tagName))
          html = onText(html, index, true, textHandler)
        }
        continue
      }

      if (match = html.match(endTag)) {
        match[1] = match[1].toLowerCase()  // tagName
        html = onTag(html, match, endHandler)
        continue
      }

      if (match = html.match(comment)) {
        html = onTag(html, match, commentHandler)
        continue
      }

      if (match = html.match(other)) {
        html = onTag(html, match, otherHandler)
        continue
      }
    }

    index = html.indexOf('<')
    html = onText(html, index, false, textHandler)
  }
}
});

require.define("/node_modules/derby/lib/markup.js",function(require,module,exports,__dirname,__filename,process){var eventBinding = require('./eventBinding')
  , splitEvents = eventBinding.splitEvents
  , containsEvent = eventBinding.containsEvent
  , addDomEvent = eventBinding.addDomEvent
  , TEXT_EVENTS = 'keyup,keydown,paste/0,dragover/0,blur'
  , AUTOCOMPLETE_OFF = {
      checkbox: true
    , radio: true
    }
  , onBindA, onBindForm;

module.exports = {
  bound: {
    'value': {
      'input': function(events, attrs, match) {
        var type = attrs.type
          , eventNames, method;
        if (type === 'radio' || type === 'checkbox') return;
        if (type === 'range' || 'x-blur' in attrs) {
          // Only update after the element loses focus
          delete attrs['x-blur'];
          eventNames = 'change,blur';
        } else {
          // By default, update as the user types
          eventNames = TEXT_EVENTS;
        }
        if ('x-ignore-focus' in attrs) {
          // Update value regardless of focus
          delete attrs['x-ignore-focus'];
          method = 'prop';
        } else {
          // Update value unless window and element are focused
          method = 'propPolite';
        }
        addDomEvent(events, attrs, eventNames, match, {
          method: 'prop'
        , property: 'value'
        });
        return {method: method};
      }
    }

  , 'checked': {
      '*': function(events,  attrs, match) {
        addDomEvent(events, attrs, 'change', match, {
          method: 'prop'
        , property: 'checked'
        });
        return {method: 'prop'};
      }
    }

  , 'selected': {
      '*': function(events, attrs, match) {
        addDomEvent(events, attrs, 'change', match, {
          method: 'prop'
        , property: 'selected'
        });
        return {method: 'prop'};
      }
    }

  , 'disabled': {
      '*': function() {
        return {method: 'prop'};
      }
    }
  }

, boundParent: {
    'contenteditable': {
      '*': function(events, attrs, match) {
        addDomEvent(events, attrs, TEXT_EVENTS, match, {
          method: 'html'
        });
      }
    }

  , '*': {
      'textarea': function(events, attrs, match) {
        addDomEvent(events, attrs, TEXT_EVENTS, match, {
          method: 'prop'
        , property: 'value'
        });
        return {method: 'prop', property: 'value'};
      }
    }
  }

, element: {
    'select': function(events, attrs) {
      // Distribute change event to child nodes of select elements
      addDomEvent(events, attrs, 'change:$forChildren');
      return {addId: true};
    }

  , 'input': function(events, attrs) {
      if (AUTOCOMPLETE_OFF[attrs.type] && !('autocomplete' in attrs)) {
        attrs.autocomplete = 'off';
      }
      if (attrs.type === 'radio') {
        // Distribute change events to other elements with the same name
        addDomEvent(events, attrs, 'change:$forName');
      }
    }
  }

, attr: {
    'x-bind': {
      '*': function(events, attrs, eventNames) {
        addDomEvent(events, attrs, eventNames);
        return {addId: true, del: true};
      }

    , 'a': onBindA = function(events, attrs, eventNames) {
        if (containsEvent(eventNames, 'click') && !('href' in attrs)) {
          attrs.href = '#';
          if (!('onclick' in attrs)) {
            attrs.onclick = 'return false';
          }
        }
      }

    , 'form': onBindForm = function(events, attrs, eventNames) {
        if (containsEvent(eventNames, 'submit')) {
          if (!('onsubmit' in attrs)) {
            attrs.onsubmit = 'return false';
          }
        }
      }
    }

  , 'x-capture': {
      '*': function(events, attrs, eventNames) {
        addDomEvent(events, attrs, eventNames, null, {capture: true});
        return {addId: true, del: true};
      }
    , 'a': onBindA
    , 'form': onBindForm
    }

  , 'x-as': {
      '*': function(events, attrs, name) {
        events.push(function(ctx) {
          var elements = ctx.$elements || (ctx.$elements = {});
          elements[name] = attrs._id || attrs.id;
        });
        return {addId: true, del: true}
      }
  }

  , 'checked': {
      '*': function() {
        return {bool: true};
      }
    }

  , 'selected': {
      '*': function() {
        return {bool: true};
      }
    }

  , 'disabled': {
      '*': function() {
        return {bool: true};
      }
    }
  }

, TEXT_EVENTS: TEXT_EVENTS
, AUTOCOMPLETE_OFF: AUTOCOMPLETE_OFF
};
});

require.define("/node_modules/derby/lib/eventBinding.js",function(require,module,exports,__dirname,__filename,process){var util = require('racer').util
  , lookup = require('racer/lib/path').lookup
  , merge = util.merge
  , viewPath = require('./viewPath')
  , extractPlaceholder = viewPath.extractPlaceholder
  , dataValue = viewPath.dataValue
  , ctxPath = viewPath.ctxPath
  , pathFnArgs = viewPath.pathFnArgs
  , setBoundFn = viewPath.setBoundFn;

exports.splitEvents = splitEvents;
exports.containsEvent = containsEvent;
exports.addDomEvent = util.isServer ? empty : addDomEvent;

function splitEvents(eventNames) {
  var pairs = eventNames.replace(/\s/g, '').split(',')
    , eventList = []
    , pair, segments, name, eventName, delay, fn;
  for (var i = pairs.length; i--;) {
    pair = pairs[i];
    segments = pair.split(':');
    name = segments[0].split('/');
    eventName = name[0];
    delay = name[1];
    fn = segments[1];
    fn = fn ? extractPlaceholder(fn) || fn : '';
    eventList.push([eventName, delay, fn]);
  }
  return eventList;
}

function containsEvent(eventNames, expected) {
  var eventList = splitEvents(eventNames)
    , eventName;
  for (var i = eventList.length; i--;) {
    eventName = eventList[i][0];
    if (eventName === expected) return true;
  }
  return false;
}

function addDomEvent(events, attrs, eventNames, match, options) {
  var eventList = splitEvents(eventNames)
    , args, name, macro;

  if (match) {
    name = match.name;
    macro = match.macro;

    if (~name.indexOf('(')) {
      args = pathFnArgs(name);
      if (!args.length) return;

      events.push(function(ctx, modelEvents, dom, pathMap, view) {
        var id = attrs._id || attrs.id
          , paths = []
          , arg, path, pathId, event, eventName, eventOptions, i, j;
        options.setValue = function(model, value) {
          return setBoundFn(view, ctx, model, name, value);
        }
        for (i = args.length; i--;) {
          arg = args[i];
          path = ctxPath(ctx, arg, macro);
          paths.push(path);
          pathId = pathMap.id(path);
          for (j = eventList.length; j--;) {
            event = eventList[j];
            eventName = event[0];
            eventOptions = merge({pathId: pathId, delay: event[1]}, options);
            dom.bind(eventName, id, eventOptions);
          }
        }
      });
      return;
    }

    events.push(function(ctx, modelEvents, dom, pathMap) {
      var id = attrs._id || attrs.id
        , pathId = pathMap.id(ctxPath(ctx, name, macro))
        , event, eventName, eventOptions, i;
      for (i = eventList.length; i--;) {
        event = eventList[i];
        eventName = event[0];
        eventOptions = merge({pathId: pathId, delay: event[1]}, options);
        dom.bind(eventName, id, eventOptions);
      }
    });
    return;
  }

  events.push(function(ctx, modelEvents, dom, pathMap, view) {
    var id = attrs._id || attrs.id
      , event, eventName, eventOptions, i;
    for (i = eventList.length; i--;) {
      event = eventList[i];
      eventName = event[0];
      eventOptions = fnListener(view, ctx, dom, event[1], event[2]);
      merge(eventOptions, options);
      dom.bind(eventName, id, eventOptions);
    }
  });
}

function fnListener(view, ctx, dom, delay, fnObj) {
  var listener = {
    delay: delay
  , fn: function() {
      var fnName, fn, fnCtxs, i, fnCtx;

      fnName = typeof fnObj === 'object'
        ? dataValue(view, ctx, view.model, fnObj.name, fnObj.macro)
        : fnName = fnObj;

      // If a placeholder for an event name does not have a value, do nothing
      if (!fnName) return listener.fn = empty;

      // See if it is a built-in function
      fn = dom.fns[fnName];

      // Lookup the function name on the component script or app

      // TODO: This simply looks in the local scope for the function
      // and then goes up the scope if a function name is not found.
      // Better would be to actually figure out the scope of where the
      // function name is specfied, since there could easily be namespace
      // conflicts between functions in a component and functions in an
      // app using that component. How to implement this correctly is not
      // obvious at the moment.
      if (!fn) {
        fnCtxs = ctx.$fnCtx;
        for (i = fnCtxs.length; i--;) {
          fnCtx = fnCtxs[i];
          fn = fnCtx[fnName] || lookup(fnName, fnCtx);
          if (fn) break;
        }
      }
      if (!fn) throw new Error('Bound function not found: ' + fnName);

      // Bind the listener to the app or component object on which it
      // was defined so that the `this` context will be the instance
      listener.fn = fn.bind(fnCtx);
      fn.apply(fnCtx, arguments);
    }
  };
  return listener;
}

function empty() {}
});

require.define("/node_modules/derby/lib/viewPath.js",function(require,module,exports,__dirname,__filename,process){var lookup = require('racer/lib/path').lookup
  , trimLeading = require('html-util').trimLeading;

exports.wrapRemainder = wrapRemainder;
exports.extractPlaceholder = extractPlaceholder;
exports.pathFnArgs = pathFnArgs;
exports.isBound = isBound;
exports.ctxPath = ctxPath;
exports.dataValue = dataValue;
exports.setBoundFn = setBoundFn;

function wrapRemainder(tagName, remainder) {
  if (!remainder) return false;
  return !(new RegExp('^<\/' + tagName, 'i')).test(remainder);
}

// Note that openPlaceholder must not match against a JSON literal
var openPlaceholder = /^([\s\S]*?)(\{{1,3})\s*([^"{[][\s\S]*)/
  , placeholderContent = /^([\#\/]?)(?:(else\sif|if|else|unless|each|with|unescaped)(?!\())?\s*([^\s(>]*(?:\s*\([\s\S]*\))?)(?:\s+as\s+:([^\s>]+))?/;

function extractPlaceholder(text) {
  var match = openPlaceholder.exec(text);
  if (!match) return;
  var pre = match[1]
    , open = match[2]
    , remainder = match[3]
    , openLen = open.length
    , bound = openLen === 1
    , macro = openLen === 3
    , end = matchBraces(remainder, openLen, 0, '{', '}')
    , endInner = end - openLen
    , inner = remainder.slice(0, endInner)
    , post = remainder.slice(end)
    , content = placeholderContent.exec(inner)
    , escaped, name, type;
  if (!content) return;
  type = content[2];
  escaped = true;
  if (type === 'unescaped') {
    escaped = false;
    type = '';
  }
  name = content[3];
  if (bound) name = name.replace(/\bthis\b/, '.');
  return {
    pre: trimLeading(pre)
  , post: trimLeading(post)
  , bound: bound
  , macro: macro
  , hash: content[1]
  , escaped: escaped
  , type: type
  , name: name
  , alias: content[4]
  , source: text
  };
}

function matchBraces(text, num, i, openChar, closeChar) {
  var close, hasClose, hasOpen, open;
  i++;
  while (num) {
    close = text.indexOf(closeChar, i);
    open = text.indexOf(openChar, i);
    hasClose = ~close;
    hasOpen = ~open;
    if (hasClose && (!hasOpen || (close < open))) {
      i = close + 1;
      num--;
      continue;
    } else if (hasOpen) {
      i = open + 1;
      num++;
      continue;
    } else {
      return;
    }
  }
  return i;
}

var fnCall = /^([^(]+)\s*\(\s*([\s\S]*?)\s*\)\s*$/
  , argSeparator = /\s*([,(])\s*/g
  , notSeparator = /[^,\s]/g
  , notPathArg = /(?:^['"\d\-[{])|(?:^null$)|(?:^true$)|(?:^false$)/;

function fnArgs(inner) {
  var args = []
    , lastIndex = 0
    , match, end, last;
  while (match = argSeparator.exec(inner)) {
    if (match[1] === '(') {
      end = matchBraces(inner, 1, argSeparator.lastIndex, '(', ')');
      args.push(inner.slice(lastIndex, end));
      notSeparator.lastIndex = end;
      lastIndex = argSeparator.lastIndex =
        notSeparator.test(inner) ? notSeparator.lastIndex - 1 : end;
      continue;
    }
    args.push(inner.slice(lastIndex, match.index));
    lastIndex = argSeparator.lastIndex;
  }
  last = inner.slice(lastIndex);
  if (last) args.push(last);
  return args;
}

function fnCallError(name) {
  throw new Error('malformed view function call: ' + name);
}

function fnLiteralValue(arg) {
  if (arg === 'null') return null;
  if (arg === 'true') return true;
  if (arg === 'false') return false;
  var firstChar = arg.charAt(0)
    , match;
  if (firstChar === "'") {
    match = /^'(.*)'$/.exec(arg) || fnCallError(name);
    return match[1];
  }
  if (firstChar === '"') {
    match = /^"(.*)"$/.exec(arg) || fnCallError(name);
    return match[1];
  }
  if (/^[\d\-]/.test(firstChar) && !isNaN(arg)) {
    return +arg;
  }
  if (firstChar === '[' || firstChar === '{') {
    try {
      return JSON.parse(arg);
    } catch (e) {
      fnCallError(name);
    }
  }
  return undefined;
}

function fnArgValue(view, ctx, model, name, macro, arg) {
  var literal = fnLiteralValue(arg)
    , argIds, path, pathId;
  if (literal === undefined) {
    argIds = ctx.hasOwnProperty('$fnArgIds') ?
      ctx.$fnArgIds : (ctx.$fnArgIds = {});
    if (pathId = argIds[arg]) {
      path = model.__pathMap.paths[pathId];
    } else {
      path = ctxPath(ctx, arg, macro);
      argIds[arg] = model.__pathMap.id(path);
    }
    return dataValue(view, ctx, model, path, macro);
  }
  return literal;
}

function fnValue(view, ctx, model, name, macro) {
  var match = fnCall.exec(name) || fnCallError(name)
    , fnName = match[1]
    , args = fnArgs(match[2])
    , fn, fnName, i;
  for (i = args.length; i--;) {
    args[i] = fnArgValue(view, ctx, model, name, macro, args[i]);
  }
  if (!(fn = view.getFns[fnName])) {
    throw new Error('view function "' + fnName + '" not found for call: ' + name);
  }
  return fn.apply(null, args);
}

function pathFnArgs(name, paths) {
  var match = fnCall.exec(name) || fnCallError(name)
    , args = fnArgs(match[2])
    , i, arg;
  if (paths == null) paths = [];
  for (i = args.length; i--;) {
    arg = args[i];
    if (notPathArg.test(arg)) continue;
    if (~arg.indexOf('(')) {
      pathFnArgs(arg, paths);
      continue;
    }
    paths.push(arg);
  }
  return paths;
}

function isBoundMacroAttr(macroAttrs, name) {
  var macroVar = name.split('.')[0]
    , attr = macroAttrs && macroAttrs[macroVar];
  return attr && attr.$bound;
}

function isBound(macroAttrs, match) {
  if (match.bound) return true;
  if (!match.macro || !macroAttrs) return false;
  var name = match.name;
  if (~name.indexOf('(')) {
    var args = pathFnArgs(name)
      , i, len;
    for (i = 0, len = args.length; i < len; i++) {
      if (isBoundMacroAttr(macroAttrs, args[i])) return true;
    }
    return false;
  }
  return isBoundMacroAttr(macroAttrs, name);
}

function macroName(ctx, name, noReplace) {
  var macroCtx = ctx.$macroCtx
    , path = ctxPath(macroCtx, name, false, noReplace)
    , segments = path.split('.')
    , base = segments[0].toLowerCase()
    , remainder = segments[1]
    , value = lookup(base, macroCtx)
    , matchName = value && value.$matchName;
  if (!matchName) return remainder ? base + '.' + remainder : base;
  return remainder ?
    (/\.+/.test(matchName) ? matchName.slice(1) : matchName) + '.' + remainder :
    matchName;
}

function ctxPath(ctx, name, macro, noReplace) {
  if (macro) name = macroName(ctx, name, noReplace);

  var firstChar = name.charAt(0)
    , i, aliasName, aliasValue, indexOffset, indices;
  if (firstChar === ':') {
    if (~(i = name.indexOf('.'))) {
      aliasName = name.slice(1, i);
      name = name.slice(i);
    } else {
      aliasName = name.slice(1);
      name = '';
    }
    aliasValue = ctx.$aliases[aliasName];
    i = ctx.$depth - aliasValue[0];
    indexOffset = aliasValue[1];
    if (i !== i) throw new Error('Can not find alias for ' + aliasName);
  } else if (firstChar === '.') {
    i = 0;
    while (name.charAt(i) === '.') {
      i++;
    }
    name = i === name.length ? '' : name.slice(i - 1);
  }
  if (i && (name = ctx.$paths[i - 1] + name) && !noReplace) {
    indices = ctx.$indices;
    i = indices.length - (ctx.$startIndex || 0) - (indexOffset || 0);
    name = name.replace(/\$#/g, function() {
      return indices[--i];
    });
  }
  return name.replace(/\[([^\]]+)\]/g, function(match, name) {
    return lookup(name, ctx);
  });
}

function dataValue(view, ctx, model, name, macro) {
  var path, value;
  if (~name.indexOf('(')) {
    return fnValue(view, ctx, model, name, macro);
  }
  if (macro) {
    // Get macro content sections
    value = lookup(name.toLowerCase(), ctx.$macroCtx);
    if (value && !value.$matchName) {
      return typeof value === 'function' ? value(ctx, model) : value;
    }
  }
  path = ctxPath(ctx, name, macro);
  value = lookup(path, ctx);
  if (value !== void 0) return value;
  value = model.get(path);
  return value !== void 0 ? value : model[path];
}

function setBoundFn(view, ctx, model, name, value) {
  var match = fnCall.exec(name) || fnCallError(name)
    , fnName = match[1]
    , args = fnArgs(match[2])
    , get = view.getFns[fnName]
    , set = view.setFns[fnName]
    , macro = false
    , numInputs = set.length - 1
    , arg, i, inputs, out, path, len;

  if (!(get && set)) {
    throw new Error('view function "' + fnName + '" not found for binding to: ' + name);
  }

  if (numInputs) {
    inputs = [value];
    i = 0;
    while (i < numInputs) {
      inputs.push(fnArgValue(view, ctx, model, name, macro, args[i++]));
    }
    out = set.apply(null, inputs);
  } else {
    out = set(value);
  }
  if (!out) return;

  for (i = 0, len = out.length; i < len; i++) {
    value = out[i];
    arg = args[i + numInputs];
    if (~arg.indexOf('(')) {
      setBoundFn(view, ctx, model, arg, value);
      continue;
    }
    if (value === void 0 || notPathArg.test(arg)) continue;
    path = ctxPath(ctx, arg);
    if (model.get(path) === value) continue;
    model.set(path, value);
  }
}
});

require.define("/node_modules/derby/lib/derby.browser.js",function(require,module,exports,__dirname,__filename,process){var EventEmitter = require('events').EventEmitter
  , racer = require('racer')
  , merge = racer.util.merge
  , tracks = require('tracks')
  , derbyModel = require('./derby.Model')
  , Dom = require('./Dom')
  , View = require('./View')
  , autoRefresh = require('./refresh').autoRefresh;

module.exports = derbyBrowser;

function derbyBrowser(derby) {
  derby.createApp = createApp;
  derby.init = init;
}
derbyBrowser.decorate = 'derby';
derbyBrowser.useWith = {server: false, browser: true};

// This assumes that only a single instance of this module can run at a time,
// which is reasonable in the browser. This is written like this so that
// derby can be required and used to initialize templates and data.
var view, model, page;

function createApp(appModule) {
  var appExports = merge(appModule.exports, EventEmitter.prototype);

  this.view = appExports.view = view = new View(this._libraries, appExports);

  function Page() {}
  Page.prototype.render = function(ns, ctx) {
    view.render(model, ns, ctx);
  };

  function createPage() {
    return page = new Page();
  }
  function onRoute(callback, page, params, next, isTransitional) {
    if (isTransitional) {
      callback(model, params, next);
    } else {
      callback(page, model, params, next);
    }
  }
  tracks.setup(appExports, createPage, onRoute);
  view.history = appExports.history;

  appExports.ready = function(fn) {
    racer.on('ready', function(model) {
      fn.call(appExports, model);
    });
  };
  return appExports;
}

function init(modelBundle, appHash, debug, ns, ctx) {
  tracks.set('debug', debug);

  // The init event is fired after the model data is initialized but
  // before the socket object is set
  racer.on('init', function(_model) {
    model = view.model = page.model = _model;
    var dom = view.dom = new Dom(model);
    derbyModel.init(model, dom, view);
    // Ignore errors thrown when rendering; these will also be thrown
    // on the server, and throwing here causes the app not to connect
    try {
      // Render immediately upon initialization so that the page is in
      // the same state it was when rendered on the server
      view.render(model, ns, ctx, true);
    } catch (err) {
      console.error(err);
    }
  });

  // The ready event is fired after the model data is initialized and
  // the socket object is set  
  racer.on('ready', function(model) {
    if (debug) autoRefresh(view, model, appHash);
    view._afterRender(ns, ctx);
  });
  racer.init(modelBundle);
}
});

require.define("/node_modules/derby/node_modules/tracks/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./lib/index.js","browserify":{"main":"./lib/browser.js"}}});

require.define("/node_modules/derby/node_modules/tracks/lib/browser.js",function(require,module,exports,__dirname,__filename,process){// This is a dirty hack to ignore the require of connect.mime,
// which is included by Express as of Express 3.0.0 Beta 3
require.modules.connect = function() {
  return {mime: null}
}
// Express 3.0.0 Beta 1 & 2 used the mime npm module
require.modules.mime = function() {}

var Route = require('express/lib/router/route')
  , History = require('./History')
  , router = module.exports = require('./router')

router.setup = setup

function setup(app, createPage, onRoute) {
  var routes = {
        queue: {}
      , transitional: {}
      }
    , page = createPage()
    , history = page._history = app.history = new History(page)
  page.redirect = redirect
  page._routes = routes

  ;['get', 'post', 'put', 'del'].forEach(function(method) {
    var queue = routes.queue[method] = []
      , transitional = routes.transitional[method] = []

    app[method] = function(pattern, callback, callback2) {
      var callbacks = {onRoute: onRoute}

      if (typeof pattern === 'object') {
        var from = pattern.from
          , to = pattern.to
          , forward = pattern.forward || callback.forward || callback
          , back = pattern.back || callback.back || callback2 || forward
          , backCallbacks = {onRoute: onRoute, callback: back}
          , forwardCallbacks = {onRoute: onRoute, callback: forward}
          , fromRoute = new Route(method, from, backCallbacks)
          , toRoute = new Route(method, to, forwardCallbacks)
        transitional.push({
          from: fromRoute
        , to: toRoute
        }, {
          from: toRoute
        , to: fromRoute
        })
        callbacks.forward = forward
        callbacks.from = from
        queue.push(new Route(method, to, callbacks))
        return app
      }

      callbacks.callback = callback
      queue.push(new Route(method, pattern, callbacks))
      return app
    }
  })
}

function redirect(url) {
  if (url === 'back') return this._history.back()
  // TODO: Add support for `basepath` option like Express
  if (url === 'home') url = '\\'
  this._history.replace(url, true)
}
});

require.define("/node_modules/derby/node_modules/tracks/node_modules/express/lib/router/route.js",function(require,module,exports,__dirname,__filename,process){
/**
 * Module dependencies.
 */

var utils = require('../utils');

/**
 * Expose `Route`.
 */

module.exports = Route;

/**
 * Initialize `Route` with the given HTTP `method`, `path`,
 * and an array of `callbacks` and `options`.
 *
 * Options:
 *
 *   - `sensitive`    enable case-sensitive routes
 *   - `strict`       enable strict matching for trailing slashes
 *
 * @param {String} method
 * @param {String} path
 * @param {Array} callbacks
 * @param {Object} options.
 * @api private
 */

function Route(method, path, callbacks, options) {
  options = options || {};
  this.path = path;
  this.method = method;
  this.callbacks = callbacks;
  this.regexp = utils.pathRegexp(path
    , this.keys = []
    , options.sensitive
    , options.strict);
}

/**
 * Check if this route matches `path`, if so
 * populate `.params`.
 *
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

Route.prototype.match = function(path){
  var keys = this.keys
    , params = this.params = []
    , m = this.regexp.exec(path);

  if (!m) return false;

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = keys[i - 1];

    var val = 'string' == typeof m[i]
      ? decodeURIComponent(m[i])
      : m[i];

    if (key) {
      params[key.name] = val;
    } else {
      params.push(val);
    }
  }

  return true;
};
});

require.define("/node_modules/derby/node_modules/tracks/node_modules/express/lib/utils.js",function(require,module,exports,__dirname,__filename,process){
/**
 * Module dependencies.
 */

var mime = require('connect').mime;

/**
 * Make `locals()` bound to the given `obj`.
 *  
 * This is used for `app.locals` and `res.locals`. 
 *
 * @param {Object} obj
 * @return {Function}
 * @api private
 */

exports.locals = function(obj){
  obj.viewCallbacks = obj.viewCallbacks || [];

  function locals(obj){
    for (var key in obj) locals[key] = obj[key];
    return obj;
  };

  locals.use = function(fn){
    if (3 == fn.length) {
      obj.viewCallbacks.push(fn);
    } else {
      obj.viewCallbacks.push(function(req, res, done){
        fn(req, res);
        done();
      });
    }
    return obj;
  };

  return locals;
};

/**
 * Check if `path` looks absolute.
 *
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

exports.isAbsolute = function(path){
  if ('/' == path[0]) return true;
  if (':' == path[1] && '\\' == path[2]) return true;
};

/**
 * Flatten the given `arr`.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

exports.flatten = function(arr, ret){
  var ret = ret || []
    , len = arr.length;
  for (var i = 0; i < len; ++i) {
    if (Array.isArray(arr[i])) {
      exports.flatten(arr[i], ret);
    } else {
      ret.push(arr[i]);
    }
  }
  return ret;
};

/**
 * Normalize the given `type`, for example "html" becomes "text/html".
 *
 * @param {String} type
 * @return {String}
 * @api private
 */

exports.normalizeType = function(type){
  return ~type.indexOf('/') ? type : mime.lookup(type);
};

/**
 * Normalize `types`, for example "html" becomes "text/html".
 *
 * @param {Array} types
 * @return {Array}
 * @api private
 */

exports.normalizeTypes = function(types){
  var ret = [];

  for (var i = 0; i < types.length; ++i) {
    ret.push(~types[i].indexOf('/')
      ? types[i]
      : mime.lookup(types[i]));
  }

  return ret;
};

/**
 * Return the acceptable type in `types`, if any.
 *
 * @param {Array} types
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.acceptsArray = function(types, str){
  // accept anything when Accept is not present
  if (!str) return types[0];

  // parse
  var accepted = exports.parseAccept(str)
    , normalized = exports.normalizeTypes(types)
    , len = accepted.length;

  for (var i = 0; i < len; ++i) {
    for (var j = 0, jlen = types.length; j < jlen; ++j) {
      if (exports.accept(normalized[j].split('/'), accepted[i])) {
        return types[j];
      }
    }
  }
};

/**
 * Check if `type(s)` are acceptable based on
 * the given `str`.
 *
 * @param {String|Array} type(s)
 * @param {String} str
 * @return {Boolean|String}
 * @api private
 */

exports.accepts = function(type, str){
  if ('string' == typeof type) type = type.split(/ *, */);
  return exports.acceptsArray(type, str);
};

/**
 * Check if `type` array is acceptable for `other`.
 *
 * @param {Array} type
 * @param {Object} other
 * @return {Boolean}
 * @api private
 */

exports.accept = function(type, other){
  return (type[0] == other.type || '*' == other.type)
    && (type[1] == other.subtype || '*' == other.subtype);
};

/**
 * Parse accept `str`, returning
 * an array objects containing
 * `.type` and `.subtype` along
 * with the values provided by
 * `parseQuality()`.
 *
 * @param {Type} name
 * @return {Type}
 * @api private
 */

exports.parseAccept = function(str){
  return exports
    .parseQuality(str)
    .map(function(obj){
      var parts = obj.value.split('/');
      obj.type = parts[0];
      obj.subtype = parts[1];
      return obj;
    });
};

/**
 * Parse quality `str`, returning an
 * array of objects with `.value` and
 * `.quality`.
 *
 * @param {Type} name
 * @return {Type}
 * @api private
 */

exports.parseQuality = function(str){
  return str
    .split(/ *, */)
    .map(quality)
    .filter(function(obj){
      return obj.quality;
    })
    .sort(function(a, b){
      return b.quality - a.quality;
    });
};

/**
 * Parse quality `str` returning an
 * object with `.value` and `.quality`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function quality(str) {
  var parts = str.split(/ *; */)
    , val = parts[0];

  var q = parts[1]
    ? parseFloat(parts[1].split(/ *= */)[1])
    : 1;

  return { value: val, quality: q };
}

/**
 * Escape special characters in the given string of html.
 *
 * @param  {String} html
 * @return {String}
 * @api private
 */

exports.escape = function(html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String|RegExp|Array} path
 * @param  {Array} keys
 * @param  {Boolean} sensitive
 * @param  {Boolean} strict
 * @return {RegExp}
 * @api private
 */

exports.pathRegexp = function(path, keys, sensitive, strict) {
  if (path instanceof RegExp) return path;
  if (Array.isArray(path)) path = '(' + path.join('|') + ')';
  path = path
    .concat(strict ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/\+/g, '__plus__')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
      keys.push({ name: key, optional: !! optional });
      slash = slash || '';
      return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
        + (optional || '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/__plus__/g, '(.+)')
    .replace(/\*/g, '(.*)');
  return new RegExp('^' + path + '$', sensitive ? '' : 'i');
}});

require.define("/node_modules/derby/node_modules/tracks/lib/History.js",function(require,module,exports,__dirname,__filename,process){var qs = require('qs')
  , url = require('url')
  , parseUrl = url.parse
  , resolveUrl = url.resolve
  , renderRoute = require('./router').render
  , win = window
  , winHistory = win.history
  , winLocation = win.location
  , doc = win.document
  , currentPath = winLocation.pathname

// Replace the initial state with the current URL immediately,
// so that it will be rendered if the state is later popped
if (winHistory.replaceState) {
  winHistory.replaceState({
    $render: true,
    $method: 'get'
  }, null, winLocation.href)
}

module.exports = History

function History(page) {
  this.page = page
  if (winHistory.pushState) {
    addListeners(this, page)
  } else {
    // TODO: Calling push, replace, and refresh should update
    // window.location when pushState is not supported
    this.push = this.replace = this.refresh = function() {}
  }
}

History.prototype = {
  push: function(url, render, state, e) {
    this._update('pushState', url, render, state, e)
  }

, replace: function(url, render, state, e) {
    this._update('replaceState', url, render, state, e)
  }

  // Rerender the current url locally
, refresh: function() {
    var path = routePath(winLocation.href)
    renderRoute(this.page, {url: path, method: 'get'})
  }

, back: function() {
    winHistory.back()
  }

, forward: function() {
    winHistory.forward()
  }

, go: function(i) {
    winHistory.go(i)
  }

, _update: function(historyMethod, relativeUrl, render, state, e) {
    var url = resolveUrl(winLocation.href, relativeUrl)
      , path = routePath(url)
      , options

    // TODO: history.push should set the window.location with external urls
    if (!path) return
    if (render == null) render = true
    if (state == null) state = {}

    // Update the URL
    options = renderOptions(e, path)
    state.$render = true
    state.$method = options.method
    winHistory[historyMethod](state, null, url)
    currentPath = winLocation.pathname
    if (render) renderRoute(this.page, options, e)
  }
}

// Get the pathname if it is on the same protocol and domain
function routePath(url) {
  var match = parseUrl(url)
  return match &&
    match.protocol === winLocation.protocol &&
    match.host === winLocation.host &&
    match.pathname + (match.search || '')
}

function renderOptions(e, path) {
  var form, elements, query, name, value, override, method, body

  // If this is a form submission, extract the form data and
  // append it to the url for a get or params.body for a post
  if (e && e.type === 'submit') {
    form = e.target
    elements = form.elements
    query = []
    for (var i = 0, len = elements.length, el; i < len; i++) {
      el = elements[i]
      if (name = el.name) {
        value = el.value
        query.push(encodeURIComponent(name) + '=' + encodeURIComponent(value))
        if (name === '_method') {
          override = value.toLowerCase()
          if (override === 'delete') {
            override = 'del'
          }
        }
      }
    }
    query = query.join('&')
    if (form.method.toLowerCase() === 'post') {
      method = override || 'post'
      body = qs.parse(query)
    } else {
      method = 'get'
      path += '?' + query
    }
  } else {
    method = 'get'
  }
  return {
    method: method
  , url: path
  , previous: winLocation.pathname
  , body: body
  , form: form
  }
}

function addListeners(history, page) {

  function onClick(e) {
    // Detect clicks on links

    var el = e.target
      , url, hashIndex

    // Also look up for parent links (<a><img></a>)
    while (el) {
      if (url = el.href) {

        // Ignore command click, control click, and non-left click
        if (e.metaKey || e.which !== 1) return

        // Ignore hash links to the same page
        hashIndex = url.indexOf('#')
        if (~hashIndex && url.slice(0, hashIndex) === winLocation.href.replace(/#.*/, '')) {
          return
        }
        return history.push(url, true, null, e)
      }

      el = el.parentNode
    }
  }

  function onSubmit(e) {
    var target = e.target
      , url
    if (target.tagName.toLowerCase() === 'form') {
      url = target.action
      if (!url || target._forceSubmit || target.enctype === 'multipart/form-data') {
        return
      }
      history.push(url, true, null, e)
    }
  }

  function onPopState(e) {
    var previous = currentPath
      , state = e.state
      , options
    currentPath = winLocation.pathname

    options = {
      previous: previous
    , url: currentPath
    }

    if (state) {
      if (!state.$render) return
      options.method = state.$method
      // Note that the post body is only sent on the initial reqest
      // and it is empty if the state is later popped
      return renderRoute(page, options)
    }

    // The state object will be null for states created by jump links.
    // window.location.hash cannot be used, because it returns nothing
    // if the url ends in just a hash character
    var url = winLocation.href
      , hashIndex = url.indexOf('#')
      , el, id
    if (~hashIndex && currentPath !== previous) {
      options.method = 'get'
      renderRoute(page, options)
      id = url.slice(hashIndex + 1)
      if (el = doc.getElementById(id) || doc.getElementsByName(id)[0]) {
        el.scrollIntoView()
      }
    }
  }

  doc.addEventListener('click', onClick, false)
  doc.addEventListener('submit', onSubmit, false)
  win.addEventListener('popstate', onPopState, false)
}
});

require.define("/node_modules/derby/node_modules/tracks/node_modules/qs/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"index"}});

require.define("/node_modules/derby/node_modules/tracks/node_modules/qs/index.js",function(require,module,exports,__dirname,__filename,process){
module.exports = require('./lib/querystring');});

require.define("/node_modules/derby/node_modules/tracks/node_modules/qs/lib/querystring.js",function(require,module,exports,__dirname,__filename,process){
/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var isint = /^[0-9]+$/;

function promote(parent, key) {
  if (parent[key].length == 0) return parent[key] = {};
  var t = {};
  for (var i in parent[key]) t[i] = parent[key][i];
  parent[key] = t;
  return t;
}

function parse(parts, parent, key, val) {
  var part = parts.shift();
  // end
  if (!part) {
    if (Array.isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' == typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' == typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
    // array
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' == part) {
      if (Array.isArray(obj)) {
        if ('' != val) obj.push(val);
      } else if ('object' == typeof obj) {
        obj[Object.keys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
      // prop
    } else if (~part.indexOf(']')) {
      part = part.substr(0, part.length - 1);
      if (!isint.test(part) && Array.isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
      // key
    } else {
      if (!isint.test(part) && Array.isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
    }
  }
}

/**
 * Merge parent key/val pair.
 */

function merge(parent, key, val){
  if (~key.indexOf(']')) {
    var parts = key.split('[')
      , len = parts.length
      , last = len - 1;
    parse(parts, parent, 'base', val);
    // optimize
  } else {
    if (!isint.test(key) && Array.isArray(parent.base)) {
      var t = {};
      for (var k in parent.base) t[k] = parent.base[k];
      parent.base = t;
    }
    set(parent.base, key, val);
  }

  return parent;
}

/**
 * Parse the given obj.
 */

function parseObject(obj){
  var ret = { base: {} };
  Object.keys(obj).forEach(function(name){
    merge(ret, name, obj[name]);
  });
  return ret.base;
}

/**
 * Parse the given str.
 */

function parseString(str){
  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length);

      // ?foo
      if ('' == key) key = pair, val = '';

      return merge(ret, key, val);
    }, { base: {} }).base;
}

/**
 * Parse the given query `str` or `obj`, returning an object.
 *
 * @param {String} str | {Object} obj
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};
  return 'object' == typeof str
    ? parseObject(str)
    : parseString(str);
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (Array.isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix + '=' + obj;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '['+i+']'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = Object.keys(obj)
    , key;

  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }

  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (Array.isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}
});

require.define("url",function(require,module,exports,__dirname,__filename,process){var punycode = { encode : function (s) { return s } };

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

function arrayIndexOf(array, subject) {
    for (var i = 0, j = array.length; i < j; i++) {
        if(array[i] == subject) return i;
    }
    return -1;
}

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]+$/,
    // RFC 2396: characters reserved for delimiting URLs.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '[', ']', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''],
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
      .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && typeof(url) === 'object' && url.href) return url;

  if (typeof url !== 'string') {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var out = {},
      rest = url;

  // cut off any delimiters.
  // This is to support parse stuff like "<http://foo.com>"
  for (var i = 0, l = rest.length; i < l; i++) {
    if (arrayIndexOf(delims, rest.charAt(i)) === -1) break;
  }
  if (i !== 0) rest = rest.substr(i);


  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    out.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      out.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.

    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the first @ sign, unless some non-auth character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    var atSign = arrayIndexOf(rest, '@');
    if (atSign !== -1) {
      // there *may be* an auth
      var hasAuth = true;
      for (var i = 0, l = nonAuthChars.length; i < l; i++) {
        var index = arrayIndexOf(rest, nonAuthChars[i]);
        if (index !== -1 && index < atSign) {
          // not a valid auth.  Something like http://foo.com/bar@baz/
          hasAuth = false;
          break;
        }
      }
      if (hasAuth) {
        // pluck off the auth portion.
        out.auth = rest.substr(0, atSign);
        rest = rest.substr(atSign + 1);
      }
    }

    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i++) {
      var index = arrayIndexOf(rest, nonHostChars[i]);
      if (index !== -1 &&
          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }

    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = '';
    }

    // pull out port.
    var p = parseHost(out.host);
    var keys = objectKeys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    out.hostname = out.hostname || '';

    // validate a little.
    if (out.hostname.length > hostnameMaxLen) {
      out.hostname = '';
    } else {
      var hostparts = out.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            out.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    // hostnames are always lower case.
    out.hostname = out.hostname.toLowerCase();

    // IDNA Support: Returns a puny coded representation of "domain".
    // It only converts the part of the domain name that
    // has non ASCII characters. I.e. it dosent matter if
    // you call it with a domain that already is in ASCII.
    var domainArray = out.hostname.split('.');
    var newOut = [];
    for (var i = 0; i < domainArray.length; ++i) {
      var s = domainArray[i];
      newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
          'xn--' + punycode.encode(s) : s);
    }
    out.hostname = newOut.join('.');

    out.host = (out.hostname || '') +
        ((out.port) ? ':' + out.port : '');
    out.href += out.host;
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }

    // Now make sure that delims never appear in a url.
    var chop = rest.length;
    for (var i = 0, l = delims.length; i < l; i++) {
      var c = arrayIndexOf(rest, delims[i]);
      if (c !== -1) {
        chop = Math.min(c, chop);
      }
    }
    rest = rest.substr(0, chop);
  }


  // chop off from the tail first.
  var hash = arrayIndexOf(rest, '#');
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = arrayIndexOf(rest, '?');
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm + 1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    out.search = '';
    out.query = {};
  }
  if (rest) out.pathname = rest;
  if (slashedProtocol[proto] &&
      out.hostname && !out.pathname) {
    out.pathname = '/';
  }

  //to support http.request
  if (out.pathname || out.search) {
    out.path = (out.pathname ? out.pathname : '') +
               (out.search ? out.search : '');
  }

  // finally, reconstruct the href based on what has been validated.
  out.href = urlFormat(out);
  return out;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (typeof(obj) === 'string') obj = urlParse(obj);

  var auth = obj.auth || '';
  if (auth) {
    auth = auth.split('@').join('%40');
    for (var i = 0, l = nonAuthChars.length; i < l; i++) {
      var nAC = nonAuthChars[i];
      auth = auth.split(nAC).join(encodeURIComponent(nAC));
    }
    auth += '@';
  }

  var protocol = obj.protocol || '',
      host = (obj.host !== undefined) ? auth + obj.host :
          obj.hostname !== undefined ? (
              auth + obj.hostname +
              (obj.port ? ':' + obj.port : '')
          ) :
          false,
      pathname = obj.pathname || '',
      query = obj.query &&
              ((typeof obj.query === 'object' &&
                objectKeys(obj.query).length) ?
                 querystring.stringify(obj.query) :
                 '') || '',
      search = obj.search || (query && ('?' + query)) || '',
      hash = obj.hash || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  return protocol + host + pathname + search + hash;
}

function urlResolve(source, relative) {
  return urlFormat(urlResolveObject(source, relative));
}

function urlResolveObject(source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source), false, true);
  relative = urlParse(urlFormat(relative), false, true);

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === '') {
    source.href = urlFormat(source);
    return source;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[relative.protocol] &&
        relative.hostname && !relative.pathname) {
      relative.path = relative.pathname = '/';
    }
    relative.href = urlFormat(relative);
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      relative.href = urlFormat(relative);
      return relative;
    }
    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      relative.pathname = relPath.join('/');
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || '';
    source.auth = relative.auth;
    source.hostname = relative.hostname || relative.host;
    source.port = relative.port;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.slashes = source.slashes || relative.slashes;
    source.href = urlFormat(source);
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host !== undefined ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (source.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = source.pathname && source.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = source.protocol &&
          !slashedProtocol[source.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {

    delete source.hostname;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === '') srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;
    if (relative.protocol) {
      delete relative.hostname;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === '') ?
                      relative.host : source.host;
    source.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : source.hostname;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ('search' in relative) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.hostname = source.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?
                       source.host.split('@') : false;
      if (authInHost) {
        source.auth = authInHost.shift();
        source.host = source.hostname = authInHost.shift();
      }
    }
    source.search = relative.search;
    source.query = relative.query;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.href = urlFormat(source);
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    //to support http.request
    if (!source.search) {
      source.path = '/' + source.search;
    } else {
      delete source.path;
    }
    source.href = urlFormat(source);
    return source;
  }
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (source.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    source.hostname = source.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?
                     source.host.split('@') : false;
    if (authInHost) {
      source.auth = authInHost.shift();
      source.host = source.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  source.pathname = srcPath.join('/');
  //to support request.http
  if (source.pathname !== undefined || source.search !== undefined) {
    source.path = (source.pathname ? source.pathname : '') +
                  (source.search ? source.search : '');
  }
  source.auth = relative.auth || source.auth;
  source.slashes = source.slashes || relative.slashes;
  source.href = urlFormat(source);
  return source;
}

function parseHost(host) {
  var out = {};
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    out.port = port.substr(1);
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}
});

require.define("querystring",function(require,module,exports,__dirname,__filename,process){var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    };

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}


/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.3.1';

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var notint = /[^0-9]/;

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};

  function promote(parent, key) {
    if (parent[key].length == 0) return parent[key] = {};
    var t = {};
    for (var i in parent[key]) t[i] = parent[key][i];
    parent[key] = t;
    return t;
  }

  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{ 
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , parent = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            if (isArray(parent[key])) {
              parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
              parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
              parent[key] = val;
            } else {
              parent[key] = [parent[key], val];
            }
          // array
          } else {
            obj = parent[key] = parent[key] || [];
            if (']' == part) {
              if (isArray(obj)) {
                if ('' != val) obj.push(val);
              } else if ('object' == typeof obj) {
                obj[objectKeys(obj).length] = val;
              } else {
                obj = parent[key] = [parent[key], val];
              }
            // prop
            } else if (~part.indexOf(']')) {
              part = part.substr(0, part.length - 1);
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            // key
            } else {
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            }
          }
        }

        parse(parts, parent, 'base');
      // optimize
      } else {
        if (notint.test(key) && isArray(parent.base)) {
          var t = {};
          for(var k in parent.base) t[k] = parent.base[k];
          parent.base = t;
        }
        set(parent.base, key, val);
      }

      return ret;
    }, {base: {}}).base;
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }
  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}
});

require.define("/node_modules/derby/node_modules/tracks/lib/router.js",function(require,module,exports,__dirname,__filename,process){var qs = require('qs')
  , settings = {}

exports.render = render
exports._mapRoute = mapRoute
exports.settings = settings
exports.set = function(setting, value) {
  this.settings[setting] = value
  return this
}
exports.get = function(setting) {
  return settings[setting]
}

function mapRoute(from, params) {
  var i, path, queryString, url
  url = params.url
  queryString = ~(i = url.indexOf('?')) ? url.slice(i) : ''
  i = 0
  path = from.replace(/(?:(?:\:([^?\/:*]+))|\*)\??/g, function(match, key) {
    if (key) return params[key]
    return params[i++]
  })
  return path + queryString
}

function cancelRender(url, form, e) {
  // Don't do anything if this is the result of an event, since the
  // appropriate action will happen by default
  if (e) return
  // Otherwise, manually perform appropriate action
  if (form) {
    form._forceSubmit = true
    return form.submit()
  } else {
    return window.location = url
  }
}

function render(page, options, e) {
  var routes = page._routes
    , url = options.url.replace(/#.*/, '')
    , querySplit = url.split('?')
    , path = querySplit[0]
    , queryString = querySplit[1]
    , query = queryString ? qs.parse(queryString) : {}
    , method = options.method
    , body = options.body || {}
    , previous = options.previous
    , form = options.form
    , transitional = routes.transitional[method]
    , queue = routes.queue[method]

  function reroute(url) {
    var path = url.replace(/\?.*/, '')
    renderQueued(previous, path, url, form, null, onMatch, transitional, queue, 0)
  }

  function onMatch(path, url, i, route, renderNext, isTransitional) {
    // Stop the default browser action, such as clicking a link or submitting a form
    if (e) e.preventDefault()

    var routeParams = route.params
      , params = routeParams.slice()
      , key
    for (key in routeParams) {
      params[key] = routeParams[key]
    }
    params.url = url
    params.body = body
    params.query = query
    page.params = params

    function next(err) {
      if (err != null) return cancelRender(url, form)
      renderNext(previous, path, url, form, null, onMatch, transitional, queue, i)
    }

    if (settings.debug) {
      return run(route, page, params, next, reroute, isTransitional)
    }
    try {
      run(route, page, params, next, reroute, isTransitional)
    } catch (err) {
      cancelRender(url, form)
    }
  }
  return renderTransitional(previous, path, url, form, e, onMatch, transitional, queue, 0)
}

function run(route, page, params, next, reroute, isTransitional) {
  var callbacks = route.callbacks
    , onRoute = callbacks.onRoute

  if (callbacks.forward) {
    var render = page.render
    page.render = function() {
      onRoute(callbacks.forward, page, params, next, true)
      page.render = render
      render.apply(page, arguments)
    }
    return reroute(mapRoute(callbacks.from, params))
  }
  onRoute(callbacks.callback, page, params, next, isTransitional)
}

function renderTransitional(previous, path, url, form, e, onMatch, transitional, queue, i) {
  var item
  while (item = transitional[i++]) {
    if (!item.to.match(path)) continue
    if (!item.from.match(previous)) continue
    return onMatch(path, url, i, item.to, renderTransitional, true)
  }
  return renderQueued(previous, path, url, form, e, onMatch, transitional, queue, 0)
}

function renderQueued(previous, path, url, form, e, onMatch, transitional, queue, i) {
  var route
  while (route = queue[i++]) {
    if (!route.match(path)) continue
    return onMatch(path, url, i, route, renderQueued)
  }
  // Cancel rendering by this app if no routes match
  return cancelRender(url, form, e)
}
});

require.define("/node_modules/derby/lib/derby.Model.js",function(require,module,exports,__dirname,__filename,process){var EventDispatcher = require('./EventDispatcher')
  , PathMap = require('./PathMap')
  , Model = require('racer')["protected"].Model
  , arraySlice = [].slice;

exports.init = init;

function isArrayPath(pathMap, model, path) {
  return pathMap.arrays[path] || Array.isArray(model.get(path));
}

// Add support for creating a model alias from a DOM node or jQuery object
Model.prototype.__at = Model.prototype.at;
Model.prototype.at = function(node, absolute) {
  var isNode = node && (node.parentNode || node.jquery && (node = node[0]));
  if (!isNode) return this.__at(node, absolute);

  updateMarkers();

  var blockPaths = this.__blockPaths
    , pathMap = this.__pathMap
    , root = this._root
    , child, i, id, last, path, pathId, children, len;
  while (node) {
    if (node.$derbyMarkerParent) {
      node = last;
      while (node = node.previousSibling) {
        if (!(id = node.$derbyMarkerId)) continue;
        pathId = blockPaths[id];
        if (node.$derbyMarkerEnd || !pathId) break;

        path = pathMap.paths[pathId];
        if (isArrayPath(pathMap, root, path) && last) {
          i = 0;
          while (node = node.nextSibling) {
            if (node === last) {
              path = path + '.' + i;
              break;
            }
            i++;
          }
        }
        return this.__at(path, true);
      }
      last = last.parentNode;
      node = last.parentNode;
      continue;
    }
    if ((id = node.id) && (pathId = blockPaths[id])) {
      path = pathMap.paths[pathId];
      if (isArrayPath(pathMap, root, path) && last) {
        children = node.childNodes;
        for (i = 0, len = children.length; i < len; i++) {
          child = children[i];
          if (child === last) {
            path = path + '.' + i;
            break;
          }
        }
      }
      return this.__at(path, true);
    }
    last = node;
    node = node.parentNode;
  }

  // Just return the root scope if a path can't be found
  return root;
}

function updateMarkers() {
  // NodeFilter.SHOW_COMMENT == 128
  var commentIterator = document.createTreeWalker(document.body, 128, null, false)
    , comment, id;
  while (comment = commentIterator.nextNode()) {
    if (comment.$derbyChecked) continue;
    comment.$derbyChecked = true;
    id = comment.data;
    if (id.charAt(0) !== '$') continue;
    if (id.charAt(1) === '$') {
      comment.$derbyMarkerEnd = true;
      id = id.slice(1);
    }
    comment.$derbyMarkerId = id;
    comment.parentNode.$derbyMarkerParent = true;
  }
}

function init(model, dom, view) {
  var pathMap = model.__pathMap = new PathMap;
  var events = model.__events = new EventDispatcher({
    onTrigger: function(pathId, listener, type, local, options, value, index, arg) {
      var id = listener[0]
        , el = dom.item(id);

      // Fail and remove the listener if the element can't be found
      if (!el) return false;

      var method = listener[1]
        , property = listener[2]
        , partial = listener.partial
        , path = pathMap.paths[pathId]
        , triggerId;
      if (method === 'propPolite' && local) method = 'prop';
      if (partial) {
        triggerId = id;
        if (method === 'html' && type) {
          if (partial.type === 'each') {
            // Handle array updates
            method = type;
            if (type === 'append') {
              path += '.' + (index = model.get(path).length - 1);
              triggerId = null;
            } else if (type === 'insert') {
              path += '.' + index;
              triggerId = null;
            } else if (type === 'remove') {
              partial = null;
            } else if (type === 'move') {
              partial = null;
              property = arg;
            }
          } else {
            value = model.get(path)
          }
        }
      }
      if (listener.getValue) {
        value = listener.getValue(model, path);
      }
      if (partial) {
        value = partial(listener.ctx, model, path, triggerId, value, index, listener);
        if (value == null) return;
      }
      if (value == null) value = '';
      dom.update(el, method, options && options.ignore, value, property, index);
    }
  });

  // Derby's mutator listeners are added via unshift instead of model.on, because
  // it needs to handle events in the same order that racer applies mutations.
  // If there is a listener to an event that applies a mutation, event listeners
  // later in the listeners queues could receive events in a different order

  model.listeners('set').unshift(function(args, out, local, pass) {
    var arrayPath, i, index, path, value;
    model.emit('pre:set', args, out, local, pass);
    path = args[0], value = args[1];

    // For set operations on array items, also emit a remove and insert in case the
    // array is bound
    if (/\.\d+$/.test(path)) {
      i = path.lastIndexOf('.');
      arrayPath = path.slice(0, i);
      index = path.slice(i + 1);
      triggerEach(events, pathMap, arrayPath, 'remove', local, pass, index);
      triggerEach(events, pathMap, arrayPath, 'insert', local, pass, value, index);
    }
    return triggerEach(events, pathMap, path, 'html', local, pass, value);
  });

  model.listeners('del').unshift(function(args, out, local, pass) {
    model.emit('pre:del', args, out, local, pass);
    var path = args[0];
    return triggerEach(events, pathMap, path, 'html', local, pass);
  });

  model.listeners('push').unshift(function(args, out, local, pass) {
    model.emit('pre:push', args, out, local, pass);
    var path = args[0]
      , values = arraySlice.call(args, 1);
    for (var i = 0, len = values.length, value; i < len; i++) {
      value = values[i];
      triggerEach(events, pathMap, path, 'append', local, pass, value);
    }
  });

  model.listeners('move').unshift(function(args, out, local, pass) {
    model.emit('pre:move', args, out, local, pass);
    var path = args[0]
      , from = args[1]
      , to = args[2]
      , howMany = args[3]
      , len = model.get(path).length;
    from = refIndex(from);
    to = refIndex(to);
    if (from < 0) from += len;
    if (to < 0) to += len;
    if (from === to) return;
    // Update indicies in pathMap
    pathMap.onMove(path, from, to, howMany);
    triggerEach(events, pathMap, path, 'move', local, pass, from, howMany, to);
  });

  model.listeners('unshift').unshift(function(args, out, local, pass) {
    model.emit('pre:unshift', args, out, local, pass);
    var path = args[0]
      , values = arraySlice.call(args, 1);
    insert(events, pathMap, path, 0, values, local, pass);
  });

  model.listeners('insert').unshift(function(args, out, local, pass) {
    model.emit('pre:insert', args, out, local, pass);
    var path = args[0]
      , index = args[1]
      , values = arraySlice.call(args, 2);
    insert(events, pathMap, path, index, values, local, pass);
  });

  model.listeners('remove').unshift(function(args, out, local, pass) {
    model.emit('pre:remove', args, out, local, pass);
    var path = args[0]
      , start = args[1]
      , howMany = args[2];
    remove(events, pathMap, path, start, howMany, local, pass);
  });

  model.listeners('pop').unshift(function(args, out, local, pass) {
    model.emit('pre:pop', args, out, local, pass);
    var path = args[0];
    remove(events, pathMap, path, model.get(path).length, 1, local, pass);
  });

  model.listeners('shift').unshift(function(args, out, local, pass) {
    model.emit('pre:shift', args, out, local, pass);
    var path = args[0];
    remove(events, pathMap, path, 0, 1, local, pass);
  });

  ['connected', 'canConnect'].forEach(function(event) {
    model.listeners(event).unshift(function(value) {
      triggerEach(events, pathMap, event, null, true, null, value);
    });
  });

  model.on('reInit', function() {
    view.history.refresh();
  });

  return model;
}

function triggerEach(events, pathMap, path, arg0, arg1, arg2, arg3, arg4, arg5) {
  var id = pathMap.ids[path]
    , segments = path.split('.')
    , i, pattern;

  // Trigger an event on the path if it has a pathMap ID
  if (id) events.trigger(id, arg0, arg1, arg2, arg3, arg4, arg5);

  // Also trigger a pattern event for the path and each of its parent paths
  // This is used by view helper functions to match updates on a path
  // or any of its child segments
  i = segments.length + 1;
  while (--i) {
    pattern = segments.slice(0, i).join('.') + '*';
    if (id = pathMap.ids[pattern]) {
      events.trigger(id, arg0, arg1, arg2, arg3, arg4, arg5);
    }
  }
}

// Get index if event was from refList id object
function refIndex(obj) {
  return typeof obj === 'object' ? obj.index : +obj;
}

function insert(events, pathMap, path, start, values, local, pass) {
  start = refIndex(start);
  // Update indicies in pathMap
  pathMap.onInsert(path, start, values.length);
  for (var i = 0, len = values.length, value; i < len; i++) {
    value = values[i];
    triggerEach(events, pathMap, path, 'insert', local, pass, value, start + i);
  }
}

function remove(events, pathMap, path, start, howMany, local, pass) {
  start = refIndex(start);
  var end = start + howMany;
  // Update indicies in pathMap
  pathMap.onRemove(path, start, howMany);
  for (var i = start; i < end; i++) {
    triggerEach(events, pathMap, path, 'remove', local, pass, start);
  }
}
});

require.define("/node_modules/derby/lib/EventDispatcher.js",function(require,module,exports,__dirname,__filename,process){function empty() {}

module.exports = EventDispatcher;

function EventDispatcher(options) {
  if (options == null) options = {};
  this._onTrigger = options.onTrigger || empty;
  this._onBind = options.onBind || empty;
  this.clear();
}

EventDispatcher.prototype = {
  clear: function() {
    this.names = {};
  }

, bind: function(name, listener, arg0) {
    this._onBind(name, listener, arg0);
    var names = this.names
      , obj = names[name] || {};
    obj[JSON.stringify(listener)] = listener;
    return names[name] = obj;
  }

, trigger: function(name, value, arg0, arg1, arg2, arg3, arg4, arg5) {
    var names = this.names
      , listeners = names[name]
      , onTrigger = this._onTrigger
      , count = 0
      , key, listener;
    for (key in listeners) {
      listener = listeners[key];
      count++;
      if (false !== onTrigger(name, listener, value, arg0, arg1, arg2, arg3, arg4, arg5)) {
        continue;
      }
      delete listeners[key];
      count--;
    }
    if (!count) delete names[name];
    return count;
  }
}
});

require.define("/node_modules/derby/lib/PathMap.js",function(require,module,exports,__dirname,__filename,process){module.exports = PathMap

function PathMap() {
  this.clear();
}
PathMap.prototype = {
  clear: function() {
    this.count = 0;
    this.ids = {};
    this.paths = {};
    this.arrays = {};
  }

, id: function(path) {
    var id;
    // Return the path for an id, or create a new id and index it
    return this.ids[path] || (
      id = ++this.count
    , this.paths[id] = path
    , this._indexArray(path, id)
    , this.ids[path] = id
    );
  }

, _indexArray: function(path, id) {
    var arr, index, match, nested, remainder, set, setArrays;
    while (match = /^(.+)\.(\d+)(\*?(?:\..+|$))/.exec(path)) {
      path = match[1];
      index = +match[2];
      remainder = match[3];
      arr = this.arrays[path] || (this.arrays[path] = []);
      set = arr[index] || (arr[index] = {});
      if (nested) {
        setArrays = set.arrays || (set.arrays = {});
        setArrays[remainder] = true;
      } else {
        set[id] = remainder;
      }
      nested = true;
    }
  }

, _incrItems: function(path, map, start, end, byNum, oldArrays, oldPath) {
    var arrayMap, arrayPath, arrayPathTo, i, id, ids, itemPath, remainder;
    if (oldArrays == null) oldArrays = {};

    for (i = start; i < end; i++) {
      ids = map[i];
      if (!ids) continue;

      for (id in ids) {
        remainder = ids[id];
        if (id === 'arrays') {
          for (remainder in ids[id]) {
            arrayPath = (oldPath || path) + '.' + i + remainder;
            arrayMap = oldArrays[arrayPath] || this.arrays[arrayPath];
            if (arrayMap) {
              arrayPathTo = path + '.' + (i + byNum) + remainder;
              this.arrays[arrayPathTo] = arrayMap;
              this._incrItems(arrayPathTo, arrayMap, 0, arrayMap.length, 0, oldArrays, arrayPath);
            }
          }
          continue;
        }

        itemPath = path + '.' + (i + byNum) + remainder;
        this.paths[id] = itemPath;
        this.ids[itemPath] = +id;
      }
    }
  }

, _delItems: function(path, map, start, end, len, oldArrays) {
    var arrayLen, arrayMap, arrayPath, i, id, ids, itemPath, remainder;
    if (oldArrays == null) oldArrays = {};

    for (i = start; i < len; i++) {
      ids = map[i];
      if (!ids) continue;

      for (id in ids) {
        if (id === 'arrays') {
          for (remainder in ids[id]) {
            arrayPath = path + '.' + i + remainder;
            if (arrayMap = this.arrays[arrayPath]) {
              arrayLen = arrayMap.length;
              this._delItems(arrayPath, arrayMap, 0, arrayLen, arrayLen, oldArrays);
              oldArrays[arrayPath] = arrayMap;
              delete this.arrays[arrayPath];
            }
          }
          continue;
        }

        itemPath = this.paths[id];
        delete this.ids[itemPath];
        if (i > end) continue;
        delete this.paths[id];
      }
    }

    return oldArrays;
  }

, onRemove: function(path, start, howMany) {
    var map = this.arrays[path]
      , end, len, oldArrays;
    if (!map) return;
    end = start + howMany;
    len = map.length;
    // Delete indicies for removed items
    oldArrays = this._delItems(path, map, start, end + 1, len);
    // Decrement indicies of later items
    this._incrItems(path, map, end, len, -howMany, oldArrays);
    map.splice(start, howMany);
  }

, onInsert: function(path, start, howMany) {
    var map = this.arrays[path]
      , end, len, oldArrays;
    if (!map) return;
    end = start + howMany;
    len = map.length;
    // Delete indicies for items in inserted positions
    oldArrays = this._delItems(path, map, start, end + 1, len);
    // Increment indicies of later items
    this._incrItems(path, map, start, len, howMany, oldArrays);
    while (howMany--) {
      map.splice(start, 0, {});
    }
  }

, onMove: function(path, from, to, howMany) {
    var map = this.arrays[path]
      , afterFrom, afterTo, items, oldArrays;
    if (!map) return;
    afterFrom = from + howMany;
    afterTo = to + howMany;
    // Adjust paths for items between from and to
    if (from > to) {
      oldArrays = this._delItems(path, map, to, afterFrom, afterFrom);
      this._incrItems(path, map, to, from, howMany, oldArrays);
    } else {
      oldArrays = this._delItems(path, map, from, afterTo, afterTo);
      this._incrItems(path, map, afterFrom, afterTo, -howMany, oldArrays);
    }
    // Adjust paths for the moved item(s)
    this._incrItems(path, map, from, afterFrom, to - from, oldArrays);
    // Fix the array index
    items = map.splice(from, howMany);
    map.splice.apply(map, [to, 0].concat(items));
  }
}
});

require.define("/node_modules/derby/lib/Dom.js",function(require,module,exports,__dirname,__filename,process){var racer = require('racer')
  , domShim = require('dom-shim')
  , EventDispatcher = require('./EventDispatcher')
  , escapeHtml = require('html-util').escapeHtml
  , merge = racer.util.merge
  , win = window
  , doc = document
  , markers = {}
  , elements = {
      $_win: win
    , $_doc: doc
    }
  , addListener, removeListener;

module.exports = Dom;

function Dom(model) {
  var dom = this
    , fns = this.fns

      // Map dom event name -> true
    , listenerAdded = {}
    , captureListenerAdded = {};


  // DOM listener capturing allows blur and focus to be delegated
  // http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html

  var events = this._events = new EventDispatcher({
    onTrigger: onTrigger
  , onBind: function(name, listener, eventName) {
      if (!listenerAdded[eventName]) {
        addListener(doc, eventName, trigger, true);
        listenerAdded[eventName] = true;
      }
    }
  });

  var captureEvents = this._captureEvents = new EventDispatcher({
    onTrigger: function(name, listener, e) {
      var el = doc.getElementById(id)
        , id = listener.id;
      if (el.tagName === 'HTML' || el.contains(e.target)) {
        onTrigger(name, listener, id, e, el);
      }
    }
  , onBind: function(name, listener) {
      if (!captureListenerAdded[name]) {
        addListener(doc, name, captureTrigger, true);
        captureListenerAdded[name] = true;
      }
    }
  });

  function onTrigger(name, listener, id, e, el, next) {
    var delay = listener.delay
      , finish = listener.fn;

    if (!finish) {
      // Update the model when the element's value changes
      finish = function() {
        var value = dom.getMethods[listener.method](el, listener.property)
          , setValue = listener.setValue;

        // Allow the listener to override the setting function
        if (setValue) {
          setValue(model, value);
          return;
        }

        // Remove this listener if its path id is no longer registered
        var path = model.__pathMap.paths[listener.pathId];
        if (!path) return false;

        // Set the value if changed
        if (model.get(path) === value) return;
        model.pass(e).set(path, value);
      }
    }

    if (delay != null) {
      setTimeout(finish, delay, e, el, next, dom);
    } else {
      finish(e, el, next, dom);
    }
  }

  function trigger(e, el, noBubble, continued) {
    if (!el) el = e.target;
    var prefix = e.type + ':'
      , id;

    // Next can be called from a listener to continue bubbling
    function next() {
      trigger(e, el.parentNode, false, true);
    }
    next.firstTrigger = !continued;
    if (noBubble && (id = el.id)) {
      return events.trigger(prefix + id, id, e, el, next);
    }
    while (true) {
      while (!(id = el.id)) {
        if (!(el = el.parentNode)) return;
      }
      // Stop bubbling once the event is handled
      if (events.trigger(prefix + id, id, e, el, next)) return;
      if (!(el = el.parentNode)) return;
    }
  }

  function captureTrigger(e) {
    captureEvents.trigger(e.type, e);
  }

  this.trigger = trigger;
  this.captureTrigger = captureTrigger;
  this.addListener = addListener;
  this.removeListener = removeListener;

  this._componentListeners = [];
  this._pendingUpdates = [];
}

Dom.prototype = {
  clear: function() {
    this._events.clear();
    this._captureEvents.clear();
    var listeners = this._componentListeners
      , i, listener;
    for (i = listeners.length; i--;) {
      listener = listeners[i];
      removeListener(listener[0], listener[1], listener[2], listener[3]);
    }
    this._componentListeners = [];
    markers = {};
  }

, bind: function(eventName, id, listener) {
    if (listener.capture) {
      listener.id = id;
      this._captureEvents.bind(eventName, listener);
    } else {
      this._events.bind("" + eventName + ":" + id, listener, eventName);
    }
  }

, update: function(el, method, ignore, value, property, index) {
    // Set to true during rendering
    if (this._preventUpdates) return;

    // Don't do anything if the element is already up to date
    if (value === this.getMethods[method](el, property)) return;
    this.setMethods[method](el, ignore, value, property, index);

    this._emitUpdate();
  }

, item: function(id) {
    return doc.getElementById(id) || elements[id] || getRange(id);
  }

, componentDom: function(ctx) {
  var componentListeners = this._componentListeners
    , dom = Object.create(this);

  dom.addListener = function(el, name, callback, captures) {
    componentListeners.push(arguments);
    addListener(el, name, callback, captures);
  };

  dom.element = function(name) {
    var id = ctx.$elements[name];
    return document.getElementById(id);
  };

  return dom;
}

, nextUpdate: function(callback) {
  this._pendingUpdates.push(callback);
}

, _emitUpdate: function() {
  var fns = this._pendingUpdates
    , len = fns.length
    , i;
  if (!len) return;
  this._pendingUpdates = [];
  for (i = 0; i < len; i++) {
    fns[i]();
  }
}

, getMethods: {
    attr: getAttr
  , prop: getProp
  , propPolite: getProp
  , html: getHtml
    // These methods return NaN, because it never equals anything else. Thus,
    // when compared against the new value, the new value will always be set
  , append: getNaN
  , insert: getNaN
  , remove: getNaN
  , move: getNaN
  }

, setMethods: {
    attr: setAttr
  , prop: setProp
  , propPolite: setProp
  , html: setHtml
  , append: setAppend
  , insert: setInsert
  , remove: setRemove
  , move: setMove
  }

, fns: {
    $forChildren: forChildren
  , $forName: forName
  }
}


function getAttr(el, attr) {
  return el.getAttribute(attr);
}
function getProp(el, prop) {
  return el[prop];
}
function getHtml(el) {
  return el.innerHTML;
}
function getNaN() {
  return NaN;
}

function setAttr(el, ignore, value, attr) {
  if (ignore && el.id === ignore) return;
  el.setAttribute(attr, value);
}
function setProp(el, ignore, value, prop) {
  if (ignore && el.id === ignore) return;
  el[prop] = value;
}
function propPolite(el, ignore, value, prop) {
  if (ignore && el.id === ignore) return;
  if (el !== doc.activeElement || !doc.hasFocus()) {
    el[prop] = value;
  }
}
function setHtml(obj, ignore, value, escape) {
  if (escape) value = escapeHtml(value);
  if (obj.nodeType) {
    // Element
    if (ignore && obj.id === ignore) return;
    obj.innerHTML = value;
  } else {
    // Range
    obj.deleteContents();
    obj.insertNode(obj.createContextualFragment(value));
  }
}
function setAppend(obj, ignore, value, escape) {
  if (escape) value = escapeHtml(value);
  if (obj.nodeType) {
    // Element
    obj.insertAdjacentHTML('beforeend', value);
  } else {
    // Range
    var el = obj.endContainer
      , ref = el.childNodes[obj.endOffset];
    el.insertBefore(obj.createContextualFragment(value), ref);
  }
}
function setInsert(obj, ignore, value, escape, index) {
  if (escape) value = escapeHtml(value);
  if (obj.nodeType) {
    // Element
    if (ref = obj.childNodes[index]) {
      ref.insertAdjacentHTML('beforebegin', value);
    } else {
      obj.insertAdjacentHTML('beforeend', value);
    }
  } else {
    // Range
    var el = obj.startContainer
      , ref = el.childNodes[obj.startOffset + index];
    el.insertBefore(obj.createContextualFragment(value), ref);
  }
}
function setRemove(el, ignore, index) {
  if (!el.nodeType) {
    // Range
    index += el.startOffset;
    el = el.startContainer;
  }
  var child = el.childNodes[index];
  if (child) el.removeChild(child);
}
function setMove(el, ignore, from, to, howMany) {
  var child, fragment, nextChild, offset, ref, toEl;
  if (!el.nodeType) {
    offset = el.startOffset;
    from += offset;
    to += offset;
    el = el.startContainer;
  }
  child = el.childNodes[from];

  // Don't move if the item at the destination is passed as the ignore
  // option, since this indicates the intended item was already moved
  // Also don't move if the child to move matches the ignore option
  if (!child || ignore && (toEl = el.childNodes[to]) &&
      toEl.id === ignore || child.id === ignore) return;

  ref = el.childNodes[to > from ? to + howMany : to];
  if (howMany > 1) {
    fragment = document.createDocumentFragment();
    while (howMany--) {
      nextChild = child.nextSibling;
      fragment.appendChild(child);
      if (!(child = nextChild)) break;
    }
    el.insertBefore(fragment, ref);
    return;
  }
  el.insertBefore(child, ref);
}

function forChildren(e, el, next, dom) {
  // Prevent infinte emission
  if (!next.firstTrigger) return;

  // Re-trigger the event on all child elements
  var children = el.childNodes;
  for (var i = 0, len = children.length, child; i < len; i++) {
    child = children[i];
    if (child.nodeType !== 1) continue;  // Node.ELEMENT_NODE
    dom.trigger(e, child, true, true);
    forChildren(e, child, next, dom);
  }
}

function forName(e, el, next, dom) {
  // Prevent infinte emission
  if (!next.firstTrigger) return;

  var name = el.getAttribute('name');
  if (!name) return;

  // Re-trigger the event on all other elements with
  // the same 'name' attribute
  var elements = doc.getElementsByName(name)
    , len = elements.length;
  if (!(len > 1)) return;
  for (var i = 0, element; i < len; i++) {
    element = elements[i];
    if (element === el) continue;
    dom.trigger(e, element, false, true);
  }
}

function getRange(name) {
  var start = markers[name]
    , end = markers['$' + name]
    , comment, commentIterator, range;

  if (!(start && end)) {
    // NodeFilter.SHOW_COMMENT == 128
    commentIterator = doc.createTreeWalker(doc.body, 128, null, false);
    while (comment = commentIterator.nextNode()) {
      markers[comment.data] = comment;
    }
    start = markers[name];
    end = markers['$' + name];
    if (!(start && end)) return;
  }

  // Comment nodes may continue to exist even if they have been removed from
  // the page. Thus, make sure they are still somewhere in the page body
  if (!doc.contains(start)) {
    delete markers[name];
    delete markers['$' + name];
    return;
  }
  range = doc.createRange();
  range.setStartAfter(start);
  range.setEndBefore(end);
  return range;
}

if (doc.addEventListener) {
  addListener = function(el, name, callback, captures) {
    el.addEventListener(name, callback, captures || false);
  };
  removeListener = function(el, name, callback, captures) {
    el.removeEventListener(name, callback, captures || false);
  };

} else if (doc.attachEvent) {
  addListener = function(el, name, callback) {
    function listener() {
      if (!event.target) event.target = event.srcElement;
      callback(event);
    }
    callback.$derbyListener = listener;
    el.attachEvent('on' + name, listener);
  };
  removeListener = function(el, name, callback) {
    el.detachEvent('on' + name, callback.$derbyListener);
  };
}
});

require.define("/node_modules/derby/node_modules/dom-shim/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./lib/index.js"}});

require.define("/node_modules/derby/node_modules/dom-shim/lib/index.js",function(require,module,exports,__dirname,__filename,process){var doc = document
  , elementProto = HTMLElement.prototype
  , nodeProto = Node.prototype

// Add support for Node.contains for Firefox < 9
if (!doc.contains) {
  nodeProto.contains = function(node) {
    return !!(this.compareDocumentPosition(node) & 16)
  }
}

// Add support for insertAdjacentHTML for Firefox < 8
// Based on insertAdjacentHTML.js by Eli Grey, http://eligrey.com
if (!doc.body.insertAdjacentHTML) {
  elementProto.insertAdjacentHTML = function(position, html) {
    var position = position.toLowerCase()
      , ref = this
      , parent = ref.parentNode
      , container = doc.createElement(parent.tagName)
      , firstChild, nextSibling, node

    container.innerHTML = html
    if (position === 'beforeend') {
      while (node = container.firstChild) {
        ref.appendChild(node)
      }
    } else if (position === 'beforebegin') {
      while (node = container.firstChild) {
        parent.insertBefore(node, ref)
      }
    } else if (position === 'afterend') {
      nextSibling = ref.nextSibling
      while (node = container.lastChild) {
        nextSibling = parent.insertBefore(node, nextSibling)
      }
    } else if (position === 'afterbegin') {
      firstChild = ref.firstChild
      while (node = container.lastChild) {
        firstChild = ref.insertBefore(node, firstChild)
      }
    }
  }
}
});

require.define("/node_modules/derby/lib/refresh.js",function(require,module,exports,__dirname,__filename,process){var escapeHtml = require('html-util').escapeHtml
  , errors = {};

exports.errorHtml = errorHtml;
exports.autoRefresh = autoRefresh;

function errorHtml(errors) {
  var text = ''
    , type, err;
  for (type in errors) {
    err = errors[type];
    text += '<h3>' + escapeHtml(type) + ' Error</h3><pre>' + escapeHtml(err) + '</pre>';
  }
  if (!text) return;
  return '<div id=$_derbyError style="position:absolute;background:rgba(0,0,0,.7);top:0;left:0;right:0;bottom:0;text-align:center">' +
    '<div style="background:#fff;padding:20px 40px;margin:60px;display:inline-block;text-align:left">' +
    text + '</div></div>';
}

function autoRefresh(view, model, appHash) {
  var socket = model.socket;

  model.on('connectionStatus', function(connected, canConnect) {
    if (!canConnect) window.location.reload(true);
  });
  socket.on('connect', function() {
    socket.emit('derbyClient', appHash, function(reload) {
      if (reload) window.location.reload(true);
    });
  });

  socket.on('refreshCss', function(err, css) {
    var el = document.getElementById('$_css');
    if (el) el.innerHTML = css;
    updateError('CSS', err);
  });

  socket.on('refreshHtml', function(err, templates, instances, libraryData) {
    view._makeAll(templates, instances);
    view._makeComponents(libraryData);
    try {
      view.dom._preventUpdates = true;
      view.history.refresh();
    } catch (_err) {
      err || (err = _err.stack);
    }
    updateError('Template', err);
  });
}

function updateError(type, err) {
  if (err) {
    errors[type] = err;
  } else {
    delete errors[type];
  }
  var el = document.getElementById('$_derbyError')
    , html = errorHtml(errors)
    , fragment, range;
  if (html) {
    if (el) {
      el.outerHTML = html;
    } else {
      range = document.createRange();
      range.selectNode(document.body);
      fragment = range.createContextualFragment(html);
      document.body.appendChild(fragment);
    }
  } else {
    if (el) el.parentNode.removeChild(el);
  }
}
});

require.define("/lib/app/index.js",function(require,module,exports,__dirname,__filename,process){var app = require('derby').createApp(module)
  , get = app.get
  , view = app.view
  , ready = app.ready
;

// ROUTES //

// Derby routes can be rendered on the client and the server
get('/', function(page, model, params) {
  
  var docId = 0; // just use a static document for now

  // Subscribes the model to any updates on this doc's object. Calls back
  // with a scoped model equivalent to:
  //   doc = model.at('document.' + docId)
  model.subscribe('document.' + docId, function(err, doc) {
    // Render will use the model data as well as an optional context object
    page.render({
      // TODO do we need anything in the context?
    });
  })
});


// CONTROLLER FUNCTIONS //

ready(function(model) {
  exports.foo = function(){
    console.log("foo");
  }
})
});
require("/lib/app/index.js");

;(function() {
var view = require("derby").view;
view._makeAll({
  "app/index.html:body": "<h1>Factoid</h1><p>We don't do much, but we look good doing it.</p><div id=\"info\"></div><div id=\"content\"></div>",
  "app/index.html:header": "",
  "app/index.html:title": "Factoid"
}, {
  "body": [
  "app/index.html:body",
  {}
],
  "header": [
  "app/index.html:header",
  {}
],
  "title": [
  "app/index.html:title",
  {}
],
  "undefined": [
  "app/index.html:undefined",
  null
]
});
view._makeComponents({});
})();