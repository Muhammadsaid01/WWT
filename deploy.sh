#!/bin/bash

#Project: World Wide Travel (WWT)

git reset --hard 
git checkout main
git pull origin main

docker compose up -d 
