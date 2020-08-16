import { NetworkManager } from 'core/net';
import { EventManager, StepEvent, Event } from 'core/event';
import { LogManager } from 'core/log';
import { WorldManager } from 'core/entity';

import { Timer, HDCanvas, Client, ClientLogger } from 'client/util';
import { UIM } from 'client/components';
import { CameraManager } from 'core/graphics';
import { AlertManager } from 'client/alert';
import { InputManager } from 'client/input';
import { PlayerManager } from 'core/player';
import { FormManager } from 'core/form';
import { WeaponManager } from 'core/weapon';
import { TextManager } from 'client/text';

import Work from 'worker-loader!client/test.worker.ts';
import { fibonacci } from './foo';

const log = LogManager.forFile(__filename);

function callWorker(worker: Work, data: any): Promise<any> {
  return new Promise((resolve) => {
    worker.postMessage(data);
    worker.onmessage = (event) => resolve(event.data);
  });
}

async function main(): Promise<void> {
  const work = new Work();
  callWorker(work, 10).then(console.log);

  LogManager.initialize('info', new ClientLogger());
  UIM.initialize();

  const game = document.getElementById('game');

  const client = new Client();

  NetworkManager.initialize(client);
  WorldManager.initialize();
  PlayerManager.initialize();
  CameraManager.initialize();
  AlertManager.initialize();
  FormManager.initialize();
  TextManager.initialize();
  WeaponManager.initialize();

  if (game) {
    const canvas = new HDCanvas();
    canvas.attachTo(game);
    canvas.setSize(window.innerWidth, window.innerHeight);
    canvas.pushOptions({
      lineWidth: 5,
      doFill: true,
      doStroke: true,
    });
    CameraManager.setTargetXY(0, 0);

    InputManager.initialize(game);

    window.addEventListener('resize', () => {
      canvas.setSize(window.innerWidth, window.innerHeight);
    });

    const timer = new Timer((dt) => {
      EventManager.step(dt);
      CameraManager.update();
      WorldManager.render(canvas);
    });

    await timer.start();
  }
}

main().catch(alert);
