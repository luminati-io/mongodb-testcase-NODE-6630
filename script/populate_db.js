#! /usr/bin/env node --unhandled-rejections=strict --enable-source-maps
const mdb = require('mongodb');
const { promisify } = require('node:util');
const { setTimeout } = require('node:timers');
const { MongoClient } = mdb;

const client = new MongoClient('mongodb://127.0.0.1:27020?directConnection=true&replicaSet=rs_test', { serverSelectionTimeoutMS: 5000 })

async function main() {
    await client.connect()
    const admin = client.db('admin')
    const replSetInitiate = await admin.command({
        replSetInitiate:
        {
            _id: "rs_test",
            version: 1,
            members: [
                {
                    _id: 0, host: "127.0.0.1:27020", priority: 2
                },
                {
                    _id: 1, host: "127.0.0.1:27021",
                },
            ]
        }
    })

    await promisify(setTimeout)(20_000)

    const rs_client = new MongoClient('mongodb://127.0.0.1:27020,127.0.0.1:27021?replicaSet=rs_test', { serverSelectionTimeoutMS: 5000 })
    rs_client.on('serverHeartbeatSucceeded', heartbeat => console.log({ hello: heartbeat.reply }))

    const coll = rs_client.db('db').collection('coll');
    const insert = await coll.insertMany(Array.from({ length: 5000 }, (_, _id) => ({ _id })))
    await rs_client.close()
}

main(process.argv)
    .catch(console.error)
    .finally(() => client.close())
