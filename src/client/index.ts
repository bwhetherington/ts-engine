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
  registerComponents,
  BarComponent,
  BarUpdateEvent,
} from 'client/components';
import { CM } from 'core/graphics';
import { AM } from 'client/alert';
import { IM } from 'client/input';
import { PM } from 'core/player';

const LM = InternalLogger.forFile(__filename);

async function main(): Promise<void> {
  InternalLogger.initialize(new ClientLogger());
  // LM.setLogLevel("warn");

  registerComponents();

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
    CM.setTargetXY(0, 0);

    IM.initialize(game);

    window.addEventListener('resize', () => {
      canvas.setSize(window.innerWidth, window.innerHeight);
    });

    const mouseBox = new Rectangle(50, 50);

    game.addEventListener('mousemove', (event) => {
      const { clientX, clientY } = event;
      const { x, y } = CM.translateMouse(clientX, clientY);

      // const x = clientX - gameX + WM.boundingBox.x - mouseBox.width / 2;
      // const y = clientY - gameY + WM.boundingBox.y - mouseBox.height / 2;

      mouseBox.centerX = x;
      mouseBox.centerY = y;
    });

    let counter = 0;

    EM.addListener('StepEvent', (step: Event<StepEvent>) => {
      counter += step.data.dt;
      while (counter >= 2) {
        counter -= 2;

        const event = {
          type: 'BarUpdateEvent',
          data: <BarUpdateEvent>{
            id: 'hp-bar',
            current: Math.random() * 100,
          },
        };
        EM.emit(event);
      }

      for (const entity of WM.getEntities()) {
        entity.highlight = false;
      }

      const candidates = WM.quadTree.retrieve(mouseBox);

      const element = document.getElementById('highlighted-label');
      if (element) {
        element.innerText = candidates.size.toString();
      }

      for (const candidate of candidates) {
        candidate.highlight = true;
      }

      CM.update();
      WM.render(canvas);

      canvas.setOptions({
        lineWidth: 1,
        doStroke: true,
        doFill: false,
      });

      canvas.rect(
        mouseBox.x,
        mouseBox.y,
        mouseBox.width,
        mouseBox.height,
        BLACK
      );

      canvas.setOptions({
        lineWidth: 5,
        doStroke: true,
        doFill: true,
      });
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
