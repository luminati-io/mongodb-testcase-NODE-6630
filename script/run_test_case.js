const mongodb = require('mongodb');
const fs = require('fs');
const { inspect } = require('node:util');
const { setTimeout: sleep } = require('node:timers/promises');

let uri = 'mongodb://localhost:27020,localhost:27021/?replicaSet=rs_test';
let dbname = 'db';
let collection = 'coll';
let request = { _id: { $type: 'int' } };
let iters = 0;
let success = 0;

const findDurations = [];

let logEvery = async (ms) => {
  while (true) {
    const avg = (findDurations.reduce((acc, d) => (acc += d), 0) / findDurations.length) | 0;
    console.log(
      new Date(),
      `iterations: ${iters}, read documents: ${success}, avg duration: ${avg} ms, max duration: ${Math.max.apply(Math, findDurations) | 0} ms, ${findDurations.length} samples`
    );
    findDurations.length = 0;
    await sleep(ms);
  }
};

let do_native_requests_async = async coll => {
  try {
    let cursor = coll.find(request);
    const start = performance.now();
    await cursor.toArray();
    const end = performance.now();
    findDurations.push((end - start) | 0);
    success++;
  } catch (e) {
    console.log(e);
  }
  iters++;
};

let native_async = async () => {
  const client = new mongodb.MongoClient(uri);

  console.log('\nmongodb', (await client.db().admin().command({ buildInfo: 1 })).version);
  console.log('nodejs', process.version);
  console.log('driver', require('mongodb/package.json').version);
  console.log(
    'os',
    await fs.promises.readFile('/etc/os-release', 'utf8').then(
      content =>
        content
          .split('\n')
          .filter(l => l.startsWith('NAME=') || l.startsWith('VERSION='))
          .join(', '),
      () => 'no OS info'
    ),
    '\n'
  );

  client
    .on('serverHeartbeatFailed', failed => console.log('Unexpected! HB failure', failed.failure))
    .on('serverHeartbeatSucceeded', success =>
      console.log(
        inspect(
          {
            t: new Date().toISOString(),
            ...Object.fromEntries(
              Object.entries(success.reply)
                .filter(([k]) =>
                  [
                    'hosts',
                    'primary',
                    'me',
                    'isWritablePrimary',
                    'electionId',
                    'setVersion',
                    'secondary'
                  ].includes(k)
                )
                .toSorted(([k]) => (k === 'me' ? -1 : 1))
            )
          },
          { colors: false, breakLength: Infinity, depth: Infinity }
        )
      )
    )
    .on('topologyDescriptionChanged', change =>
      console.log(
        inspect(
          {
            t: new Date().toISOString(),
            prev: Object.fromEntries(
              Object.entries(change.previousDescription).filter(([k]) =>
                ['type', 'maxSetVersion', 'maxElectionId', 'stale'].includes(k)
              )
            ),
            next: Object.fromEntries(
              Object.entries(change.newDescription).filter(([k]) =>
                ['type', 'maxSetVersion', 'maxElectionId', 'stale'].includes(k)
              )
            )
          },
          { colors: false, breakLength: Infinity, depth: Infinity }
        )
      )
    );

  await client.connect();
  let db = client.db(dbname);
  let coll = db.collection(collection);

  void logEvery(5000);

  // After a min of normal run.
  void sleep(60_000).then(async () => {
    const client = new mongodb.MongoClient('mongodb://localhost:27020?directConnection=true');
    console.log(new Date(), 'stepping down', '='.repeat(50));
    await client.db().admin().command({ replSetStepDown: 60 });
    await client.close();
    await sleep(60_050);
    console.log(new Date(), 'expecting step up', '='.repeat(50));
  });

  while (true) {
    await do_native_requests_async(coll);
  }
};
let main_async = async () => {
  await native_async();
};
main_async();
