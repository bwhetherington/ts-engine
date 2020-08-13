import { NM } from 'core/net';
import { EM, StepEvent, Event } from 'core/event';
import { LM as InternalLogger } from 'core/log';
import { WM } from 'core/entity';

import { Timer, HDCanvas, Client, ClientLogger } from 'client/util';
import { UIM } from 'client/components';
import { CM } from 'core/graphics';
import { AM } from 'client/alert';
import { IM } from 'client/input';
import { PlayerManager } from 'core/player';
import { FM } from 'core/form';
import { WeaponManager } from 'core/weapon';
import { TextManager } from 'client/text';

const LM = InternalLogger.forFile(__filename);

async function main(): Promise<void> {
  InternalLogger.initialize(new ClientLogger());
  // LM.setLogLevel("warn");

  UIM.initialize();

  const game = document.getElementById('game');

  const client = new Client();

  NM.initialize(client);
  WM.initialize();
  PlayerManager.initialize();
  CM.initialize();
  AM.initialize();
  FM.initialize();
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
    CM.setTargetXY(0, 0);

    IM.initialize(game);

    window.addEventListener('resize', () => {
      canvas.setSize(window.innerWidth, window.innerHeight);
    });

    const timer = new Timer((dt) => {
      EM.step(dt);
      CM.update();
      WM.render(canvas);
    });

    timer.start();
  }
}

main().catch(alert);
