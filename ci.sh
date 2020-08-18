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
# export JOB_NAME=factoid-master
#
# # Project-specific env vars
# export PORT=3000
#
# ./ci.sh

echo "--"
echo "Starting $JOB_NAME build on"
date

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
npm run clean || echo "No clean script found"

export NODE_ENV=production

npm run build || echo "No build script found"

if [ $COMMAND ]
then
	npm run $COMMAND
fi

# stop the old screen session
echo "Quitting old screen session..."
screen -S $JOB_NAME -X -p 0 stuff ^C && echo "Sent ^C" || echo "No screen session to ^C"
screen -S $JOB_NAME -X quit && echo "Quit old screen session" || echo "No screen session to stop"

#echo "Waiting a bit to let the old app exit..."
#sleep 30

# swap out old workspace with new one
echo "Replacing workspace..."
mkdir -p /tmp/rm
mv $WORKSPACE /tmp/rm/$JOB_NAME && echo "Moved old workspace to /tmp/rm" || echo "No old workspace to move"
mv $WORKSPACE_TMP $WORKSPACE
cd $WORKSPACE
echo "Replaced workspace"

# start the server in a screen session
echo "Starting new screen session..."
screen -d -m -S $JOB_NAME bash -c "npm run ${START_SCRIPT:-start} 2>&1 | tee ~/$JOB_NAME.screen.log"
echo "New screen session started"

# delete the old workspace files
echo "Deleting old workspace..."
rm -rf /tmp/rm/$JOB_NAME && echo "Old workspace deleted" || echo "No old workspace to delete"

echo "CI script complete"

