# Factoid

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
- `API_KEY` : used to restrict new document creation (e.g. `8365E63B-9A20-4661-AED8-EDB1296B657F`)

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
- `PC_URL` : base url for pathway commons apps, to search or link
- `BIOPAX_CONVERTER_URL` : url for the factoid to biopax/sbgn converter
- `GROUNDING_SEARCH_BASE_URL`: url for the [grounding service](https://github.com/PathwayCommons/grounding-search)

Links:

- `UNIPROT_LINK_BASE_URL` : base url concatenated to id to generate a linkout
- `CHEBI_LINK_BASE_URL`: base url concatenated to id to generate a linkout
- `PUBCHEM_LINK_BASE_URL`: base url concatenated to id to generate a linkout
- `NCBI_LINK_BASE_URL`: base url concatenated to id to generate a linkout

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

### Requirements

Dockerized system has been successfully deployed on:
  - Ubuntu 16.04.5 LTS (GNU/Linux 4.4.0-145-generic x86_64)
    - Docker version 18.09.6
    - docker-compose version 1.24.0
  - OSX 10.14.5 (Mojave)
    - Docker version 18.09.2
    - docker-compose version 1.23.2

### Docker Compose

In the directory containing the `docker-compose.yml` file, execute:

```sh
docker-compose run -d
```

Monitor stdout of the system:

```sh
docker-compose logs -f -t
```

Stop and remove services:
```sh
docker-compose down
```

Restarting after the app services have been stopped (index exists):
```sh
docker-compose up -d webapp grounding db index
```


#### Notes

- Environment variables:
  - Docker Compose will draw environment variables from the shell or from an `.env` file in the same directory. The file is not necessary, as the compose file provides defaults.  If you wish, edit the `.env` file to configure environment variables for image tags, container ports and others, which will be passed to the containers.

- Indexing service:
  - The `indexer` service will download sources files and index. The time required for this will vary depending on the system and ranges from tens of minutes (OSX 10.14.5 (Mojave), MacBook Pro (Retina, 15-inch, Mid 2015). 2.8 GHz Intel Core i7) up to many hours (Ubuntu 16.04.5 LTS, Intel(R) Xeon(R) CPU E5-2697A v4 @ 2.60GHz).

- Database service:
  - Do not restart a stopped container. Rather, remove and run anew.

- OS specifics:
  - For Ubuntu 16.04.5 LTS to [play nice with elasticsearch](https://github.com/docker-library/elasticsearch/issues/111#issuecomment-268511769) needed to set `sudo sysctl -w vm.max_map_count=262144`.

### Backup and restore volumes

#### Backup

NB: RethinkDB backups should be created using the [dump](https://rethinkdb.com/docs/backup/) command line utility.

To create an archive of data in volumes used by RethinkDB or Elasticsearch, use the supplied bash script `/docker/backup_volumes.sh`.

Dump the RethinkDB data inside a volume named `dbdata` at a directory `/data` within the volume to an archive in a directory on the host named the `/backups`:

```sh
./backup_volumes.sh -n dbdata -p /data -o /backups
```

Dump the Elasticsearch data inside a volume named `indata` at a directory `/usr/share/elasticsearch/data` within the volume to an archive in a directory on the host named the `/backups`:

```sh
./backup_volumes.sh -n indata -p /usr/share/elasticsearch/data -o /backups
```

#### Restore

To populate a volume for RethinkDB or Elasticsearch from an archive, use the supplied bash script `/docker/restore_volumes.sh`.

Restore RethinkDB data to a volume `dbdata` at a directory `/data` within the volume from an archive on the host `/backups/dbbackup.tar.gz`:

```sh
./restore_volumes.sh -n dbdata -p /data -s /backups/dbbackup.tar.gz
```

Restore Elasticsearch data to a volume `indata` at a directory `/usr/share/elasticsearch/data` within the volume from an archive on the host `/backups/inbackup.tar.gz`:

```sh
./restore_volumes.sh -n indata -p /usr/share/elasticsearch/data -s /backups/inbackup.tar.gz
```

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
