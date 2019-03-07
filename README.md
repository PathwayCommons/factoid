# Factoid

[![Greenkeeper badge](https://badges.greenkeeper.io/PathwayCommons/factoid.svg)](https://greenkeeper.io/)

## Required software

- [Node.js](https://nodejs.org/en/) >=6.3.0
- [RethinkDB](http://rethinkdb.com/) ^2.3.0

## Configuration

The following environment variables can be used to configure the server:

General:

- `NODE_ENV` : the environment mode; either `production` or `development` (default)
- `PORT` : the port on which the server runs (default `3000`)
- `LOG_LEVEL` : minimum log level; one of `info` (default), `warn`, `error`
- `BASE_URL` : used for email linkouts (e.g. `https://factoid.baderlab.org`)

Database:

- `DB_NAME` : name of the db (default `factoid`)
- `DB_HOST` : hostname or ip address of the database host (default `localhost`)
- `DB_PORT` : port where the db can be accessed (default `28015`, the rethinkdb default)
- `DB_USER` : username if the db uses auth (undefined by default)
- `DB_PASS` : password if the db uses auth (undefined by default)
- `DB_CERT` : local file path to certificate (cert) file if the db uses ssl (undefined by default)

Services:

- `DEFAULT_CACHE_SIZE` : default max number of entries in each cache
- `REACH_URL` : full url of the reach textmining endpoint
- `UNIPROT_URL` : full url of uniprot query service
- `UNIPROT_LINK_BASE_URL` : base url concatenated to id to generate a linkout
- `UNIPROT_CACHE_SIZE` : overrides default cache size for uniprot query cache
- `CHEBI_WSDL_URL`: url for chebi webservices
- `CHEBI_JAVA_PACKAGE`: chebi java package namespace
- `CHEBI_LINK_BASE_URL`: base url concatenated to id to generate a linkout
- `CHEBI_CACHE_SIZE`: overrides default cache size of chebi query cache
- `PUBCHEM_BASE_URL`: base webservices url for pubchem
- `PUBCHEM_LINK_BASE_URL`: base url concatenated to id to generate a linkout
- `PUBCHEM_CACHE_SIZE`: overrides default cache size of pubchem query cache,
- `AGGREGATE_CACHE_SIZE`: overrides default cache size for aggregate searches across all entity types
- `MAX_SEARCH_SIZE`: max number of entities returned for each entity lookup/search service
- `PC_URL` : base url for pathway commons apps, to search or link
- `BIOPAX_CONVERTER_URL` : url for the factoid to biopax/sbgn converter

## Run targets

- `npm start` : start the server
- `npm stop` : stop the server
- `npm run build` : build project
- `npm run build-prod` : build the project for production
- `npm run bundle-profile` : visualise the bundle dependencies
- `npm run clean` : clean the project
- `npm run watch` : watch mode (debug mode enabled, auto rebuild, livereload)
- `npm test` : run tests
- `npm run lint` : lint the project
- `npm run fix` : fix minor linting errors (ones that can be automatically fixed)

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

Or run with an env file that defines the environment variables:

```
docker run -it -p 12345:3000 -u "node" --env-file prod.env --name "factoid" factoid
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
