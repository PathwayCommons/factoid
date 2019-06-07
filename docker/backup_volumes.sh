#!/bin/bash

# NAME
#   backup_volumes
#
# SYNOPSIS:
#   backup_volumes.sh -n name -p path [-o path]
#
# DESCRIPTION:
#   Dump data within Docker volumes to compressed archive. Used with Docker version 18.09.6
#   -n name (required)
#     The name of the volume
#   -p path (required)
#     Path to the file or directory inside the volume. 
#     For RethinkDB this is "/data"; For elasticearch this is "/usr/share/elasticsearch/data"
#   -o path (optional)
#     Output to specified path; defaults to pwd

################################# VARS #################################
TIMESTAMP=`date "+%Y%m%d_%H%M%S"`
ARCHIVE_OUTPUT_DIRECTORY=$(pwd)

################################# OPTS #################################
nflag=
pflag=
oflag=
while getopts 'n:p:o:' OPTION
do
  case $OPTION in
    n)  nflag=1
        VOLUME_NAME="$OPTARG"
        if ! docker volume ls -q | grep -wq "${VOLUME_NAME}"; then
          printf 'Option -d "%s" is not a volume\n' "${VOLUME_NAME}"
          exit 2
        fi
        DUMP_ARCHIVE_NAME=${VOLUME_NAME}_${TIMESTAMP}.tar.gz
        ;;

    p)  pflag=1
        DATA_DIRECTORY="$OPTARG"
        ;;
        
    o)  oflag=1
        ARCHIVE_OUTPUT_DIRECTORY="$OPTARG"
        if [ ! -d "${ARCHIVE_OUTPUT_DIRECTORY}" ]; then
          printf 'Option -o "%s" is not a directory\n' ${ARCHIVE_OUTPUT_DIRECTORY}
          exit 2
        fi
        ;;

    ?)  printf "Usage: %s -n name -p path [-o path]\n" $0 >&2
        exit 2
        ;; 

  esac
done


################################ BACKUP #################################
# Create gzip archives from data in volumes 
if [ "$nflag" -a "$pflag" ]; then
  docker run --rm -v ${VOLUME_NAME}:${DATA_DIRECTORY} \
    -v ${ARCHIVE_OUTPUT_DIRECTORY}:/backup ubuntu:xenial \
    tar czvf /backup/${DUMP_ARCHIVE_NAME} ${DATA_DIRECTORY}
else 
  printf "Usage: %s -n name -p path [-o path]\n" $0 >&2
  exit 2
fi
