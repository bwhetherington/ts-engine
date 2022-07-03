import process from 'process';

import {AlertEvent, AlertManager} from '@/core/alert';
import {AssetManager} from '@/core/assets';
import {ConfigManager} from '@/core/config';
import {EffectManager} from '@/core/effect';
import {WorldManager} from '@/core/entity';
import {EventManager} from '@/core/event';
import {FormManager} from '@/core/form';
import {registerJoinForm} from '@/core/form';
import {registerRenameForm} from '@/core/form/rename';
import {LogManager} from '@/core/log';
import {NetworkManager} from '@/core/net';
import {BasicAuth} from '@/core/net/http';
import {PlayerManager} from '@/core/player';
import {RNGManager} from '@/core/random';
import {SerializeManager} from '@/core/serialize';
import {UpgradeManager} from '@/core/upgrade';
import {WeaponManager} from '@/core/weapon';

import {ChatManager} from '@/server/chat';
import {Config} from '@/server/config';
import {MetricsManager} from '@/server/metrics';
import {Server, ServerHTTPClient, createServer} from '@/server/net';
import {PluginManager, ThemePlugin, UtilsPlugin} from '@/server/plugin';
import {ChatLogPlugin} from '@/server/plugin/chatLog';
import {FilterPlugin} from '@/server/plugin/filter';
import {GamePlugin} from '@/server/plugin/game';
import {LoaderPlugin} from '@/server/plugin/loader';
import {SpawnPlugin} from '@/server/plugin/spawn';
import {UpgradePlugin} from '@/server/plugin/upgrade';
import {
  ServerLogger,
  Timer,
  TimerManager,
  loadDirectory,
  loadFile,
} from '@/server/util';

import {LogKeysPlugin} from './plugin/keys';
import {SyncManager} from './syncManager';

async function main(): Promise<void> {
  LogManager.initialize('debug', new ServerLogger());
  AssetManager.initialize(loadFile, loadDirectory);
  await ConfigManager.initialize();

  const httpServer = await createServer({
    dirs: ['./static/', './build/client/'],
    index: './static/index.html',
  });

  const serverAuth: BasicAuth = {
    username: process.env.GAME_USERNAME ?? 'admin',
    password: process.env.GAME_PASSWORD ?? 'admin',
  };

  EventManager.initialize();
  SerializeManager.initialize();

  const server = new Server();
  server.initialize(httpServer);
  NetworkManager.initialize(server, new ServerHTTPClient(serverAuth));
  AlertManager.initialize((event: AlertEvent, target: number) => {
    NetworkManager.sendTypedEvent(AlertEvent, event, target);
  });
  ChatManager.initialize();
  server.start(parseInt(process.env.PORT ?? '0') || 8080);

  await WeaponManager.initialize();
  await WorldManager.initialize();
  await UpgradeManager.initialize();
  await EffectManager.initialize();
  // await WorldManager.setLevel('arena');

  PlayerManager.initialize();
  FormManager.initialize();
  registerJoinForm();
  registerRenameForm();

  MetricsManager.initialize();
  await PluginManager.initialize(server);

  const config = await Config.load('config/server.yml');

  const syncManager = new SyncManager();
  syncManager.initialize(config);

  const timer = new Timer(async (dt) => {
    await EventManager.step(dt);
  }, 1 / config.tickRate);
  TimerManager.initialize(timer);

  async function cleanup(): Promise<never> {
    await PlayerManager.cleanup();
    await PluginManager.cleanup();
    NetworkManager.stop();
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
    ThemePlugin,
    LogKeysPlugin,
  ]);
}

// eslint-disable-next-line
main().catch(console.error);
