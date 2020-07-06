import { sleep } from 'core/util';

import { EM } from 'core/event';
import { Timer, ServerLogger } from 'server/util';
import { LM } from 'core/log';
import { Server, createServer, ServerHTTPClient } from 'server/net';
import { NM } from 'core/net';

import { exec } from 'child_process';

type DamageEvent = {
  amount: number;
};

type StepEvent = {
  dt: number;
};

// async function main(): Promise<void> {
//   // If we are in dev mode
//   if (process.env.DEV_MODE) {
//     exec('npm run watch:client', (err, stdout, stderr) => {
//       console.log(stdout);
//       console.error(stderr);
//     });
//   }

//   LM.initialize(new ServerLogger());
//   LM.info('Hello, world!');

//   const httpServer = await createServer({
//     dir: './',
//     index: './static/index.html',
//   });

//   const server = new Server();
//   server.initialize(httpServer);
//   NM.initialize(server);
//   server.start(8080);

//   EM.addListener('NetworkMessageEvent', (msg) => {
//     LM.debug('receive: ' + JSON.stringify(msg));
//   });

//   const timer = new Timer((dt) => {
//     NM.send({ foo: 'foo', bar: 'bar' });
//     EM.step(dt);
//   });

//   await timer.start();
// }

async function main(): Promise<void> {
  const client = new ServerHTTPClient();
  const res = await client.get('http://reqres.in/api/users?page=2');
  console.log(res);
}

main().catch((ex) => {
  LM.error('error occurred');
});
