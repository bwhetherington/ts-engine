import { fibonacci } from 'client/foo';

const ctx: Worker = self as any;

ctx.addEventListener('message', (event) => {
  const { data } = event;
  ctx.postMessage(fibonacci(data));
});