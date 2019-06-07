#!/bin/bash

# NAME
#   backup_volumes
#
# SYNOPSIS:
#   backup_volumes.sh [-d name] [-i name] [-o path]
#
# DESCRIPTION:
#   Dump database data within Docker volumes to compressed archive. Used with Docker version 18.09.6
#   -d name
#     Dump the database within the specified named volume
#   -i name 
#     Dump the index within the specified named volume
#   -o path 
#     Output to specified host path; Defaults to pwd 

################################# VARS #################################
TIMESTAMP=`date "+%Y%m%d_%H%M%S"`
ARCHIVE_OUTPUT_DIRECTORY=$(pwd)

# Rethink Database (DB)
DB_DATA_DIRECTORY=/data

# Elasticsearch Index (IN)
IN_DATA_DIRECTORY=/usr/share/elasticsearch/data

################################# OPTS #################################
dflag=
iflag=
oflag=
while getopts 'd:i:o:' OPTION
do
  case $OPTION in
    d)  dflag=1
        DB_VOLUME_NAME="$OPTARG"
        if ! docker volume ls -q | grep -wq "${DB_VOLUME_NAME}"; then
          printf 'Option -d "%s" is not a volume\n' "${DB_VOLUME_NAME}"
          exit 2
        fi
        DB_DUMP_ARCHIVE_NAME=${DB_VOLUME_NAME}_${TIMESTAMP}.tar.gz
        ;;

    i)  iflag=1
        IN_VOLUME_NAME="$OPTARG"
        if ! docker volume ls -q | grep -wq "${IN_VOLUME_NAME}"; then
          printf 'Option -i "%s" is not a volume\n' "${IN_VOLUME_NAME}"
          exit 2
        fi
        IN_DUMP_ARCHIVE_NAME="${IN_VOLUME_NAME}"_${TIMESTAMP}.tar.gz
        ;;
        
    o)  oflag=1
        ARCHIVE_OUTPUT_DIRECTORY="$OPTARG"
        if [ ! -d "${ARCHIVE_OUTPUT_DIRECTORY}" ]; then
          printf 'Option -o "%s" is not a directory\n' ${ARCHIVE_OUTPUT_DIRECTORY}
          exit 2
        fi
        ;;

    ?)  printf "Usage: %s [-d] [-i] [-o /path/to/output]\n" $0 >&2
        exit 2
        ;; 

  esac
done


################################ BACKUP #################################
# Create gzip archives from data in volumes 

# Database (DB)
if [ "$dflag" ]; then
  docker run --rm -v ${DB_VOLUME_NAME}:${DB_DATA_DIRECTORY} \
    -v ${ARCHIVE_OUTPUT_DIRECTORY}:/backup ubuntu \
    tar czvf /backup/${DB_DUMP_ARCHIVE_NAME} ${DB_DATA_DIRECTORY}
fi

# Index (IN)
if [ "$iflag" ]; then
  docker run --rm -v ${IN_VOLUME_NAME}:${IN_DATA_DIRECTORY} \
    -v ${ARCHIVE_OUTPUT_DIRECTORY}:/backup ubuntu \
    tar czvf /backup/${IN_DUMP_ARCHIVE_NAME} ${IN_DATA_DIRECTORY}
fi
