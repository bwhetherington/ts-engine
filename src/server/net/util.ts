import * as http from 'http';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';
import {promisify} from 'util';
import {LogManager} from 'core/log';
import {Socket} from 'core/net';
import {EventData} from 'core/event';

const log = LogManager.forFile(__filename);

export const readFile = promisify(fs.readFile);

export type Mode = 'r' | 'w' | 'rw';

export function fileExists(path: fs.PathLike): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(path, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

interface Options {
  dirs: string[];
  index: string;
  encoding?: string;
}

export async function createServer(options: Options): Promise<http.Server> {
  const {dirs, index, encoding = 'utf8'} = options;

  return http.createServer(async (req, res) => {
    try {
      if (req.url !== undefined) {
        if (req.url === '/') {
          const file = await readFile(index, encoding);
          log.trace(`read file: '${index}'`);
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(file);
          res.end();
        } else {
          // Search for file in each static directory
          for (const dir of dirs) {
            const filePath = path.join(dir, req.url);
            if (await fileExists(filePath)) {
              const mimeType =
                mime.lookup(path.extname(filePath)) || 'text/plain';
              const file = await readFile(filePath, encoding);
              log.trace(`read file: '${filePath}' (${mimeType})`);
              res.writeHead(200, {'Content-Type': mimeType});
              res.write(file);
              res.end();
              return;
            }
          }
          log.error(`file ${req.url} does not exist`);
          res.writeHead(404, 'File not found');
          res.end();
        }
      } else {
        res.writeHead(504, 'No request URL specified.');
        res.end();
      }
    } catch (_) {
      log.error(`request triggered error: ${req.url}`);
      res.writeHead(500, 'Internal server error');
      res.end();
    }
  });
}
