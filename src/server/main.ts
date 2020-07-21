import { sleep } from 'core/util';

import { EM } from 'core/event';
import { Timer, ServerLogger, TM } from 'server/util';
import { LM as InternalLogger } from 'core/log';
import { Server, createServer, ServerHTTPClient } from 'server/net';
import { NM, SyncEvent } from 'core/net';
import { CM } from 'server/chat';
import { diff } from 'core/util/object';
import { WM, CollisionEvent, shuntOutOf, Entity } from 'core/entity';
import { Geometry } from 'core/entity/Geometry';
import { Rectangle } from 'core/geometry';
import { PM } from 'core/player';

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

  WM.initialize();

  const ENTITIES = 5;
  for (let i = 0; i < ENTITIES; i++) {
    const entity = new Entity();

    entity.color = {
      red: Math.random() * 0.2 + 0.7,
      green: Math.random() * 0.2 + 0.7,
      blue: Math.random() * 0.2 + 0.7,
    };

    const x = Math.random() * WM.boundingBox.width + WM.boundingBox.x;
    const y = Math.random() * WM.boundingBox.height + WM.boundingBox.y;

    const dx = (Math.random() - 0.5) * 200;
    const dy = (Math.random() - 0.5) * 200;

    entity.position.setXY(x, y);
    entity.velocity.setXY(dx, dy);
    WM.add(entity);
  }

  const geometry = [
    Rectangle.centered(225, 50, 200 / 2, 0),
    Rectangle.centered(500, 50, 0, -200),
    Rectangle.centered(500, 50, 0, 200),
    Rectangle.centered(50, 500, -200, 0),
    Rectangle.centered(50, 500, 200, 0),
    Rectangle.centered(100, 100, 0, 0),
  ];
  for (const element of geometry) {
    const entity = Geometry.fromRectangle(element);
    WM.add(entity);
  }

  const timer = new Timer((dt) => {
    NM.send({ foo: 'foo', bar: 'bar' });
    EM.step(dt);

    const event = {
      type: 'SyncEvent',
      data: <SyncEvent>{
        worldData: WM.diffState(),
        playerData: PM.diffState(),
      },
    };

    NM.send(event);
  }, 1 / 20);
  TM.initialize(timer);
}

main().catch((ex) => {
  LM.error('error occurred');
});
