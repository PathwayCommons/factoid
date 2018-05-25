#!/bin/bash

# This is a helper script to set up a very simple CI dev/testing server.  It can
# be used with `cron` in order to set up regular builds, e.g. for every 15 minutes:
#
# `crontab -e`
# 
# @reboot /home/username/rethinkdb.sh > /home/username/rethinkdb.log
# */15 * * * * /home/username/master.sh > /home/username/master.log
#
# To use this script, create a script per server instance, e.g. `master.sh`:
#
# #!/bin/bash
#
# # Mandatory repo/branch conf
# export REPO=https://github.com/PathwayCommons/factoid.git
# export BRANCH=master
#
# # Project-specific env vars
# export PORT=3000
# 
# ./ci.sh

JOB_NAME=$BRANCH
WORKSPACE=/home/`whoami`/$JOB_NAME
WORKSPACE_TMP=/tmp/$JOB_NAME

rm -rf $WORKSPACE_TMP
mkdir -p $WORKSPACE_TMP
cd $WORKSPACE_TMP

# get the repo
git clone $REPO $WORKSPACE_TMP
git checkout $BRANCH

# build
npm install
npm run clean

export NODE_ENV=production

npm run build

# stop the old screen session
screen -X -S $JOB_NAME quit || echo "No screen session to stop"

# swap out old workspace with new one
mkdir -p /tmp/rm
mv $WORKSPACE /tmp/rm/$JOB_NAME || echo "No old workspace to move"
mv $WORKSPACE_TMP $WORKSPACE

# start the server in a screen session
screen -d -m -S $JOB_NAME npm start

# delete the old workspace files
rm -rf /tmp/rm/$JOB_NAME || echo "No old workspace to delete"

