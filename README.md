# Factoid

Biofactoid [(biofactoid.org)](https://biofactoid.org/), is a web-based system that empowers authors to capture and share machine-readable summaries of molecular-level interactions described in their publications.

## Getting the data

All contributed pathway data is freely available for download at https://biofactoid.org/api/document/zip which contains files for each pathway represented in:
  - JavaScript Object Notation (JSON). This is the native format for Biofactoid data and contains interaction data, metadata of the record itself, metadata of the corresponding article, and visualisation data (layout and colors as Cytoscape JSON (Franz et al. (2016) Bioinforma. Oxf. Engl., 32, 309–311.)).
  - [Biological Pathway Exchange (BioPAX)](http://www.biopax.org/) (Demir et al. (2010) Biotechnol., 28, 935–942.) for detailed semantic exchange.
  - [Systems Biology Graphical Notation Markup Language (SBGNML)](https://sbgn.github.io/), a format that supports biological process visualization (Le Novère et al. Nat. Biotechnol., 27, 735–741. (2009); van Iersel et al. (2012) Bioinforma. Oxf. Engl., 28, 2016–2021.)

## Required software

- [Node.js](https://nodejs.org/en/) >=10
- [RethinkDB](http://rethinkdb.com/) ^2.3.0

## Configuration

The following environment variables can be used to configure the server:

General:

- `NODE_ENV` : the environment mode; either `production` or `development` (default)
- `PORT` : the port on which the server runs (default `3000`)
- `LOG_LEVEL` : minimum log level; one of `info` (default), `warn`, `error`
- `BASE_URL` : used for email linkouts (e.g. `https://factoid.baderlab.org`)
- `API_KEY` : used to restrict new document creation (e.g. `8365E63B-9A20-4661-AED8-EDB1296B657F`)

CRON:

- `CRON_SCHEDULE` : second (optional), minute, hour, day of month, month, day of week
- `DOCUMENT_CRON_UPDATE_PERIOD_DAYS` : The minimum time between successive Document cron update calls
- `DOCUMENT_CRON_CREATED_AGE_DAYS` : Only Documents created fewer than this many days will be selecte for update. When undefined (default), ignores filtering on creation date.
- `DOCUMENT_CRON_REFRESH_ENABLED` : Flag to enable existing Document metadata to be refreshed (e.g. PubMed UID) (default true).

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
- `NCBI_EUTILS_BASE_URL` : url for the NCBI E-utilities
- `NCBI_EUTILS_API_KEY` : API key for the NCBI E-utilities
- `INDRA_DB_BASE_URL` : url for [INDRA (Integrated Network and Dynamical Reasoning Assembler)](https://indralab.github.io/)
- `INDRA_ENGLISH_ASSEMBLER_URL` : url for service that assembles INDRA statements into models
- `SEMANTIC_SEARCH_BASE_URL` : url for [semantic-search](https://github.com/PathwayCommons/semantic-search) web service
- `NO_ABSTRACT_HANDLING` : labels directing how to sort documents missing query text. 'text' (default): autogenerate text from templates; 'date': sort by date and ignore text.

Links:

- `UNIPROT_LINK_BASE_URL` : base url concatenated to id to generate a linkout
- `CHEBI_LINK_BASE_URL`: base url concatenated to id to generate a linkout
- `PUBCHEM_LINK_BASE_URL`: base url concatenated to id to generate a linkout
- `NCBI_LINK_BASE_URL`: base url concatenated to id to generate a linkout
- `PUBMED_LINK_BASE_URL`: base url concatenated to unique id to generate linkout
- `DOI_LINK_BASE_URL`: base url concatenated to doi to generate linkout
- `GOOGLE_SCHOLAR_BASE_URL` : base url concatenated to doi, title, or pmid to generate linkout

Demo:

- `DEMO_ID` : the demo document id (default `demo`)
- `DEMO_SECRET` : the demo document secret (default `demo`)
- `DEMO_JOURNAL_NAME` : the journal name for the demo doc
- `DEMO_AUTHOR` : the author display name for the demo doc
- `DEMO_TITLE` : the title of the demo doc's article
- `DEMO_CAN_BE_SHARED` : whether the demo can be shared (default `false`)
- `DEMO_CAN_BE_SHARED_MULTIPLE_TIMES` : whether the demo can be shared multiple times (normal docs can be shared only once; default `false`)
- `SAMPLE_DOC_ID` : id for document that is used as homepage example (production)

Sharing:

- `DOCUMENT_IMAGE_WIDTH` : tweet card image width
- `DOCUMENT_IMAGE_HEIGHT` : tweet card image height
- `DOCUMENT_IMAGE_PADDING` : padding around tweet card image (prevents twitter cropping issues)
- `TWITTER_ACCOUNT_NAME` : twitter account visible on card
- `TWITTER_CONSUMER_KEY` : twitter api key
- `TWITTER_CONSUMER_SECRET` : twitter api secret
- `TWITTER_ACCESS_TOKEN_KEY` : twitter app key
- `TWITTER_ACCESS_TOKEN_SECRET` : twitter app secret
- `MAX_TWEET_LENGTH` : max characters a user can type as a share caption

Email:

- `EMAIL_ENABLED`: boolean to enable third-party mail service (default `false`)
- `EMAIL_FROM`: name to send emails from (default `Biofactoid`)
- `EMAIL_FROM_ADDR`: address to send emails from (default `support@biofactoid.org`)
- `SMTP_PORT`: mail transport port (default `587`)
- `SMTP_HOST`: mail transport host (default `localhost`)
- `SMTP_USER`: mail transport auth user
- `SMTP_PASSWORD`: mail transport auth password
- `EMAIL_VENDOR_MAILJET`: name of Mailjet vendor
- `MAILJET_TMPLID_INVITE`: vendor email template id for an invitation
- `MAILJET_TMPLID_FOLLOWUP`: vendor email template id for a follow-up
- `MAILJET_TMPLID_REQUEST_ISSUE`: vendor email template id for a request error notification
- `EMAIL_TYPE_INVITE`:  name to indicate invite email
- `EMAIL_TYPE_FOLLOWUP`: name to indicate follow-up email
- `EMAIL_TYPE_REQUEST_ISSUE`: name to indicate request error email
- `EMAIL_SUBJECT_INVITE`: subject text for invitation email
- `EMAIL_SUBJECT_FOLLOWUP`: subject text for follow-up email
- `EMAIL_SUBJECT_REQUEST_ISSUE`: subject text for request error email

The following environment variables should always be set in production instances:

- `NODE_ENV` : set to `production`
- `BASE_URL` : the production url
- `API_KEY` : set to a uuid that you keep secret (used in management panel)
- `TWITTER_ACCOUNT_NAME` : twitter account visible on card
- `TWITTER_CONSUMER_KEY` : twitter api key
- `TWITTER_CONSUMER_SECRET` : twitter api secret
- `TWITTER_ACCESS_TOKEN_KEY` : twitter app key
- `TWITTER_ACCESS_TOKEN_SECRET` : twitter app secret
- `NCBI_EUTILS_API_KEY`: the API key for pathwaycommons account
- `EMAIL_ENABLED`: `true` for Mailjet support
- `SMTP_HOST`: Mailjet host name
- `SMTP_USER`: Mailjet account credentials
- `SMTP_PASSWORD`: Mailjet password credentials

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
  - OSX 10.15.1 (Catalina)
    - Docker version 19.03.5
    - docker-compose version 1.24.1

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
  - Docker Compose will draw environment variables from the shell or from an `.env` file in the same directory. Please see private [remote](https://github.com/BaderLab/sysadmin/blob/master/websites/factoid.md) for production-level file settings.

- Indexing service:
  - The `indexer` service will download sources files and index. The time required for this will vary depending on the system and ranges from tens of minutes (OSX 10.14.5 (Mojave), MacBook Pro (Retina, 15-inch, Mid 2015). 2.8 GHz Intel Core i7) up to many hours (Ubuntu 16.04.5 LTS, Intel(R) Xeon(R) CPU E5-2697A v4 @ 2.60GHz).

- Database service:
  - Do not restart a stopped container. Rather, remove and run anew.

- OS specifics:
  - For Ubuntu 16.04.5 LTS to [play nice with elasticsearch](https://github.com/docker-library/elasticsearch/issues/111#issuecomment-268511769) needed to set `sudo sysctl -w vm.max_map_count=262144`.

### Dump and restore Rethinkdb data

NB: RethinkDB [dump and restore](https://rethinkdb.com/docs/backup/) command-line utility depends on the [Python driver](https://rethinkdb.com/docs/install-drivers/python/). The `docker/Dockerfile-rethinkdb` file documents these requirements.

#### Dump

To create an archive of data in RethinkDB, use the supplied bash script `/docker/dump_rethinkdb.sh`.

- The script accepts four arguments:
  - `-c` (required) The container name
  - `-e` (optional) Limit the dump to the given database and/or table; Use dot notation e.g. 'test.authors'
  - `-n` (optional) The dump archive name; `.tar.gz` will be appended
  - `-d` (optional) Output to the specified directory on the host; defaults to `pwd`

Example: To dump a running container `db_container` with database named `factoid` to an archive named `factoid_dump_latest` in a directory on the host named `/backups`:

```sh
./dump_rethinkdb.sh -c db_container -e factoid -n factoid_dump_latest -d /backups
```

#### Restore

To populate RethinkDB from an archive, use the supplied bash script `/docker/restore_rethinkdb.sh`.

- The script accepts three arguments:
  - `-c` (required) The container name
  - `-f` (required) Archive file path on host
  - `-i` (optional) Limit the restore to the given database and/or table; Use dot notation e.g. 'test.authors'. By default, the script will overwrite any existing database/table data.

Example: To restore a running container `db_container` with database named `factoid` from an archive named `/backups/factoid_dump_latest.tar.gz`:

```sh
./restore_rethinkdb.sh -c db_container -f /backups/factoid_dump_latest.tar.gz -i factoid
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

## Related software

Factoid depends on services whose software we maintain.

- GitHub
  - [grounding-search](https://github.com/PathwayCommons/grounding-search): Disambiguate bio-entities via full-text search
  - [semantic-search](https://github.com/PathwayCommons/semantic-search): Rank texts based on similiarity
  - [factoid-converters](https://github.com/PathwayCommons/factoid-converters): Convert Factoid model JSON to standard languages (BioPAX and SBGN-PD)
- DockerHub
  - [factoid](https://hub.docker.com/r/pathwaycommons/factoid)
  - [grounding-search](hub.docker.com/r/pathwaycommons/grounding-search)
  - [semantic-search](hub.docker.com/repository/docker/pathwaycommons/semantic-search)
  - [factoid-converters](hub.docker.com/repository/docker/pathwaycommons/factoid-converters)
  - [rethinkdb-docker](hub.docker.com/repository/docker/pathwaycommons/rethinkdb-docker): RethinkDB-based image with dependencies for database administration (i.e. dump and restore).
