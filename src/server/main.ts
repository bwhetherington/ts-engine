import process from 'process';

import {EventManager, Event} from 'core/event';
import {LogManager} from 'core/log';
import {registerRenameForm} from 'core/form/rename';
import {isEmpty} from 'core/util/object';
import {RNGManager} from 'core/random';
import {BasicAuth} from 'core/net/http';
import {AssetManager} from 'core/assets';
import {NetworkManager, SyncEvent} from 'core/net';
import {WorldManager} from 'core/entity';
import {PlayerManager} from 'core/player';
import {FormManager} from 'core/form';
import {registerJoinForm} from 'core/form';
import {WeaponManager} from 'core/weapon';

import {Server, createServer, ServerHTTPClient} from 'server/net';
import {ChatManager} from 'server/chat';
import {MetricsManager} from 'server/metrics';
import {PluginManager, UtilsPlugin} from 'server/plugin';
import {FilterPlugin} from 'server/plugin/filter';
import {LoaderPlugin} from 'server/plugin/loader';
import {
  Timer,
  ServerLogger,
  TimerManager,
  loadFile,
  loadDirectory,
} from 'server/util';
import {ChatLogPlugin} from 'server/plugin/chatLog';
import {GamePlugin} from 'server/plugin/game';
import {UpgradeManager} from 'core/upgrade';
import {UpgradePlugin} from 'server/plugin/upgrade';
import {Config} from 'server/config';
import {SpawnPlugin} from 'server/plugin/spawn';

const log = LogManager.forFile(__filename);

async function main(): Promise<void> {
  LogManager.initialize('debug', new ServerLogger());
  AssetManager.initialize(loadFile, loadDirectory);

  const httpServer = await createServer({
    dirs: ['./static/', './build/client/'],
    index: './static/index.html',
  });

  const serverAuth: BasicAuth = {
    username: process.env.GAME_USERNAME ?? 'admin',
    password: process.env.GAME_PASSWORD ?? 'admin',
  };

  EventManager.initialize();

  const server = new Server();
  server.initialize(httpServer);
  NetworkManager.initialize(server, new ServerHTTPClient(serverAuth));
  ChatManager.initialize();
  server.start(parseInt(process.env.PORT ?? '0') || 8080);

  await WeaponManager.initialize();
  await WorldManager.initialize();
  await UpgradeManager.initialize();
  // await WorldManager.setLevel('arena');

  PlayerManager.initialize();
  FormManager.initialize();
  registerJoinForm();
  registerRenameForm();

  MetricsManager.initialize();
  await PluginManager.initialize(server);

  function sync() {
    const event: Event<SyncEvent> = {
      type: 'SyncEvent',
      data: {
        worldData: WorldManager.serialize(),
        playerData: PlayerManager.serialize(),
      },
    };

    if (!(isEmpty(event.data.worldData) && isEmpty(event.data.playerData))) {
      NetworkManager.sendEvent<SyncEvent>(event);
    }
  }

  const config = await Config.load('config/server.json');

  const timer = new Timer(async (dt) => {
    await EventManager.step(dt);
    sync();
  }, 1 / config.tickRate);
  TimerManager.initialize(timer);

  async function cleanup(): Promise<never> {
    await PlayerManager.cleanup();
    await PluginManager.cleanup();
    process.exit(0);
  }

  RNGManager.seed(Date.now());

  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);

  // Load plugins
  await PluginManager.loadPlugins([
    ChatLogPlugin,
    LoaderPlugin,
    FilterPlugin,
    GamePlugin,
    UtilsPlugin,
    UpgradePlugin,
    SpawnPlugin,
  ]);
}

main().catch((ex) => {
  log.error('error occurred');
  console.error(ex);
});
