#!/bin/bash

# NAME
#   dump_rethinkdb
#
# SYNOPSIS:
#   dump_rethinkdb.sh -c container -e export -n name -d directory
#
# DESCRIPTION:
#   Dump data within Rethinkdb Docker container to archive.
#   Assume
#    - host and client port of the node to connect to is 'localhost:28015'
#    - no password
#    - overwrite any exists database/table
#    - Working directory of container is '/data'
#   Used with Docker version 18.09.6
#
#   -c container (required)
#     The container name
#   -e export (optional)
#     Limit the dump to the given database and/or table; Use dot notation e.g. 'test.authors'
#   -n name (optional)
#     The dump archive name; .tar.gz will be appended
#   -d directory (optional)
#     Output to the specified directory on the host; defaults to `pwd`

################################# VARS #################################
TIMESTAMP=`date "+%Y%m%d_%H%M%S"`
ARCHIVE_OUTPUT_DIRECTORY=$(pwd)
RETHINKDB_DATA_DIRECTORY='/data'
DUMP_ARCHIVE_NAME=rethinkdb_dump_${TIMESTAMP}.tar.gz
################################# OPTS #################################
cval=
eval=
nval=
dval=
while getopts 'c:e:n:d:' OPTION
do
  case $OPTION in
    c)  cval=1
        CONTAINER_NAME="$OPTARG"
        if ! docker container ls --format ‘{{.Names}}’ | grep -wq "${CONTAINER_NAME}"; then
          printf 'Option -n "%s" is not a container\n' "${CONTAINER_NAME}"
          exit 2
        fi
        ;;

    e)  eval=1
        DB_TABLE="$OPTARG"
        ;;

    n)  nval=1
        DUMP_ARCHIVE_NAME="$OPTARG".tar.gz
        ;;

    d)  dval=1
        ARCHIVE_OUTPUT_DIRECTORY="$OPTARG"
        if [ ! -d "${ARCHIVE_OUTPUT_DIRECTORY}" ]; then
          printf 'Option -d "%s" is not a directory\n' ${ARCHIVE_OUTPUT_DIRECTORY}
          exit 2
        fi
        ;;

    ?)  printf "Usage: %s -c container [-e export] [-n name] [-d directory]\n" $0 >&2
        exit 2
        ;;

  esac
done


################################ BACKUP #################################
if [ "$cval" ]; then
  DUMP_CMD="rethinkdb dump -f ${DUMP_ARCHIVE_NAME}"
  if [ "$eval" ]; then DUMP_CMD+=" -e ${DB_TABLE}"; fi
  docker exec ${CONTAINER_NAME} /bin/bash -c "${DUMP_CMD}"
  docker cp ${CONTAINER_NAME}:${RETHINKDB_DATA_DIRECTORY}/${DUMP_ARCHIVE_NAME} ${ARCHIVE_OUTPUT_DIRECTORY}
  docker exec ${CONTAINER_NAME} /bin/bash -c "rm ${RETHINKDB_DATA_DIRECTORY}/${DUMP_ARCHIVE_NAME}"
else
  printf "Usage: %s -c container [-e export] [-n name] [-d directory]\n" $0 >&2
  exit 2
fi