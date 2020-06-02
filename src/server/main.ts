import { square } from "../shared/util/util";

import scheduler from "../shared/event/Scheduler";
import { GameEvent } from "../shared/event/util";
import { Queue, SizedQueue } from "../shared/util/queue";
import Timer from "./util/Timer";
import logger from "./util/Logger";

type DamageEvent = {
  amount: number;
};

type StepEvent = {
  dt: number;
};

async function main() {
  scheduler.addListener("StepEvent", (step: StepEvent) => {
    logger.info("Step: " + step.dt);
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
    scheduler.emit(event);
  }

  const timer = new Timer((dt) => {
    scheduler.step(dt);
  });
  timer.start();
}

main().catch(console.error);
