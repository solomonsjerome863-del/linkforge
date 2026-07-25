#!/bin/bash
while true; do
  cd /home/z/my-project
  node server.mjs >> dev.log 2>&1
  sleep 1
done
