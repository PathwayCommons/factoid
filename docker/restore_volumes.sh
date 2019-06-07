#!/bin/bash

# Restore data within Docker volumes
# Used with Docker version 18.09.6
#
# Usage 
# > ./restore_volumes.sh <> <>

################################# VARS #################################
# Rethink Database (DB)
DB_VOLUME_NAME=dbdata1
DB_DATA_DIRECTORY=/data
DB_SOURCE_ARCHIVE_PATH=/Users/jeffreywong/Downloads/dbdata_20190607_144326.tar.gz

# Elasticsearch Index (IN)
IN_VOLUME_NAME=indata1
IN_DATA_DIRECTORY=/usr/share/elasticsearch/data
IN_SOURCE_ARCHIVE_PATH=/Users/jeffreywong/Downloads/indata_20190607_144326.tar.gz

############################### RESTORE #################################
# Create named volumes and populate from gzip archive

# Database (DB)
docker volume create ${DB_VOLUME_NAME}
docker run --rm -v ${DB_VOLUME_NAME}:${DB_DATA_DIRECTORY} \
  -v ${DB_SOURCE_ARCHIVE_PATH}:/backup/$(basename ${DB_SOURCE_ARCHIVE_PATH})  ubuntu \
  bash -c "cd ${DB_DATA_DIRECTORY} && tar xvfz /backup/$(basename ${DB_SOURCE_ARCHIVE_PATH}) --strip-components=1"

# Index (IN)
docker volume create ${IN_VOLUME_NAME}
docker run --rm -v ${IN_VOLUME_NAME}:${IN_DATA_DIRECTORY} \
  -v ${IN_SOURCE_ARCHIVE_PATH}:/backup/$(basename ${IN_SOURCE_ARCHIVE_PATH})  ubuntu \
  bash -c "tar xvfz /backup/$(basename ${IN_SOURCE_ARCHIVE_PATH}) --strip-components=4  -C ${IN_DATA_DIRECTORY}"

