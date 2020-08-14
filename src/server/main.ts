import { EM } from 'core/event';
import { Timer, ServerLogger, TM } from 'server/util';
import { LM as InternalLogger } from 'core/log';
import { Server, createServer, ServerHTTPClient } from 'server/net';
import { NM, SyncEvent } from 'core/net';
import { ChatManager } from 'server/chat';
import { WorldManager, Unit } from 'core/entity';
import { Geometry } from 'core/entity/Geometry';
import { Rectangle } from 'core/geometry';
import { PlayerManager } from 'core/player';
import { FM } from 'core/form';
import { registerJoinForm } from 'core/form';
import { MetricsManager } from 'server/metrics';
import { WeaponManager } from 'core/weapon';
import { readFile as readFileNonPromise } from 'fs';
import { promisify } from 'util';

const readFile = promisify(readFileNonPromise);

const LM = InternalLogger.forFile(__filename);

async function loadGeometry(file: string): Promise<void> {
  const text = await readFile(file, 'utf-8');
  const obj = JSON.parse(text);

  const { boundingBox, geometry } = obj;
  if (boundingBox && geometry) {
    WorldManager.boundingBox.deserialize(boundingBox);
    WorldManager.boundingBox.centerX = 0;
    WorldManager.boundingBox.centerY = 0;

    for (const element of geometry) {
      const rect = new Rectangle();
      const { x, y, width, height } = element;
      rect.width = width;
      rect.height = height;
      rect.centerX = x;
      rect.centerY = y;

      const entity = Geometry.fromRectangle(rect);
      WorldManager.add(entity);
    }
  }
}

async function main(): Promise<void> {
  InternalLogger.initialize(new ServerLogger());

  const httpServer = await createServer({
    dir: './',
    index: './static/index.html',
  });

  const server = new Server();
  server.initialize(httpServer);
  NetworkManager.initialize(server);
  ChatManager.initialize();
  server.start(parseInt(process.env.PORT ?? '0') || 8080);

  WorldManager.initialize();

  await loadGeometry('world.json');

  PlayerManager.initialize();
  FM.initialize();
  registerJoinForm();

  MetricsManager.initialize();
  WeaponManager.initialize();

  const ENTITIES = 0;
  for (let i = 0; i < ENTITIES; i++) {
    const entity = WorldManager.spawn(Unit);

    entity.color = {
      red: Math.random() * 0.2 + 0.7,
      green: Math.random() * 0.2 + 0.7,
      blue: Math.random() * 0.2 + 0.7,
    };

    const x = Math.random() * WorldManager.boundingBox.width + WorldManager.boundingBox.x;
    const y = Math.random() * WorldManager.boundingBox.height + WorldManager.boundingBox.y;

    const dx = (Math.random() - 0.5) * 200;
    const dy = (Math.random() - 0.5) * 200;

    entity.position.setXY(x, y);
    entity.velocity.setXY(dx, dy);
  }

  const timer = new Timer((dt) => {
    NetworkManager.send({ foo: 'foo', bar: 'bar' });
    EM.step(dt);

    const event = {
      type: 'SyncEvent',
      data: <SyncEvent>{
        worldData: WorldManager.diffState(),
        playerData: PlayerManager.diffState(),
      },
    };

    NetworkManager.send(event);
  }, 1 / 30);
  TM.initialize(timer);
}

main().catch((ex) => {
  LM.error('error occurred');
});
