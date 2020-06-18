import { square } from "../shared/util/util";

import { GameEvent } from "../shared/event/util";
import Timer from "./util/Timer";
import { HDCanvas } from "./util/canvas";
import { BLACK, WHITE } from "../shared/util/color";
import Client from "./util/NetClient";
import NM from "../shared/net/NetworkManager";
import EM from "../shared/event/EventManager";
import ClientLogger from "./util/ClientLogger";
import LM from "../shared/util/LogManager";
import WM from "../shared/entity/WorldManager";
import Entity from "../shared/entity/Entity";
import Vector from "../shared/util/vector";

class DamageEvent {
  public amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }

  public static create(amount: number): GameEvent {
    return { type: "DamageEvent", data: new DamageEvent(amount) };
  }
}

class StepEvent {
  public dt: number;

  constructor(dt: number) {
    this.dt = dt;
  }

  public static create(dt: number): GameEvent {
    return { type: "StepEvent", data: new StepEvent(dt) };
  }
}

async function main(): Promise<void> {
  LM.initialize(new ClientLogger());

  const game = document.getElementById("game");

  const client = new Client();
  NM.initialize(client);

  WM.initialize();

  // EM.addListener("NetworkMessageEvent", (msg) => {
  //   LM.debug("receive: " + JSON.stringify(msg));
  // });

  NM.send({ foo: "foo", bar: "bar" });

  if (game) {
    const canvas = new HDCanvas();
    canvas.attachTo(game);
    canvas.setSize(window.innerWidth, window.innerHeight);

    const ENTITIES = 20;
    for (let i = 0; i < ENTITIES; i++) {
      const entity = new Entity();

      const x = (Math.random() - 0.5) * 400;
      const y = (Math.random() - 0.5) * 400;

      const dx = (Math.random() - 0.5) * 120;
      const dy = (Math.random() - 0.5) * 120;

      entity.position.setXY(x, y);
      entity.velocity.setXY(dx, dy);
      WM.addEntity(entity);
    }

    EM.addListener("StepEvent", (step: StepEvent) => {
      WM.step(step.dt);
      WM.render(canvas);
    });

    const timer = new Timer((dt) => {
      EM.step(dt);
    });

    timer.start();
  }
}

main().catch(alert);