import {NetworkManager} from 'core/net';
import {EventManager, StepEvent, Event} from 'core/event';
import {LogManager} from 'core/log';
import {WorldManager} from 'core/entity';
import {Timer, HDCanvas, Client, ClientLogger, loadFile} from 'client/util';
import {CameraManager} from 'core/graphics';
import {InputManager} from 'client/input';
import {PlayerManager, Player, PlayerLeaveEvent} from 'core/player';
import {FormManager} from 'core/form';
import {WeaponManager} from 'core/weapon';
import {loadReactUI} from 'client/components';
import {MetricsManager} from 'client/metrics';
import {AssetManager} from 'core/assets';
import {join} from 'client/util';

const log = LogManager.forFile(__filename);

async function main(): Promise<void> {
  LogManager.initialize('info', new ClientLogger());
  AssetManager.initialize((url) => loadFile(join('assets', url)));

  loadReactUI();

  const game = document.getElementById('game');

  const client = new Client();

  NetworkManager.initialize(client);
  WorldManager.initialize();
  PlayerManager.initialize();
  CameraManager.initialize();
  FormManager.initialize();
  WeaponManager.initialize();
  MetricsManager.initialize();

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

    const timer = new Timer((dt) => {
      EventManager.step(dt);
      CameraManager.update();
      WorldManager.render(canvas);
    });

    timer.start();

    const stream = EventManager.streamInterval(1);
    stream.drain();
  }
}

main().catch(console.error);
