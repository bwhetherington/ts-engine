import { WorkerMethods } from 'core/worker';

const methods: WorkerMethods = {
  square(x: number): number {
    return x * x;
  }
};

