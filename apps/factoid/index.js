var derby = require('derby');

var app = module.exports = derby.createApp('factoid', __filename);


app.use(require('derby-login/components'));
app.use(require('derby-router'));
app.use(require('derby-debug'));

app.loadViews(__dirname + '/views');
app.loadStyles(__dirname + '/styles');

app.get('home', '/');



app.get('login', '/login');
app.get('register', '/register');

