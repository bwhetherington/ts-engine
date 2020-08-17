import { fibonacci as fib } from 'client/foo';
import { WorkerMethods } from 'core/worker';
import { Data } from 'core/serialize';

const ctx: Worker = self as any;

const methods: WorkerMethods = {
  fibonacci(value: number): number {
    return fib(value);
  }
}

ctx.onmessage = (event) => {
  const { data } = event;
  const { method, value } = data;
  const func = methods[method];
  if (func) {
    ctx.postMessage(func(value));
  } else {
    ctx.postMessage(undefined);
  }
}