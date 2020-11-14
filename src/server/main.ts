import { EventManager } from 'core/event';
import { Timer, ServerLogger, TimerManager, loadWorld } from 'server/util';
import { LogManager } from 'core/log';
import { Server, createServer, ServerHTTPClient } from 'server/net';
import { NetworkManager, SyncEvent } from 'core/net';
import { ChatManager } from 'server/chat';
import { WorldManager, Unit } from 'core/entity';
import { PlayerManager } from 'core/player';
import { FormManager } from 'core/form';
import { registerJoinForm } from 'core/form';
import { MetricsManager } from 'server/metrics';
import { WeaponManager } from 'core/weapon';
import { readFile as readFileNonPromise } from 'fs';
import { promisify } from 'util';
import process from 'process';
import { registerRenameForm } from 'core/form/rename';
import { isEmpty } from 'core/util/object';
import { randomColor } from 'core/graphics/color';
import { RNGManager } from 'core/random';
import { BasicAuth } from 'core/net/http';

const readFile = promisify(readFileNonPromise);

const log = LogManager.forFile(__filename);

async function main(): Promise<void> {
  LogManager.initialize('debug', new ServerLogger());

  const httpServer = await createServer({
    dirs: ['./static/', './build/client/'],
    index: './static/index.html',
  });

  const serverAuth: BasicAuth = {
    username: process.env.GAME_USERNAME ?? 'admin',
    password: process.env.GAME_PASSWORD ?? 'admin',
  };

  const server = new Server();
  server.initialize(httpServer);
  NetworkManager.initialize(server, new ServerHTTPClient(serverAuth));
  ChatManager.initialize();
  server.start(parseInt(process.env.PORT ?? '0') || 8080);

  WorldManager.initialize();

  await loadWorld('open');

  PlayerManager.initialize();
  FormManager.initialize();
  registerJoinForm();
  registerRenameForm();

  MetricsManager.initialize();
  WeaponManager.initialize();

  if (process.send) {
    process.send({ type: 'ready' });
  }

  function sync() {
    const event = {
      type: 'SyncEvent',
      data: <SyncEvent>{
        worldData: WorldManager.diffState(),
        playerData: PlayerManager.diffState(),
      },
    };

    if (!(isEmpty(event.data.worldData) && isEmpty(event.data.playerData))) {
      NetworkManager.send(event);
    }
  }

  const timer = new Timer((dt) => {
    EventManager.step(dt);
    sync();
  }, 1 / 30);
  TimerManager.initialize(timer);

  async function cleanup(): Promise<never> {
    await PlayerManager.cleanup();
    process.exit(0);
  }

  EventManager.runPeriodic(1, () => {
    if (WorldManager.getEntityCount() < 40) {
      const type = RNGManager.nextBoolean(0.3) ? 'HeavyEnemy' : 'Enemy';
      const position = WorldManager.getRandomPosition();
      const entity = WorldManager.spawnEntity(type, position);
      entity.setColor(randomColor());
    }
  });

  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);
}

main().catch((ex) => {
  log.error('error occurred');
});
