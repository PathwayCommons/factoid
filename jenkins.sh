#!/bin/bash

# Run this script in a Jenkins project config for continuous integration
#
# E.g. in "Build" > "Execute shell", specify:
#
# export FOO="bar" # set up your env vars for the server
# $WORKSPACE/jenkins.sh

export NODE_ENV=production
export BUILD_ID=dontKillMe

cd $WORKSPACE

# make sure we have all npm deps
npm install

# build
npm run clean
npm run build

# move the build to a safe dir (won't be implicitly deleted by new build)
mv $WORKSPACE $WORKSPACE-$BUILD_NUMBER
cd $WORKSPACE-$BUILD_NUMBER

# stop the server and make sure the old screen session is killed
npm stop || echo "No npm task to stop"
screen -X -S $JOB_NAME quit || echo "No screen session to stop"

# start the server in a screen session so jenkins doesn't kill it
screen -d -m -S $JOB_NAME npm start

# keep only the most recent prev build to rollback if needed
# (don't want to keep all and fill up the disk)
rm -r $WORKSPACE-prev || echo "No prev build to delete"
mv $WORKSPACE-`expr $BUILD_NUMBER - 1` $WORKSPACE-prev || echo "No prev build to be moved"
