#! /usr/bin/env bash

mkdir -p data/mongodb1
mkdir -p data/mongodb2

echo "Starting up mongod.."

mongod --fork --config ./mongo1.conf
mongod --fork --config ./mongo2.conf

echo "Populating DB.."

node populate_db.js
