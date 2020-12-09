import { NetworkManager } from 'core/net';
import { EventManager, StepEvent, Event } from 'core/event';
import { LogManager } from 'core/log';
import { WorldManager } from 'core/entity';
import { Timer, HDCanvas, Client, ClientLogger, loadFile } from 'client/util';
import { CameraManager } from 'core/graphics';
import { InputManager } from 'client/input';
import { PlayerManager, Player, PlayerLeaveEvent } from 'core/player';
import { FormManager } from 'core/form';
import { WeaponManager } from 'core/weapon';
import { TableUpdateEvent, TableRemoveRowEvent } from 'client/components/table';
import { registerComponents } from 'client/components';
import { loadReactUI } from 'client/components/react';
import { MetricsManager } from 'client/metrics';
import { AssetManager } from 'core/assets';
import { join } from 'client/util';

const log = LogManager.forFile(__filename);

async function main(): Promise<void> {
  LogManager.initialize('info', new ClientLogger());
  AssetManager.initialize((url) => loadFile(join('assets', url)));

  registerComponents();
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

main().catch(console.error);
