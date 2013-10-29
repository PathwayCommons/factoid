var config = require('./config');
var port = config.port;

require('derby').run(__dirname + '/lib/server', port);
