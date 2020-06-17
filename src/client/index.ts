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

async function main() {
  LM.initialize(new ClientLogger());

  const game = document.getElementById("game");

  const client = new Client();
  NM.initialize(client);

  // EM.addListener("NetworkMessageEvent", (msg) => {
  //   LM.debug("receive: " + JSON.stringify(msg));
  // });

  NM.send({ foo: "foo", bar: "bar" });

  window.addEventListener("resize", console.log);
  console.log(game);
  if (game) {
    const canvas = new HDCanvas();
    canvas.attachTo(game);
    canvas.setSize(window.innerWidth, window.innerHeight);

    LM.error("Foo");
    LM.warn("Bar");

    let x = 10;
    let y = 10;
    EM.addListener("StepEvent", (step: StepEvent) => {
      canvas.begin();
      canvas.resetTransform();
      x += 20 * step.dt;
      y += 10 * step.dt;
      // canvas.rect(x - 5, y - 20, 200, 30, WHITE);
      // canvas.text(x, y, "Hello World!", {
      //   font: "Arial",
      //   size: "1em",
      //   color: BLACK,
      // });
      // canvas.rotate(x / 20);
      canvas.rect(50, 50, 60, 60, {
        red: 0,
        green: 0,
        blue: 1,
      });
      canvas.rect(50 + 70, 50, 60, 60, {
        red: 1,
        green: 0,
        blue: 0,
      });
      canvas.rect(50 + 140, 50, 60, 60, {
        red: 0,
        green: 1,
        blue: 0,
      });

      canvas.rect(50, 50 + 70, 60, 60, {
        red: Math.sqrt(0.068),
        green: Math.sqrt(0.068),
        blue: Math.sqrt(0.068),
      });
      canvas.rect(50 + 70, 50 + 70, 60, 60, {
        red: Math.sqrt(0.241),
        green: Math.sqrt(0.241),
        blue: Math.sqrt(0.241),
      });
      canvas.rect(50 + 140, 50 + 70, 60, 60, {
        red: Math.sqrt(0.691),
        green: Math.sqrt(0.691),
        blue: Math.sqrt(0.691),
      });

      NM.send({ message: "foo" });
    });
    const events = [DamageEvent.create(10), DamageEvent.create(5)];
    for (const event of events) {
      EM.emit(event);
    }
    const timer = new Timer((dt) => {
      EM.step(dt);
    });
    timer.start();
  }
}

main().catch(console.log);
