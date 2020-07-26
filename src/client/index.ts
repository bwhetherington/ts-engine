import { BLACK, WHITE } from 'core/graphics/color';
import { NM } from 'core/net';
import { EM, StepEvent, Event } from 'core/event';
import { LM as InternalLogger } from 'core/log';
import { WM, Entity, CollisionEvent, shuntOutOf } from 'core/entity';
import { Geometry } from 'core/entity/Geometry';
import { SizedQueue } from 'core/util';
import { Rectangle, Vector } from 'core/geometry';

import { Timer, HDCanvas, Client, ClientLogger } from 'client/util';
import {
  UIM,
} from 'client/components';
import { CM } from 'core/graphics';
import { AM } from 'client/alert';
import { IM } from 'client/input';
import { PM } from 'core/player';

const LM = InternalLogger.forFile(__filename);

async function main(): Promise<void> {
  InternalLogger.initialize(new ClientLogger());
  // LM.setLogLevel("warn");

  UIM.initialize();

  const game = document.getElementById('game');

  const client = new Client();

  NM.initialize(client);
  WM.initialize();
  PM.initialize();
  CM.initialize();
  AM.initialize();

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

    EM.addListener('StepEvent', (step: Event<StepEvent>) => {
      CM.update();
      WM.render(canvas);
    });

    const frameTimes = new SizedQueue<number>(60);

    const timer = new Timer((dt) => {
      frameTimes.enqueue(dt);
      let sum = 0;
      for (const elem of frameTimes.iterator()) {
        sum += elem;
      }
      // LM.debug("fps: " + 1 / (sum / frameTimes.size()));
      const fps = 1 / (sum / frameTimes.size());
      const rounded = Math.round(fps);
      const label = rounded.toString();

      const element = document.getElementById('fps-label');
      if (element) {
        element.innerText = label;
      }

      EM.step(dt);
    });

    timer.start();
  }
}

main().catch(alert);
