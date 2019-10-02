#!/bin/bash

# NAME
#   restore_rethinkdb
#
# SYNOPSIS:
#   restore_rethinkdb.sh -c container -f file -i import 
#
# DESCRIPTION:
#   Restore data within Rethinkdb Docker container from archive. 
#   Assume
#    - host and client port of the node to connect to is 'localhost:28015'
#    - no password
#    - overwrite any exists database/table
#    - Working directory of container is '/data'
#   Used with Docker version 18.09.6
#
#   -c container (required)
#     The container name 
#   -f file (required)
#     Input archive file path on host
#   -i import (optional)
#     Limit the restore to the given database and/or table; Use dot notation e.g. 'test.authors'

################################# VARS #################################
RETHINKDB_DATA_DIRECTORY='/data'
################################# OPTS #################################
cval=
ival=
fval=
while getopts 'c:i:f:' OPTION
do
  case $OPTION in
    c)  cval=1
        CONTAINER_NAME="$OPTARG"
        if ! docker container ls --format ‘{{.Names}}’ | grep -wq "${CONTAINER_NAME}"; then
          printf 'Option -n "%s" is not a container\n' "${CONTAINER_NAME}"
          exit 2
        fi
        ;;

    f)  fval=1
        ARCHIVE_INPUT_PATH="$OPTARG"
        if [ ! -f "${ARCHIVE_INPUT_PATH}" ]; then
          printf 'Option -f "%s" is not a file\n' ${ARCHIVE_INPUT_PATH}
          exit 2
        fi
        CONTAINER_ARCHIVE_PATH=${RETHINKDB_DATA_DIRECTORY}/$(basename ${ARCHIVE_INPUT_PATH})
        ;;

    i)  ival=1
        DB_TABLE="$OPTARG"
        ;;
        
    ?)  printf "Usage: %s -c container -f file -i import\n" $0 >&2
        exit 2
        ;; 

  esac
done


################################ RESTORE #################################
# Restore from gzip archive 
if [ "$cval" -a "$fval" ]; then
  RESTORE_CMD="rethinkdb restore ${CONTAINER_ARCHIVE_PATH} --force"
  if [ "$ival" ]; then RESTORE_CMD+=" -i ${DB_TABLE}"; fi
  docker cp ${ARCHIVE_INPUT_PATH} ${CONTAINER_NAME}:${RETHINKDB_DATA_DIRECTORY}
  docker exec -it ${CONTAINER_NAME} /bin/bash -c "${RESTORE_CMD}"
  docker exec -it ${CONTAINER_NAME} /bin/bash -c "rm -rf ${CONTAINER_ARCHIVE_PATH}"
else 
  printf "Usage: %s -c container -f file -i import\n" $0 >&2
  exit 2
fi