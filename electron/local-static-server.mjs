import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

export const DEFAULT_STATIC_SERVER_HOST = "127.0.0.1";

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".webp", "image/webp"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".txt", "text/plain; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
]);

function getContentType(filePath) {
  return MIME_TYPES.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
}

export async function resolveStaticFile(rootDir, urlPath) {
  const normalizedPath = urlPath === "/" ? "/index.html" : String(urlPath || "/");
  const decodedPath = decodeURIComponent(normalizedPath);
  const resolvedPath = path.resolve(rootDir, `.${decodedPath}`);
  if (!resolvedPath.startsWith(rootDir)) {
    return null;
  }
  try {
    const stats = await fs.stat(resolvedPath);
    if (stats.isDirectory()) {
      const indexPath = path.join(resolvedPath, "index.html");
      await fs.access(indexPath);
      return indexPath;
    }
    return resolvedPath;
  } catch {
    return null;
  }
}

export function createStaticServer(rootDir, {
  host = DEFAULT_STATIC_SERVER_HOST,
  cacheControl = "no-store",
} = {}) {
  return http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${host}`);
      const filePath = await resolveStaticFile(rootDir, requestUrl.pathname);
      if (!filePath) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }
      const body = await fs.readFile(filePath);
      response.writeHead(200, {
        "Content-Type": getContentType(filePath),
        "Cache-Control": cacheControl,
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(String(error?.message || error || "Server error"));
    }
  });
}

export async function listenStaticServer(server, {
  host = DEFAULT_STATIC_SERVER_HOST,
  port = 0,
} = {}) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Impossible de recuperer le port du serveur local."));
        return;
      }
      resolve(address.port);
    });
  });
}

export async function startStaticServer(rootDir, options = {}) {
  const host = String(options.host || DEFAULT_STATIC_SERVER_HOST).trim() || DEFAULT_STATIC_SERVER_HOST;
  const server = createStaticServer(rootDir, {
    host,
    cacheControl: options.cacheControl,
  });
  const port = await listenStaticServer(server, {
    host,
    port: options.port,
  });
  return {
    host,
    port,
    rootDir,
    server,
    url: `http://${host}:${port}/`,
    close: () => new Promise((resolve) => {
      server.close(() => resolve());
    }),
  };
}
