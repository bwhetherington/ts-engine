import { square, sleep } from 'core/util/util';

import scheduler from 'core/event/EventManager';
import { GameEvent } from 'core/event/util';
import { Queue, SizedQueue } from 'core/util/queue';
import Timer from 'server/util/Timer';
import LM from 'core/util/LogManager';
import { createServer } from 'server/net/util';
import Server from 'server/net/Server';
import NM from 'core/net/NetworkManager';
import EM from 'core/event/EventManager';
import ServerLogger from 'server/util/ServerLogger';

import { exec } from 'child_process';

type DamageEvent = {
  amount: number;
};

type StepEvent = {
  dt: number;
};

async function main(): Promise<void> {
  // If we are in dev mode
  if (process.env.DEV_MODE) {
    exec('npm run watch:client', (err, stdout, stderr) => {
      console.log(stdout);
      console.error(stderr);
    });
  }

  LM.initialize(new ServerLogger());
  LM.info('Hello, world!');

  const httpServer = await createServer({
    dir: './',
    index: './static/index.html',
  });

  const server = new Server();
  server.initialize(httpServer);
  NM.initialize(server);
  server.start(8080);

  EM.addListener('NetworkMessageEvent', (msg) => {
    LM.debug('receive: ' + JSON.stringify(msg));
  });

  const timer = new Timer((dt) => {
    NM.send({ foo: 'foo', bar: 'bar' });
    scheduler.step(dt);
  });

  await timer.start();
}

main().catch((ex) => {
  LM.error('error occurred');
});
