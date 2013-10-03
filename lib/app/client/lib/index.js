// these libs are included as specified from package.json
window._ = require('underscore');

// we can just do plain require() for most of these libs since they assign themselves under `window`
require('./jquery-1.7.2');
require('./jquery.mobile');
require('./jquery.extendo');
window.cytoscape = require('./cytoscape');
require('./jquery.qtip2');
require('./cytoscape-collection-qtip');
require('./jquery.scrollTo');
require('./jquery.cytoscape-panzoom');
require('./jquery.cytoscape-edgehandles');
require('./jquery.cxtmenu');
require('./jquery.quickeq');
require('./jquery.tourguide');
require('./mousetrap');
//require('./jquery.hotkeys'); // breaks things somehow
require('./BlobBuilder');
require('./FileSaver');