#!/bin/bash

# NAME
#  cron-database-dump
#
# SYNOPSIS:
#  cron-database-dump.sh
#
# DESCRIPTION:
#   Dump RethinkDB Docker container's data to a host directory
#   Assumes
#    - Using the pathwaycommons/rethinkdb:2.3.6 image
#    - Used with Docker version 19.03.5, build 633a0ea838
#   Default archive name is rethinkdb_dump_<YYMMDD>_<HHMMSS>.tar.gz
#
################################# VARS #################################
CONTAINER_NAME="db_container"
DB_TABLE="factoid"
ARCHIVE_OUTPUT_DIRECTORY="/home/baderlab/backups/rethinkdb"

# Dump using rethinkdb script for Docker containers
./dump_rethinkdb.sh -c $CONTAINER_NAME -e $DB_TABLE -d $ARCHIVE_OUTPUT_DIRECTORY