import {NetworkManager, PlayerInitializedEvent} from 'core/net';
import {EventManager} from 'core/event';
import {LogManager} from 'core/log';
import {WorldManager} from 'core/entity';
import {
  Timer,
  HDCanvas,
  Client,
  ClientLogger,
  loadFile,
  loadDirectory,
} from 'client/util';
import {CameraManager} from 'core/graphics';
import {InputManager} from 'client/input';
import {PlayerManager} from 'core/player';
import {FormManager} from 'core/form';
import {WeaponManager} from 'core/weapon';
import {loadReactUI} from 'client/components';
import {MetricsManager} from 'client/metrics';
import {AssetManager} from 'core/assets';
import {UpgradeManager} from 'core/upgrade';
import {ThemeManager} from 'core/theme';
import {EffectManager} from 'core/effect';
import {AlertEvent, AlertManager} from 'core/alert';

const log = LogManager.forFile(__filename);

async function main(): Promise<void> {
  LogManager.initialize('debug', new ClientLogger());
  AssetManager.initialize(loadFile, loadDirectory);

  loadReactUI();

  const game = document.getElementById('game');

  const client = new Client();

  EventManager.initialize();
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
    EventManager.emit<AlertEvent>({
      type: 'AlertEvent',
      data: alert,
    });
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

// tslint:disable-next-line
main().catch(console.error);
