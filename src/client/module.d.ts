declare module '*.html' {
  const content: string;
  export default content;
}

declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare var __PRODUCTION__: boolean;
