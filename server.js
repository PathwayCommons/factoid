var port = require('./port');

require('derby').run(__dirname + '/lib/server', port);
