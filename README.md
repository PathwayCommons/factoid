# Factoid



## Dependencies

- [Node.js](https://nodejs.org/en/) >=6.3.0
- [RethinkDB](http://rethinkdb.com/) ^2.3.0



## Configuration

The following environment variables can be used to configure the server:

- `NODE_ENV` : the environment mode, either `production` or `development` (default)
- `PORT` : the port on which the server runs (default 3000)



## Run targets

- `npm start` : start the server
- `npm stop` : stop the server
- `npm test` or `gulp test` : run tests
- `npm run build` or `gulp build` : build the clientside
- `npm run clean` : clean the clientside
- `npm run watch`, `gulp watch`, or `gulp` : watch mode (debug mode enabled, auto rebuild, livereload)



## Adding dependencies

Serverside only:

```
npm install --save pkg-name
```

Clientside (or both clientside and serverside):

```
npm install --save --save-bundled pkg-name
```

N.B.: Only modules that specify `--save-bundled` can be `require()`d on the clientside.  In order to keep debug watch fast, it's necessary to maintain the client dependencies in `bundledDependencies` in `package.json`.  This also allows for shipping updates to the app without busting the cache for the dependencies on clients.



## Adding tests

All files `/test` will be run by Mocha.  You can `npm test` to run all tests, or you can run `mocha -g specific-test-name` (prerequisite: `npm install -g mocha`) to run specific tests.
