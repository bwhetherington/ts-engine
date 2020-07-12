import * as http from 'http';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';
import { promisify } from 'util';
import { LM } from 'core/log/LogManager';
import { Socket } from 'core/net';
import { EventData } from 'core/event';

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
  dir: string;
  index: string;
  encoding?: string;
}

export async function createServer(options: Options): Promise<http.Server> {
  const { dir, index, encoding = 'utf8' } = options;

  return http.createServer(async (req, res) => {
    try {
      if (req.url !== undefined) {
        if (req.url === '/') {
          const file = await readFile(index, encoding);
          LM.debug(`read file: ${index}`);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write(file);
          res.end();
        } else {
          const filePath = path.join(dir, req.url);
          if (await fileExists(filePath)) {
            const mimeType =
              mime.lookup(path.extname(filePath)) || 'text/plain';
            const file = await readFile(filePath, encoding);
            LM.debug(`read file: ${filePath} (${mimeType})`);
            res.writeHead(200, { 'Content-Type': mimeType });
            res.write(file);
            res.end();
          } else {
            LM.error(`file ${filePath} does not exist`);
            res.writeHead(404, 'File not found');
            res.end();
          }
        }
      } else {
        res.writeHead(504, 'No request URL specified.');
        res.end();
      }
    } catch (_) {
      LM.error(`request triggered error: ${req.url}`);
      res.writeHead(500, 'Internal server error');
      res.end();
    }
  });
}
