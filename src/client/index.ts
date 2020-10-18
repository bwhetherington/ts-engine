import { NetworkManager } from 'core/net';
import { EventManager, StepEvent, Event } from 'core/event';
import { LogManager } from 'core/log';
import { WorldManager } from 'core/entity';

import { Timer, HDCanvas, Client, ClientLogger } from 'client/util';
import { CameraManager } from 'core/graphics';
import { AlertManager } from 'client/alert';
import { InputManager } from 'client/input';
import { PlayerManager, Player, PlayerLeaveEvent } from 'core/player';
import { FormManager } from 'core/form';
import { WeaponManager } from 'core/weapon';
import { TableUpdateEvent, TableRemoveRowEvent } from './components/table';
import { registerComponents } from 'client/components';
import { loadReactUI } from 'client/components/react';

const log = LogManager.forFile(__filename);

async function main(): Promise<void> {
  LogManager.initialize('info', new ClientLogger());
  registerComponents();
  loadReactUI('ui-pane');

  const game = document.getElementById('game');

  const client = new Client();

  NetworkManager.initialize(client);
  WorldManager.initialize();
  PlayerManager.initialize();
  CameraManager.initialize();
  AlertManager.initialize();
  FormManager.initialize();
  WeaponManager.initialize();

  // Scoreboard
  // EventManager.emit<TableUpdateEvent>({
  //   type: 'TableUpdateEvent',
  //   data: {
  //     id: 'scoreboard',
  //     data: {
  //       labels: [
  //         {
  //           field: 'name',
  //           value: 'Name',
  //         },
  //         {
  //           field: 'level',
  //           value: 'Level',
  //         },
  //         {
  //           field: 'ping',
  //           value: 'Ping',
  //         },
  //       ]
  //     }
  //   },
  // });

  EventManager.addListener<StepEvent>('StepEvent', () => {
    const players = PlayerManager.getPlayers()
      .filter((player) => player.hasJoined)
      .map((player) => ({
        id: player.id,
        name: player.name,
        level: player.hero?.getLevel() ?? 0,
        ping: Math.round(player.ping * 1000) + 'ms',
      }));
    const update = {
      type: 'TableUpdateEvent',
      data: {
        id: 'scoreboard',
        data: {
          rows: players,
        },
      },
    };
    EventManager.emit<TableUpdateEvent>(update);
  });

  EventManager.addListener<PlayerLeaveEvent>('PlayerLeaveEvent', (event) => {
    const { player } = event.data;
    EventManager.emit<TableRemoveRowEvent>({
      type: 'TableRemoveRowEvent',
      data: {
        id: 'scoreboard',
        row: player.id,
      },
    });
  });

  if (game) {
    const canvas = new HDCanvas();
    canvas.attachTo(game);
    canvas.setSize(window.innerWidth, window.innerHeight);
    canvas.pushOptions({
      lineWidth: 4,
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
