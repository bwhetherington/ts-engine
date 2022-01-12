import {Data} from '@/core/serialize';

export interface Worker {
  postMessage(data: Data): void;
  onmessage?: ((event: MessageEvent) => void) | null;
  on?: (method: 'message', ...rest: any[]) => any;
  [key: string]: any;
}

export interface WorkerMethods {
  [method: string]: ((value: any) => any) | undefined;
}

export * from '@/core/worker/util';
