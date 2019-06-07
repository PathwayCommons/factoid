#!/bin/bash

# Dump and restore data within Docker volumes
# Used with Docker version 18.09.6

################################# VARS #################################
TIMESTAMP=`date "+%Y%m%d_%H%M%S"`

## Output folder
ARCHIVE_DUMP_DIRECTORY=$(pwd)

## Database (DB)
DB_VOLUME_NAME=dbdata 
DB_DATA_DIRECTORY=/data
DB_DUMP_ARCHIVE_NAME=db_archive_${TIMESTAMP}.tar.gz
DB_SOURCE_ARCHIVE_DIRECTORY=$(pwd)
DB_SOURCE_ARCHIVE_NAME=db_archive_20190606_205313.tar.gz

## Index (IN)
IN_VOLUME_NAME=indata
IN_DATA_DIRECTORY=/usr/share/elasticsearch/data
IN_DUMP_ARCHIVE_NAME=in_archive_${TIMESTAMP}.tar.gz
IN_SOURCE_ARCHIVE_DIRECTORY=$(pwd)
IN_SOURCE_ARCHIVE_NAME=in_archive_20190606_205313.tar.gz

################################# BACKUP #################################
## Create gzip archives from data in volumes 

## Database (DB)
# docker run --rm -v ${DB_VOLUME_NAME}:${DB_DATA_DIRECTORY} -v ${ARCHIVE_DUMP_DIRECTORY}:/backup ubuntu \
#   tar czvf /backup/${DB_DUMP_ARCHIVE_NAME} ${DB_DATA_DIRECTORY}

## Index (IN)
# docker run --rm -v ${IN_VOLUME_NAME}:${IN_DATA_DIRECTORY} -v ${ARCHIVE_DUMP_DIRECTORY}:/backup ubuntu \
#   tar czvf /backup/${IN_DUMP_ARCHIVE_NAME} ${IN_DATA_DIRECTORY}

################################ RESTORE #################################
## Create named volumes and populate from gzip archive

## Database (DB)
# docker volume create ${DB_VOLUME_NAME}
# docker run --rm -v ${DB_VOLUME_NAME}:${DB_DATA_DIRECTORY} \
#   -v ${DB_SOURCE_ARCHIVE_DIRECTORY}/${DB_SOURCE_ARCHIVE_NAME}:/backup/${DB_SOURCE_ARCHIVE_NAME} ubuntu \
#   bash -c "cd ${DB_DATA_DIRECTORY} && tar xvfz /backup/${DB_SOURCE_ARCHIVE_NAME} --strip-components=1"

## Index (IN)
# docker volume create ${IN_VOLUME_NAME}
# docker run --rm -v ${IN_VOLUME_NAME}:${IN_DATA_DIRECTORY} \
#   -v ${IN_SOURCE_ARCHIVE_DIRECTORY}/${IN_SOURCE_ARCHIVE_NAME}:/backup/${IN_SOURCE_ARCHIVE_NAME} ubuntu \
#   bash -c "tar xvfz /backup/${IN_SOURCE_ARCHIVE_NAME} --strip-components=4  -C ${IN_DATA_DIRECTORY}"

