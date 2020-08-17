const subProcess = require('child_process');
const process = require('process');

class ServerManager {
  constructor() {
    this.servers = {};
  }

  start(port) {
    return new Promise((resolve, reject) => {
      const sub = subProcess.execFile('/usr/local/bin/npm', ['run', 'server', '--prefix', '/home/bwh/ts-engine'], {
        env: {
          ...process.env,
          PORT: port,
          NODE_ENV: 'production',
        }
      }, (error, stdout, stderr) => {
        console.log(stdout);
        console.error(stderr);
        console.error(error);
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  }
}

async function main() {
  const manager = new ServerManager();

  await Promise.all([
    manager.start(4000),
    manager.start(4001),
    manager.start(4002),
  ]);
}

main().catch(console.error);