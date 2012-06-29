// we can just do plain require() for these libs since they assign themselves under `window`
require('./jquery-1.7.2');
window._ = require("./underscore")._;
require("./jquery.extendo");
require("./cytoscape.all");
