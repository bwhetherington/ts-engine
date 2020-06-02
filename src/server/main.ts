import { square } from "../shared/util/util";

import EM from "../shared/event/EventManager";
import { GameEvent } from "../shared/event/util";
import { Queue, SizedQueue } from "../shared/util/queue";
import Timer from "./util/Timer";

type DamageEvent = {
  amount: number;
};

type StepEvent = {
  dt: number;
};

async function main() {
  EM.addListener("StepEvent", (step: StepEvent) => {
    console.log("Step: " + step.dt);
  });
  EM.addListener("DamageEvent", (e: DamageEvent) => {
    console.log("Damage: " + e.amount);
  });
  const events = [
    {
      type: "DamageEvent",
      data: { amount: 10 },
    },
    {
      type: "DamageEvent",
      data: { amount: 5 },
    },
  ];
  for (const event of events) {
    EM.emit(event);
  }

  const timer = new Timer((dt) => {
    EM.step(dt);
  });
  timer.start();
}

main().catch(console.error);
