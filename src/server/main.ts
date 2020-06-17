import { square, sleep } from "../shared/util/util";

import scheduler from "../shared/event/EventManager";
import { GameEvent } from "../shared/event/util";
import { Queue, SizedQueue } from "../shared/util/queue";
import Timer from "./util/Timer";
import LM from "../shared/util/LogManager";
import { createServer } from "./net/util";
import Server from "./net/Server";
import NM from "../shared/net/NetworkManager";
import EM from "../shared/event/EventManager";
import ServerLogger from "./util/ServerLogger";

type DamageEvent = {
  amount: number;
};

type StepEvent = {
  dt: number;
};

async function main() {
  LM.initialize(new ServerLogger());
  LM.info("Hello, world!");
  const httpServer = await createServer({
    dir: "./",
    index: "./index.html",
  });
  const server = new Server();
  server.initialize(httpServer);
  NM.initialize(server);
  server.start(8080);

  EM.addListener("NetworkMessageEvent", (msg) => {
    LM.debug("receive: " + JSON.stringify(msg));
  });

  const timer = new Timer((dt) => {
    NM.send({ foo: "foo", bar: "bar" });
    scheduler.step(dt);
  });
  timer.start();

  // await sleep(3);

  // await timer.stop();
}

main().catch(console.error);
