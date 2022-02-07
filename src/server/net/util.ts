import * as http from 'http';
import * as fs from 'fs';
import {stat, readFile, readdir} from 'fs/promises';
import * as mime from 'mime-types';
import * as path from 'path';
import {LogManager} from '@/core/log';

const log = LogManager.forFile(__filename);

export type Mode = 'r' | 'w' | 'rw';

enum PathType {
  File,
  Directory,
  None,
}

async function determinePathType(pathLike: fs.PathLike): Promise<PathType> {
  try {
    const statRes = await stat(pathLike);
    return statRes.isDirectory() ? PathType.Directory : PathType.File;
  } catch (ex) {
    return PathType.None;
  }
}

interface Options {
  dirs: string[];
  index: string;
}

async function handleFile(fp: string, res: http.ServerResponse): Promise<void> {
  const mimeType = mime.lookup(path.extname(fp)) || 'text/plain';
  const fileContents = await readFile(fp, 'utf-8');
  res.writeHead(200, {'Content-Type': mimeType});
  res.write(fileContents);
  res.end();
}

async function handleDirectory(
  fp: string,
  res: http.ServerResponse
): Promise<void> {
  const files = await readdir(fp);
  const filePaths = files.map((file) => path.join(fp, file));
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.write(JSON.stringify(filePaths));
  res.end();
}

export async function createServer(options: Options): Promise<http.Server> {
  const {dirs, index} = options;

  return http.createServer(async (req, res) => {
    try {
      if (req.url !== undefined) {
        if (req.url === '/') {
          const file = await readFile(index, 'utf-8');
          log.trace(`read file: '${index}'`);
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(file);
          res.end();
          return;
        } else {
          // Search for file in each static directory
          for (const dir of dirs) {
            const [queryPath, _params] = req.url.split('?');
            const filePath = path.join(dir, queryPath);
            const type = await determinePathType(filePath);
            switch (type) {
              case PathType.File:
                await handleFile(filePath, res);
                return;
              case PathType.Directory:
                await handleDirectory(filePath, res);
                return;
            }
          }

          // Failed to find the file in any directory
          log.error(`file ${req.url} does not exist`);
          res.writeHead(404, 'File not found');
          res.end();
          return;
        }
      } else {
        res.writeHead(504, 'No request URL specified.');
        res.end();
      }
    } catch (_) {
      log.error(`request triggered error: ${req.url ?? 'undefined'}`);
      res.writeHead(500, 'Internal server error');
      res.end();
    }
  });
}
