import { sleep } from 'core/util';

import { EM } from 'core/event';
import { Timer, ServerLogger, TM } from 'server/util';
import { LM as InternalLogger } from 'core/log';
import { Server, createServer, ServerHTTPClient } from 'server/net';
import { NM } from 'core/net';
import { CM } from 'server/chat';

const LM = InternalLogger.forFile(__filename);

async function main(): Promise<void> {
  InternalLogger.initialize(new ServerLogger());

  const httpServer = await createServer({
    dir: './',
    index: './static/index.html',
  });

  const server = new Server();
  server.initialize(httpServer);
  NM.initialize(server);
  CM.initialize();
  server.start(parseInt(process.env.PORT ?? '0') || 8080);

  EM.addListener('NetworkMessageEvent', (msg) => {
    LM.debug('receive: ' + JSON.stringify(msg));
  });

  const timer = new Timer((dt) => {
    NM.send({ foo: 'foo', bar: 'bar' });
    EM.step(dt);
  });
  TM.initialize(timer);
}

main().catch((ex) => {
  LM.error('error occurred');
});
