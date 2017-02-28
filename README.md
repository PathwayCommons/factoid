# Factoid



## Required software

- [Node.js](https://nodejs.org/en/) >=6.3.0
- [RethinkDB](http://rethinkdb.com/) ^2.3.0



## Configuration

The following environment variables can be used to configure the server:

- `NODE_ENV` : the environment mode, either `production` or `development` (default)
- `PORT` : the port on which the server runs (default 3000)



## Run targets

- `npm start` : start the server
- `npm stop` : stop the server
- `npm run build` : build project
- `npm run build-prod` : build the project for production
- `npm run clean` : clean the project
- `npm run watch` : watch mode (debug mode enabled, auto rebuild, livereload)
- `npm test` : run tests
- `npm run lint` : lint the project



## Running via Docker

Build the container.  Here, `factoid` is used as the container name.

```
cd factoid
docker build -t factoid .
```

Run the container:

```
docker run -it -p 12345:3000 -u "node" -e "NODE_ENV=production" -e "PORT=3000" --name "factoid" factoid
```

Notes:

- The `-it` switches are necessary to make `node` respond to `ctrl+c` etc. in `docker`.
- The `-p` switch indicates that port 3000 on the container is mapped to port 12345 on the host.  Without this switch, the server is inaccessible.
- The `-u` switch is used so that a non-root user is used inside the container.
- The `-e` switch is used to set environment variables.  Alternatively use `--env-file` to use a file with the environment variables.
- References:
  - [Dockerizing a Node.js web app](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
  - [Documentation of docker-node](https://github.com/nodejs/docker-node)
  - [Docker CLI docs](https://docs.docker.com/engine/reference/commandline/cli/)




## Adding npm dependencies

Serverside only:

```
npm install --save pkg-name

#or
npm i -S pkg-name
```

Clientside (or both clientside and serverside):

```
npm install --save --save-bundled pkg-name

# or
npm i -SB pkg-name
```

N.B.: Only modules that specify `--save-bundled` can be `require()`d on the clientside.  In order to keep debug watch fast, it's necessary to maintain the client dependencies in `bundledDependencies` in `package.json`.  This also allows for shipping updates to the app without busting the cache for the dependencies on clients.

(Using the `bundledDependencies` field in `package.json` in this way isn't strictly how it's intended to be used, but it should be fine since `factoid` will never be published to npm and no one would `require('factoid')`.  (Mis)using `bundledDependencies` in this way lets us just use `npm` commands without editing `package.json` manually, while keeping common dependencies on the same version on the client and the server.)



## Testing

All files `/test` will be run by [Mocha](https://mochajs.org/).  You can `npm test` to run all tests, or you can run `mocha -g specific-test-name` (prerequisite: `npm install -g mocha`) to run specific tests.

The tests expect `rethinkdb` to be running on `localhost` on the default port (28015).

[Chai](http://chaijs.com/) is included to make the tests easier to read and write.

Notes:

- The `Syncher.synch()` is setup separately for each test file and namespaced.  The reason for this is that the tests need to be able to be run independently and previous `Syncher.synch()` calls from other files would otherwise conflict.
- Each test file should `require('./util/conf')` to make debugging with promises easier etc.



## Publishing a release

1. Make sure the tests are passing: `npm test`
1. Make sure the linting is passing: `npm run lint`
1. Bump the version number with `npm version`, in accordance with [semver](http://semver.org/).  The `version` command in `npm` updates both `package.json` and git tags, but note that it uses a `v` prefix on the tags (e.g. `v1.2.3`).
  1. For a bug fix / patch release, run `npm version patch`.
  1. For a new feature release, run `npm version minor`.
  1. For a breaking API change, run `npm version major.`
  1. For a specific version number (e.g. 1.2.3), run `npm version 1.2.3`.
1. Push the release: `git push origin --tags`
