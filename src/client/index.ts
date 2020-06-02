import { square } from "../shared/util/util";

import EM from "../shared/event/EventManager";
import { GameEvent } from "../shared/event/util";
import { Queue, SizedQueue } from "../shared/util/queue";
import Timer from "./util/Timer";
import { HDCanvas } from "./util/canvas";

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
  console.log(game);
  if (game) {
    const canvas = new HDCanvas();
    canvas.attachTo(game);

    console.log("foo");
    let x = 10;
    let y = 10;
    EM.addListener("StepEvent", (step: StepEvent) => {
      canvas.begin();
      x += 20 * step.dt;
      y += 10 * step.dt;
      canvas.fill = "lightgrey";
      canvas.stroke = "grey";
      canvas.lineWidth = 5;
      canvas.rect(x, y, 60, 60);
    });
    const events = [DamageEvent.create(10), DamageEvent.create(5)];
    for (const event of events) {
      EM.emit(event);
    }
    const timer = new Timer((dt) => {
      console.log(dt);
      EM.step(dt);
    });
    timer.start();
  }
}

main().catch(console.log);
