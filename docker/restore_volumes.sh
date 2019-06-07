#!/bin/bash

# NAME
#   restore_volumes
#
# SYNOPSIS:
#   restore_volumes.sh -n name -p path -s path
#
# DESCRIPTION:
#   Restore data within Docker volumes from compressed archive. Used with Docker version 18.09.6
#   -n name (required)
#     The name of the volume
#   -p path (required)
#     Path to the file or directory inside the volume. 
#     For RethinkDB this is "/data"; For elasticearch this is "/usr/share/elasticsearch/data"
#   -s path (required)
#     Path of the source *.tar.gz file on host 

################################# OPTS #################################
nflag=
pflag=
sflag=
while getopts 'n:p:s:' OPTION
do
  case $OPTION in
    n)  nflag=1
        VOLUME_NAME="$OPTARG"
        ;;

    p)  pflag=1
        DATA_DIRECTORY="$OPTARG"
        IFS='/'; read -ra ADDR <<< "$DATA_DIRECTORY"; IFS=' '
        NUM_COMPONENTS=$((${#ADDR[@]} - 1))
        ;;
        
    s)  sflag=1
        SOURCE_ARCHIVE_PATH="$OPTARG"
        if [ ! -e "${SOURCE_ARCHIVE_PATH}" ]; then
          printf 'Option -s "%s" is not a file\n' ${SOURCE_ARCHIVE_PATH}
          exit 2
        fi
        ;;

    ?)  printf "Usage: %s -n name -p path -s path\n" $0 >&2
        exit 2
        ;; 

  esac
done

############################### RESTORE #################################
# Create named volumes and populate from gzip archive
if [ "$nflag" -a "$pflag" -a "$sflag" ]; then
  docker volume create ${VOLUME_NAME}

  docker run --rm -v ${VOLUME_NAME}:${DATA_DIRECTORY} \
    -v ${SOURCE_ARCHIVE_PATH}:/backup/$(basename ${SOURCE_ARCHIVE_PATH}) \
    ubuntu \
    bash -c "cd ${DATA_DIRECTORY} && tar xvfz /backup/$(basename ${SOURCE_ARCHIVE_PATH}) --strip-components=${NUM_COMPONENTS}"
else 
  printf "Usage: %s -n name -p path -s path\n" $0 >&2
  exit 2
fi
