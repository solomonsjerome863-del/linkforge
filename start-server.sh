#!/bin/bash
cd /home/z/my-project
while true; do
  echo "=== Starting server at $(date) ===" >> dev.log
  NODE_OPTIONS="--max-old-space-size=1024 --unhandled-rejections=warn" npx next dev -p 3000 >> dev.log 2>&1
  echo "=== Server died at $(date), restarting in 2s ===" >> dev.log
  sleep 2
done
