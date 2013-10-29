// this just lets us know the port used for the server

var packageJson = require('./package.json');

module.exports = {
	port: packageJson.port,
	tmUrlBase: packageJson.tmUrlBase
};