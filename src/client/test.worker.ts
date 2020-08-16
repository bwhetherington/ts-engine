import { square } from 'client/foo';
import { sleep } from 'core/util';

const ctx: Worker = self as any;

ctx.addEventListener('message', async (event) => {
  const { data } = event;
  await sleep(1);
  ctx.postMessage(square(data) + 5);
})