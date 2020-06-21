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
import Geometry from "../shared/entity/Geometry";
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

  if (game) {
    const canvas = new HDCanvas();
    canvas.attachTo(game);
    canvas.setSize(window.innerWidth, window.innerHeight);

    window.addEventListener("resize", () => {
      canvas.setSize(window.innerWidth, window.innerHeight);
    });

    const mouseBox = new Rectangle(50, 50);

    game.addEventListener("mousemove", (event) => {
      const { clientX, clientY } = event;
      const { x: gameX, y: gameY } = game.getBoundingClientRect();

      const x = clientX - gameX + WM.boundingBox.x - mouseBox.width / 2;
      const y = clientY - gameY + WM.boundingBox.y - mouseBox.height / 2;

      mouseBox.x = x;
      mouseBox.y = y;
    });

    const ENTITIES = 100;
    for (let i = 0; i < ENTITIES; i++) {
      const entity = new Entity();

      entity.color = {
        red: Math.random() * 0.2 + 0.7,
        green: Math.random() * 0.2 + 0.7,
        blue: Math.random() * 0.2 + 0.7,
      };

      const x = Math.random() * WM.boundingBox.width + WM.boundingBox.x;
      const y = Math.random() * WM.boundingBox.height + WM.boundingBox.y;

      const dx = (Math.random() - 0.5) * 200;
      const dy = (Math.random() - 0.5) * 200;

      entity.position.setXY(x, y);
      entity.velocity.setXY(dx, dy);
      WM.addEntity(entity);
    }

    const geometry = [
      Rectangle.centered(225, 50, 200 / 2, 0),
      Rectangle.centered(500, 50, 0, -200),
      Rectangle.centered(500, 50, 0, 200),
      Rectangle.centered(50, 500, -200, 0),
      Rectangle.centered(50, 500, 200, 0),
      Rectangle.centered(100, 100, 0, 0),
    ];
    for (const element of geometry) {
      const entity = new Geometry(element);
      WM.addEntity(entity);
    }

    EM.addListener("CollisionEvent", (event: CollisionEvent) => {
      const { collider, collided } = event;
      if (
        collider.collisionLayer === "unit" &&
        collided.collisionLayer === "geometry"
      ) {
        shuntOutOf(collider, collided.boundingBox);
      } else if (
        collider.collisionLayer === "unit" &&
        collided.collisionLayer === "unit"
      ) {
      }
    });

    EM.addListener("StepEvent", (step: StepEvent) => {
      WM.step(step.dt);

      for (const entity of WM.getEntities()) {
        entity.highlight = false;
      }

      const candidates = WM.quadTree.retrieve(mouseBox);

      const element = document.getElementById("highlighted-label");
      if (element) {
        element.innerText = candidates.size.toString();
      }

      for (const candidate of candidates) {
        candidate.highlight = true;
      }

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

      const element = document.getElementById("fps-label");
      if (element) {
        element.innerText = label;
      }

      EM.step(dt);
    });

    timer.start();
  }
}

main().catch(alert);
