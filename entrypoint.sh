#!/bin/bash
npm run clean
npm run build
google-chrome-stable &
cd /home/appuser/app && npm run start