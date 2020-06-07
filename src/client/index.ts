import { square } from "../shared/util/util";

import scheduler from "../shared/event/Scheduler";
import { GameEvent } from "../shared/event/util";
import { Queue, SizedQueue } from "../shared/util/queue";
import Timer from "./util/Timer";
import { HDCanvas } from "./util/canvas";
import logger from "../server/util/Logger";

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

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  x: number,
  y: number
): void {
  ctx.clearRect(0, 0, w, w);
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "grey";
  ctx.fillStyle = "lightGrey";
  ctx.rect(x, y, 60, 60);
  ctx.fill();
  ctx.stroke();
}

async function main() {
  const game = document.getElementById("game");

  window.addEventListener("resize", console.log);
  console.log(game);
  if (game) {
    const canvas = new HDCanvas();
    canvas.attachTo(game);
    canvas.setSize(window.innerWidth, window.innerHeight);

    let x = 10;
    let y = 10;
    scheduler.addListener("StepEvent", (step: StepEvent) => {
      // logger.info("" + step.dt);
      canvas.begin();
      canvas.resetTransform();
      x += 20 * step.dt;
      y += 10 * step.dt;
      // canvas.translate(x + 30, y + 30);
      canvas.rotate(x / 20);
      canvas.rect(0, 0, 60, 60, {
        red: 0.8,
        green: 0.1,
        blue: 0.1,
      });
    });
    const events = [DamageEvent.create(10), DamageEvent.create(5)];
    for (const event of events) {
      scheduler.emit(event);
    }
    const timer = new Timer((dt) => {
      scheduler.step(dt);
    });
    timer.start();
  }
}

main().catch(console.log);
