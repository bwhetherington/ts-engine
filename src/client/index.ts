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
import { SizedQueue } from "../shared/util/queue";
import Rectangle from "../shared/util/rectangle";
import { CollisionEvent, shuntOutOf } from "../shared/entity/util";

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
  // LM.setLogLevel("warn");

  const game = document.getElementById("game");

  // const client = new Client();
  // NM.initialize(client);

  WM.initialize();

  // EM.addListener("NetworkMessageEvent", (msg) => {
  //   LM.debug("receive: " + JSON.stringify(msg));
  // });

  // NM.send({ foo: "foo", bar: "bar" });

  const cursorRect = new Rectangle(100, 70);

  game?.addEventListener("mousemove", (event) => {
    cursorRect.x = event.x - 256 - 50;
    cursorRect.y = event.y - 238 - 35;
  });

  if (game) {
    const canvas = new HDCanvas();
    canvas.attachTo(game);
    canvas.setSize(window.innerWidth, window.innerHeight);

    window.addEventListener("resize", () => {
      canvas.setSize(window.innerWidth, window.innerHeight);
    });

    const ENTITIES = 500;
    for (let i = 0; i < ENTITIES; i++) {
      const entity = new Entity();

      const x = (Math.random() - 0.5) * 400;
      const y = (Math.random() - 0.5) * 400;

      const dx = (Math.random() - 0.5) * 30;
      const dy = (Math.random() - 0.5) * 30;

      entity.position.setXY(x, y);
      entity.velocity.setXY(dx, dy);
      WM.addEntity(entity);
    }

    const geometry = new Entity();
    geometry.boundingBox = new Rectangle(100, 100);
    geometry.position.setXY(50, 50);
    geometry.collisionLayer = "geometry";
    WM.addEntity(geometry);

    const red = { red: 0.8, green: 0.4, blue: 0.2 };

    EM.addListener("CollisionEvent", (event: CollisionEvent) => {
      const { collider, collided } = event;
      if (
        collider.collisionLayer === "unit" &&
        collided.collisionLayer === "geometry"
      ) {
        LM.info("geometry");
        shuntOutOf(collider, collided.boundingBox);
      }
      // collider.color = BLACK;
      // LM.info(`collision: ${collider.id}, ${collided.id}`);
    });

    EM.addListener("StepEvent", (step: StepEvent) => {
      WM.step(step.dt);
      WM.render(canvas);

      for (const candidate of WM.quadTree.retrieve(cursorRect)) {
        candidate.color = BLACK;
      }

      canvas.rect(
        cursorRect.x,
        cursorRect.y,
        cursorRect.width,
        cursorRect.height,
        BLACK
      );
    });

    const frameTimes = new SizedQueue<number>(10);

    const timer = new Timer((dt) => {
      frameTimes.enqueue(dt);
      let sum = 0;
      for (const elem of frameTimes.iterator()) {
        sum += elem;
      }
      // LM.debug("fps: " + 1 / (sum / frameTimes.size()));
      const fps = 1 / (sum / frameTimes.size());
      const rounded = Math.round(fps * 100) / 100;
      const label = `FPS: ${rounded}`;
      EM.step(dt);
      canvas.text(10 - 250, 40 - 250 + 500, label, {
        color: { red: 1, green: 0, blue: 0 },
        size: "2em",
      });
    });

    timer.start();
  }
}

main().catch(alert);
