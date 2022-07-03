import {AlertEvent, AlertManager} from '@/core/alert';
import {AssetManager} from '@/core/assets';
import {ConfigManager} from '@/core/config';
import {EffectManager} from '@/core/effect';
import {WorldManager} from '@/core/entity';
import {EventManager} from '@/core/event';
import {FormManager} from '@/core/form';
import {CameraManager} from '@/core/graphics';
import {LogManager} from '@/core/log';
import {NetworkManager, PlayerInitializedEvent} from '@/core/net';
import {PlayerManager} from '@/core/player';
import {SerializeManager} from '@/core/serialize';
import {ThemeManager} from '@/core/theme';
import {UpgradeManager} from '@/core/upgrade';
import {WeaponManager} from '@/core/weapon';

import {loadReactUI} from '@/client/components';
import {InputManager} from '@/client/input';
import {MetricsManager} from '@/client/metrics';
import {
  Client,
  ClientLogger,
  HDCanvas,
  Timer,
  loadDirectory,
  loadFile,
} from '@/client/util';

const log = LogManager.forFile(__filename);

async function main(): Promise<void> {
  LogManager.initialize('debug', new ClientLogger());
  AssetManager.initialize(loadFile, loadDirectory);
  await ConfigManager.initialize();

  loadReactUI();

  const game = document.getElementById('game');

  const client = new Client();

  EventManager.initialize();
  SerializeManager.initialize();
  NetworkManager.initialize(client);
  await WeaponManager.initialize();
  await WorldManager.initialize();
  await UpgradeManager.initialize();
  await ThemeManager.initialize();
  await EffectManager.initialize();
  PlayerManager.initialize();
  CameraManager.initialize();
  FormManager.initialize();
  MetricsManager.initialize();
  NetworkManager.sendEvent<PlayerInitializedEvent>({
    type: 'PlayerInitializedEvent',
    data: {},
  });
  AlertManager.initialize((alert) => {
    EventManager.emitEvent(AlertEvent, alert);
  });

  log.debug('all managers initialized');

  if (game) {
    const canvas = HDCanvas.create();
    canvas.attachTo(game);
    canvas.setSize(window.innerWidth, window.innerHeight);
    CameraManager.setTargetXY(0, 0);

    InputManager.initialize(game);

    window.addEventListener('resize', () => {
      canvas.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('blur', () => {
      InputManager.reset();
    });

    const timer = new Timer(async (dt) => {
      await EventManager.step(dt);
      CameraManager.update();
      WorldManager.render(canvas);
    });

    timer.start();
  }
}

// eslint-disable-next-line
main().catch(console.error);
