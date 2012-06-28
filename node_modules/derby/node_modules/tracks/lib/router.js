var qs = require('qs')
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
