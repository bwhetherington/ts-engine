import * as http from "http";
import * as fs from "fs";
import * as mime from "mime-types";
import * as path from "path";
import { promisify } from "util";
import LM from "../../shared/util/LogManager";

export const readFile = promisify(fs.readFile);

interface Options {
  dir: string;
  index: string;
  encoding?: string;
}

export async function createServer(options: Options): Promise<http.Server> {
  const { dir, index, encoding = "utf8" } = options;
  const indexFile = await readFile(index, encoding);

  return http.createServer(async (req, res) => {
    if (req.url !== undefined) {
      if (req.url === "/") {
        LM.warn("unsafe base url");
        LM.debug(`read index file: ${index}`);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(indexFile);
        res.end(() => {
          LM.debug("request completed");
        });
      } else {
        const filePath = path.join(dir, req.url);
        const mimeType = mime.lookup(path.extname(filePath)) || "text/plain";
        const file = await readFile(filePath, encoding);
        LM.debug(`read file: ${filePath} (${mimeType})`);
        res.writeHead(200, { "Content-Type": mimeType });
        res.write(file);
        res.end(() => {
          LM.debug("request completed");
        });
      }
    } else {
      res.writeHead(504, "No request URL specified.");
      res.end();
    }
  });
}
